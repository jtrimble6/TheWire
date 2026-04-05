import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const BASE_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL, credentials: 'include' }),
  tagTypes: ['Content', 'Review', 'Rating', 'Community', 'Feed', 'Watchlist', 'User', 'Notification', 'List'],
  endpoints: () => ({})
})
