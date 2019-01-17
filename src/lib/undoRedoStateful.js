const _ = require('lodash');

export default class UndoRedoStateful {
  constructor(limit = null, logging = false) {
    this.limit = limit
    this.logging = logging
    this.mementos = {}
    this.reset()
  }

  reset() {
    this.states = []
    this.currentState = -1
  }

  addMemento(id, memento) {
    if (!_.isString(id) || id == '')
      throw "Memento id must be a non-empty string"

    if (!_.isFunction(memento.save))
      throw "Memento must have 'save' method"

    if (!_.isFunction(memento.restore))
      throw "Memento must have 'restore' method"

    if (this.currentState > -1)
      throw 'Cannot add mementos after state has changed. This may lead to inconsistency. You may reset() before adding mementos.'

    this.mementos[id] = memento
  }

  save() {
    const state = {}

    for (const id in this.mementos) {
      const memento = this.mementos[id]
      const mementoState = memento.save()
      if (!mementoState)
        throw `Memento must return state`

      state[id] = _.cloneDeep(mementoState)
    }

    this.states.length = this.currentState + 1
    this.states.push(state)
    if (this.limit && this.currentState == this.limit)
      this.states.shift()
    else
      this.currentState++

    if (this.logging) {
      console.log('Saved state', state)
      console.log('States', this.states)
      console.log('Current state', this.currentState)
    }
  }

  undo() {
    if (this.currentState > 0) {
      this.currentState--
      const state = this.states[this.currentState]
      for (const id in this.mementos) {
        const memento = this.mementos[id]
        const mementoState = state[id]
        if (this.logging) {
          console.log('ID', id)
          console.log('Memento', memento)
          console.log('Memento state', mementoState)
        }
        memento.restore(_.cloneDeep(mementoState))
      }
      if (this.logging)
        console.log('Restored state', state)
    }
  }

  redo() {
    if (this.currentState < this.states.length - 1) {
      this.currentState++
      const state = this.states[this.currentState]
      for (const id in this.mementos) {
        const memento = this.mementos[id]
        const mementoState = state[id]
        memento.restore(_.cloneDeep(mementoState))
      }
      if (this.logging)
        console.log('Restored state', state)
    }
  }
}
