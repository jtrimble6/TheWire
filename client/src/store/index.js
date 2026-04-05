import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import feedReducer from './slices/feedSlice'
import { baseApi } from './api/baseApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feed: feedReducer,
    [baseApi.reducerPath]: baseApi.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware)
})
