const LEFT = 'left';
const RIGHT = 'right';
const DOWN = 'down';
const UP = 'up';
const gameField = document.getElementById('snakeField');
const settings = { elem: gameField, width: 10, height: 10, speed: 10, speedIncreaseRate: 1, onfinish: null };

const getRadomIntWithinInterval = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomInt = (min, max, exceptions) => {
  let maybe;

  if (!exceptions) return maybe;

  do {
    maybe = getRadomIntWithinInterval(min, max);
  } while (exceptions.includes(maybe));

  return maybe;
};

const getInterval = (speed) => 1000 / speed;

const createMovesCalculator = ({ width, height }) => {
  const maxInd = width * height - 1;
  const total = width * height;

  const isLeftBorder = (n) => n % width === 0;
  const isRightBorder = (n) => (n + 1) % width === 0;
  const isTopBorder = (n) => n <= width - 1;
  const isBottomBorder = (n) => n >= total - width;

  return (head, direction) => {
    switch (direction) {
      case UP:
        return isTopBorder(head) ? head + total - width : head - width;
      case DOWN:
        return isBottomBorder(head) ? head - total + width : head + width;
      case LEFT:
        return isLeftBorder(head) ? head + width - 1 : head - 1;
      case RIGHT:
        return isRightBorder(head) ? head - width + 1 : head + 1;
    }
  };
};

const getInitialSnakeCoords = ({ width, height }) => {
  if (height < 2) throw new Error('height of the field must be greater than 1!');

  // - y-координата головы от верха, начиная с 0
  const headY = Math.ceil((height - 2) / 2);
  const headX = Math.floor(width / 2);
  const headN = headY * width + headX;

  const tailN = headN + width;
  return [tailN, headN];
};

const createNewGame = ({ elem, width, height, speed, speedIncreaseRate, onfinish }) => {
  const snake = createSnake();

  const field = createField({ elem, width, height });
  const maxFieldIndex = width * height - 1;
  const generateNewApple = (snakeSequence) => getRandomInt(0, maxFieldIndex, snakeOnField.sequence);
  const snakeOnField = placeSnakeToField(snake, field);
  const calculateNextMoveTarget = createMovesCalculator({ width, height });

  let isPlaying = false;
  let apple = null;
  let lastChoosenDirection = null;
  let nextMoveTarget = null;
  let lastMoveDirection = null;
  let timer = null;
  const updateDirection = () => (nextMoveTarget = calculateNextMoveTarget(snakeOnField.head, lastChoosenDirection));

  const startNewGame = () => {
    if (isPlaying) endGame();

    snakeOnField.place(...getInitialSnakeCoords({ width, height }));
    apple = generateNewApple(snakeOnField.sequence);
    field.renderApple(apple);
    lastChoosenDirection = UP;
    updateDirection();
    timer = setInterval(commitMove, getInterval(speed));
    document.addEventListener('keydown', keydownHandler);
    isPlaying = true;
  };

  const keydownHandler = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const head = snakeOnField.head;
    const getDirection = (key) =>
      ({
        ArrowLeft: LEFT,
        ArrowRight: RIGHT,
        ArrowUp: UP,
        ArrowDown: DOWN,
      }[key]);

    const getOppositeDirection = (direction) =>
      ({
        [UP]: DOWN,
        [DOWN]: UP,
        [LEFT]: RIGHT,
        [RIGHT]: LEFT,
      }[direction]);

    const areOppositeDirections = (direction1, direction2) => direction1 === getOppositeDirection(direction2);

    const newSupposedDirection = getDirection(e.key);

    if (areOppositeDirections(lastMoveDirection, newSupposedDirection)) {
      return;
    }
    lastChoosenDirection = newSupposedDirection;
    updateDirection();
    return;
  };

  const commitMove = () => {
    const sequence = snakeOnField.sequence;

    if (nextMoveTarget === apple) {
      snakeOnField.feed(apple);
      apple = generateNewApple(snakeOnField.sequence);
      field.renderApple(apple);

      if (speedIncreaseRate) {
        clearInterval(timer);
        speed = speed * speedIncreaseRate;
        timer = setInterval(commitMove, getInterval(speed));
      }

      lastMoveDirection = lastChoosenDirection;
      updateDirection();
      return;
    } else if (
      sequence.includes(nextMoveTarget) &&
      nextMoveTarget !== sequence[0] &&
      nextMoveTarget !== sequence[sequence.length - 2]
    ) {
      return endGame();
    } else {
      snakeOnField.move(nextMoveTarget);
      lastMoveDirection = lastChoosenDirection;
      updateDirection();
    }
  };

  const endGame = () => {
    clearInterval(timer);
    document.removeEventListener('keydown', keydownHandler);
    snakeOnField.clear();
    isPlaying = false;
    typeof onfinish === 'function' && onfinish();
  };

  return {
    startNewGame() {
      startNewGame();
    },
    endGame() {
      endGame();
    },
    pause() {
      if (!isPlaying) return;

      clearInterval(timer);
      document.removeEventListener('keydown', keydownHandler);
    },
    continue() {
      if (isPlaying) return;
      timer = setInterval(commitMove, getInterval(speed));
      document.addEventListener('keydown', keydownHandler);
    },
    setOnFinishHook(val) {
      onfinish = val;
    },
  };
};

const createField = ({ elem, width, height }) => {
  const tmp = document.createDocumentFragment();
  const cellsCount = height * width;
  const cells = [];
  for (let i = 0; i < cellsCount; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cells.push(cell);
    tmp.append(cell);
  }
  elem.append(tmp);
  let apple;

  return {
    getCellByNumber(n) {
      return cells[n];
    },
    clearApple() {
      if (!apple) return false;
      apple.classList.remove('apple');
      return true;
    },
    renderApple(n) {
      apple = this.getCellByNumber(n);
      apple.classList.add('apple');
    },
    renderSnake(...cellNumbers) {
      cellNumbers.forEach((cellNumber) => {
        const cell = this.getCellByNumber(cellNumber);
        cell.classList.add('snake');
      });
    },
    clearSnake(...cellNumbers) {
      cellNumbers.forEach((cellNumber) => {
        const cell = this.getCellByNumber(cellNumber);
        cell.classList.remove('snake');
      });
    },
    clear() {
      cells.forEach((cell) => cell.classList.remove('snake', 'apple'));
    },
  };
};

const createSnake = () => {
  const snake = new Queue();

  return {
    place(...cells) {
      snake.clear();
      cells.forEach((cell) => snake.push(cell));
    },
    move(to) {
      snake.push(to);
      return snake.pop();
    },
    feed(apple) {
      snake.push(apple);
    },
    print() {
      return snake.print();
    },
    clear() {
      snake.clear();
    },
  };
};

//медиатор между змейкой и полем
const placeSnakeToField = (snake, field) => {
  let sequence = [];
  return {
    place(...cells) {
      snake.place(...cells);
      field.renderSnake(...cells);
      sequence.length = 0;
      sequence = sequence.concat(...cells);
    },
    move(to) {
      field.clearSnake(snake.move(to));
      field.renderSnake(to);
      sequence = snake.print();
    },
    feed(apple) {
      snake.feed(apple);
      field.clearApple();
      field.renderSnake(apple);
      sequence.push(apple);
    },
    get sequence() {
      return sequence.slice();
    },
    get head() {
      return sequence[sequence.length - 1];
    },
    clear() {
      field.clear();
      snake.clear();
    },
  };
};

let game = createNewGame({
  elem: gameField,
  width: 10,
  height: 10,
  speed: 10,
  speedIncreaseRate: 1,
  onfinish: null,
});

game.startNewGame();
