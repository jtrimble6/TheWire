import { baseApi } from './baseApi'

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReviewsByContent: builder.query({
      query: ({ contentItemId, page = 1, sort = 'newest' }) =>
        `/reviews/content/${contentItemId}?page=${page}&sort=${sort}`,
      providesTags: (result, error, { contentItemId }) => [{ type: 'Review', id: contentItemId }]
    }),
    createReview: builder.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: (result, error, { contentItemId }) => [
        { type: 'Review', id: contentItemId },
        { type: 'Content', id: contentItemId }
      ]
    }),
    updateReview: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/reviews/${id}`, method: 'PUT', body }),
      invalidatesTags: (result) => [{ type: 'Review', id: result?.review?.contentItemId }]
    }),
    deleteReview: builder.mutation({
      query: ({ id, contentItemId }) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { contentItemId }) => [{ type: 'Review', id: contentItemId }]
    }),
    toggleReviewLike: builder.mutation({
      query: (id) => ({ url: `/reviews/${id}/like`, method: 'POST' }),
      invalidatesTags: ['Review', 'Feed']
    })
  })
})

export const {
  useGetReviewsByContentQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useToggleReviewLikeMutation
} = reviewApi
