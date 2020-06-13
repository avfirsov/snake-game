class Node {
  constructor(val, next) {
    this.val = val;
    this.next = next || null;
  }
}

class Queue {
  constructor(...elems) {
    this.clear();
    elems.forEach((elem) => this.push(elem));
  }

  push(...args) {
    if (args.length > 1) {
      args.forEach((arg) => this.push(arg));
      return this.size;
    }
    const newNode = new Node(args[0]);
    if (!this.size) {
      this.last = this.first = newNode;
    } else {
      this.last = this.last.next = newNode;
    }
    return ++this.size;
  }

  pop() {
    if (!this.size) return undefined;
    const currentHead = this.first;
    const newHead = currentHead.next;
    if (newHead) {
      this.first = newHead;
    } else {
      this.clear();
    }
    this.size--;
    return currentHead.val;
  }

  clear() {
    [this.first, this.last, this.size] = [null, null, 0];
  }

  print() {
    var arr = [];
    let current = this.first;
    while (current) {
      arr.push(current.val);
      current = current.next;
    }
    return arr;
  }
}
