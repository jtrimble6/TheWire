import { baseApi } from './baseApi'

export const watchlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWatchlist: builder.query({
      query: () => '/watchlist',
      providesTags: ['Watchlist']
    }),
    addToWatchlist: builder.mutation({
      query: (body) => ({ url: '/watchlist', method: 'POST', body }),
      invalidatesTags: ['Watchlist']
    }),
    updateWatchlistStatus: builder.mutation({
      query: ({ contentItemId, ...body }) => ({
        url: `/watchlist/${contentItemId}`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['Watchlist']
    }),
    removeFromWatchlist: builder.mutation({
      query: (contentItemId) => ({ url: `/watchlist/${contentItemId}`, method: 'DELETE' }),
      invalidatesTags: ['Watchlist']
    }),
    getMutualFollowers: builder.query({
      query: () => '/watchlist/mutual-followers',
      providesTags: ['Watchlist']
    }),
    suggestContent: builder.mutation({
      query: (body) => ({ url: '/watchlist/suggest', method: 'POST', body }),
      invalidatesTags: ['Watchlist']
    }),
    markWatched: builder.mutation({
      query: (contentItemId) => ({
        url: `/watchlist/${contentItemId}`,
        method: 'PATCH',
        body: { status: 'watched' }
      }),
      invalidatesTags: ['Watchlist']
    }),
    getWatchedHistory: builder.query({
      query: ({ page = 1 } = {}) => `/watchlist/history?page=${page}`,
      providesTags: ['Watchlist']
    })
  })
})

export const {
  useGetWatchlistQuery,
  useAddToWatchlistMutation,
  useUpdateWatchlistStatusMutation,
  useRemoveFromWatchlistMutation,
  useGetMutualFollowersQuery,
  useSuggestContentMutation,
  useMarkWatchedMutation,
  useGetWatchedHistoryQuery
} = watchlistApi
