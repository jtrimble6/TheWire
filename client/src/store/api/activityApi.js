import { baseApi } from './baseApi'

export const activityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserActivity: builder.query({
      query: ({ username, page = 1 }) => `/activity/${username}?page=${page}`,
      providesTags: (result, error, { username }) => [{ type: 'Activity', id: username }]
    }),
    getActivityFeed: builder.query({
      query: ({ page = 1 } = {}) => `/activity/feed?page=${page}`,
      providesTags: ['Activity']
    })
  })
})

export const { useGetUserActivityQuery, useGetActivityFeedQuery } = activityApi
