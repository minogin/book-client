class SizedStack {
  constructor(maxSize = null) {
    this.maxSize = maxSize
    this.stack = []
  }

  push(v) {
    if (this.maxSize) {
      while (this.stack.length >= this.maxSize) {
        this.stack.shift()
      }
    }

    this.stack.push(v)
  }

  pop() {
    return this.stack.pop()
  }

  clear() {
    this.stack.length = 0
  }
}

export default SizedStack
