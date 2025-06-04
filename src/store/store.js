import { configureStore } from '@reduxjs/toolkit'
import taskSlice from './slices/taskSlice'
// import taskReducer from "./features/tasks/taskSlice";

export const store = configureStore({
  reducer: {
    tasks: taskSlice,
  },
})
