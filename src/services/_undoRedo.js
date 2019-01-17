import SizedStack from '@/util/sizedStack'

const LIMIT = 10   // TODO

const undoRedo = {
  undoStack: new SizedStack(LIMIT),
  redoStack: new SizedStack(LIMIT),

  push: function(undo, redo) {
    const action = {
      undo: undo,
      redo: redo
    }
    this.undoStack.push(action)
    this.redoStack.clear()
  },

  run: function (run, undo) {
    run()
    const action = {
      undo: undo,
      redo: run,
    }
    this.undoStack.push(action)
    this.redoStack.clear()
  },

  undo: function () {
    const action = this.undoStack.pop()
    if (action) {
      action.undo()
      this.redoStack.push(action)
    }
  },

  redo: function () {
    const action = this.redoStack.pop()
    if (action) {
      action.redo()
      this.undoStack.push(action)
    }
  },

  reset: function () {
    this.undoStack.clear()
  }
}

export default undoRedo
