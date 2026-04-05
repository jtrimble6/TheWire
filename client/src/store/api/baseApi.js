import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Content', 'Review', 'Rating', 'Community', 'Feed', 'Watchlist', 'User', 'Notification', 'List'],
  endpoints: () => ({})
})
