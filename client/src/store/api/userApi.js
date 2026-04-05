import { baseApi } from './baseApi'

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query({
      query: (username) => `/users/${username}`,
      providesTags: (result, error, username) => [{ type: 'User', id: username }]
    }),
    getUserReviews: builder.query({
      query: ({ username, page = 1 }) => `/users/${username}/reviews?page=${page}`,
      providesTags: (result, error, { username }) => [{ type: 'User', id: `reviews-${username}` }]
    }),
    followUser: builder.mutation({
      query: (username) => ({ url: `/users/${username}/follow`, method: 'POST' }),
      invalidatesTags: (result, error, username) => [{ type: 'User', id: username }, 'Feed']
    }),
    unfollowUser: builder.mutation({
      query: (username) => ({ url: `/users/${username}/unfollow`, method: 'POST' }),
      invalidatesTags: (result, error, username) => [{ type: 'User', id: username }, 'Feed']
    }),
    updateProfile: builder.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['User']
    }),
    searchUsers: builder.query({
      query: (q) => `/users?q=${encodeURIComponent(q)}`,
      providesTags: ['User']
    }),
    getFollowers: builder.query({
      query: (username) => `/users/${username}/followers`,
      providesTags: (result, error, username) => [{ type: 'User', id: `followers-${username}` }]
    }),
    getFollowing: builder.query({
      query: (username) => `/users/${username}/following`,
      providesTags: (result, error, username) => [{ type: 'User', id: `following-${username}` }]
    }),
    getSettings: builder.query({
      query: () => '/users/settings',
      providesTags: ['UserSettings']
    }),
    updateSettings: builder.mutation({
      query: (body) => ({ url: '/users/settings', method: 'PATCH', body }),
      invalidatesTags: ['UserSettings', 'User']
    }),
    getUserStats: builder.query({
      query: (username) => `/users/${username}/stats`,
      providesTags: (result, error, username) => [{ type: 'User', id: `stats-${username}` }]
    })
  })
})

export const {
  useGetProfileQuery,
  useGetUserReviewsQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useUpdateProfileMutation,
  useSearchUsersQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetUserStatsQuery
} = userApi
