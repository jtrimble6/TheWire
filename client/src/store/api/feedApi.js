import { baseApi } from './baseApi'

export const feedApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGlobalFeed: builder.query({
      query: ({ page = 1, sort = 'new' } = {}) => `/feed?page=${page}&sort=${sort}`,
      providesTags: ['Feed']
    }),
    getMyFeed: builder.query({
      query: ({ page = 1 } = {}) => `/feed/me?page=${page}`,
      providesTags: ['Feed']
    }),
    getFollowingFeed: builder.query({
      query: ({ page = 1 } = {}) => `/feed/following?page=${page}`,
      providesTags: ['Feed']
    }),
    getCommunitiesFeed: builder.query({
      query: ({ page = 1 } = {}) => `/feed/communities?page=${page}`,
      providesTags: ['Feed']
    })
  })
})

export const {
  useGetGlobalFeedQuery,
  useGetMyFeedQuery,
  useGetFollowingFeedQuery,
  useGetCommunitiesFeedQuery
} = feedApi
