import UndoRedoStateful from '@/lib/undoRedoStateful'

const UNDO_REDO_LIMIT = 100 // TODO

const undoRedo = new UndoRedoStateful(UNDO_REDO_LIMIT, false)

export default undoRedo
