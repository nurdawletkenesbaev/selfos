// features/tasks/taskSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import {
  addTask,
  deleteTask,
  fetchTasks,
  updateTask,
} from '../../firebase/taskService'
// import { fetchTasks, addTask, deleteTask, updateTask } from "../../services/taskService";

// Async thunks
export const getTasks = createAsyncThunk('tasks/getTasks', fetchTasks)
export const createTask = createAsyncThunk('tasks/createTask', addTask)
export const removeTask = createAsyncThunk('tasks/removeTask', deleteTask)
export const editTask = createAsyncThunk('tasks/editTask', updateTask)

// Slice
const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(getTasks.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(getTasks.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })

      // ADD
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })

      // DELETE
      .addCase(removeTask.fulfilled, (state, action) => {
        state.items = state.items.filter((task) => task.id !== action.payload)
      })

      // UPDATE
      .addCase(editTask.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (task) => task.id === action.payload.id
        )
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
  },
})

export default taskSlice.reducer
