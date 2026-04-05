import { baseApi } from './baseApi'

export const reactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReactions: builder.query({
      query: (reviewId) => `/reactions/${reviewId}`,
      providesTags: (result, error, reviewId) => [{ type: 'Reaction', id: reviewId }]
    }),
    toggleReaction: builder.mutation({
      query: ({ reviewId, type }) => ({
        url: `/reactions/${reviewId}`,
        method: 'POST',
        body: { type }
      }),
      invalidatesTags: (result, error, { reviewId }) => [{ type: 'Reaction', id: reviewId }]
    }),
    migrateReactions: builder.mutation({
      query: () => ({ url: '/reactions/migrate', method: 'POST' })
    })
  })
})

export const { useGetReactionsQuery, useToggleReactionMutation, useMigrateReactionsMutation } = reactionApi
