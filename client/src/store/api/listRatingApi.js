import { baseApi } from './baseApi'

export const listRatingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyListRating: builder.query({
      query: (listId) => `/list-ratings/${listId}/me`,
      providesTags: (result, error, listId) => [{ type: 'ListRating', id: listId }]
    }),
    upsertListRating: builder.mutation({
      query: ({ listId, score }) => ({
        url: `/list-ratings/${listId}`,
        method: 'POST',
        body: { score }
      }),
      invalidatesTags: (result, error, { listId }) => [
        { type: 'ListRating', id: listId },
        { type: 'List', id: listId }
      ]
    })
  })
})

export const { useGetMyListRatingQuery, useUpsertListRatingMutation } = listRatingApi
