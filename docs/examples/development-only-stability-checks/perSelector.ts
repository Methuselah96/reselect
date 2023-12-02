import { createSelector } from 'reselect'

interface RootState {
  todos: { id: number; completed: boolean }[]
  alerts: { id: number; read: boolean }[]
}

// Create a selector that double-checks the results of input selectors every time it runs.
const selectCompletedTodosLength = createSelector(
  [
    // This input selector will not be memoized properly since it always returns a new reference.
    (state: RootState) =>
      state.todos.filter(({ completed }) => completed === true)
  ],
  completedTodos => completedTodos.length,
  // Will override the global setting.
  { inputStabilityCheck: 'always' }
)
