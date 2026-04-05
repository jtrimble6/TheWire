import { baseApi } from './baseApi'

export const ratingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyRating: builder.query({
      query: (contentItemId) => `/ratings/${contentItemId}/me`,
      providesTags: (result, error, contentItemId) => [{ type: 'Rating', id: contentItemId }]
    }),
    upsertRating: builder.mutation({
      query: (body) => ({ url: '/ratings', method: 'POST', body }),
      invalidatesTags: (result, error, { contentItemId }) => [
        { type: 'Rating', id: contentItemId },
        { type: 'Content', id: contentItemId },
        'Content'
      ]
    }),
    removeRating: builder.mutation({
      query: (contentItemId) => ({ url: `/ratings/${contentItemId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, contentItemId) => [
        { type: 'Rating', id: contentItemId },
        { type: 'Content', id: contentItemId },
        'Content'
      ]
    })
  })
})

export const { useGetMyRatingQuery, useUpsertRatingMutation, useRemoveRatingMutation } = ratingApi
