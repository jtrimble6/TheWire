import { baseApi } from './baseApi'

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommentsByReview: builder.query({
      query: (reviewId) => `/posts/review/${reviewId}`,
      providesTags: (result, error, reviewId) => [{ type: 'Post', id: reviewId }]
    }),
    getCommentsByPost: builder.query({
      query: (postId) => `/posts/parent/${postId}`,
      providesTags: (result, error, postId) => [{ type: 'Post', id: `parent-${postId}` }]
    }),
    getCommentsByList: builder.query({
      query: (listId) => `/posts/list/${listId}`,
      providesTags: (result, error, listId) => [{ type: 'Post', id: `list-${listId}` }]
    }),
    createComment: builder.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: (result, error, { reviewId, parentId, listId }) => [
        ...(reviewId ? [{ type: 'Post', id: reviewId }] : []),
        ...(parentId ? [{ type: 'Post', id: `parent-${parentId}` }] : []),
        ...(listId ? [{ type: 'Post', id: `list-${listId}` }] : [])
      ]
    }),
    deleteComment: builder.mutation({
      query: ({ id }) => ({ url: `/posts/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { reviewId, parentId, listId }) => [
        ...(reviewId ? [{ type: 'Post', id: reviewId }] : []),
        ...(parentId ? [{ type: 'Post', id: `parent-${parentId}` }] : []),
        ...(listId ? [{ type: 'Post', id: `list-${listId}` }] : [])
      ]
    }),
    toggleCommentLike: builder.mutation({
      query: (id) => ({ url: `/posts/${id}/like`, method: 'POST' }),
      invalidatesTags: ['Post']
    })
  })
})

export const {
  useGetCommentsByReviewQuery,
  useGetCommentsByPostQuery,
  useGetCommentsByListQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentLikeMutation
} = postApi
