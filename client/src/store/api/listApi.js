import { baseApi } from './baseApi'

export const listApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyLists: builder.query({
      query: () => '/lists/me',
      providesTags: ['List']
    }),
    getUserLists: builder.query({
      query: (userId) => `/lists/user/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'List', id: userId }]
    }),
    getListById: builder.query({
      query: (id) => `/lists/${id}`,
      providesTags: (result, error, id) => [{ type: 'List', id }]
    }),
    createList: builder.mutation({
      query: (body) => ({ url: '/lists', method: 'POST', body }),
      invalidatesTags: ['List']
    }),
    updateList: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/lists/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => ['List', { type: 'List', id }]
    }),
    deleteList: builder.mutation({
      query: (id) => ({ url: `/lists/${id}`, method: 'DELETE' }),
      invalidatesTags: ['List']
    }),
    addToList: builder.mutation({
      query: ({ listId, contentItemId }) => ({
        url: `/lists/${listId}/items`,
        method: 'POST',
        body: { contentItemId }
      }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'List', id: listId }, 'List']
    }),
    removeFromList: builder.mutation({
      query: ({ listId, itemId }) => ({ url: `/lists/${listId}/items/${itemId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { listId }) => [{ type: 'List', id: listId }, 'List']
    })
  })
})

export const {
  useGetMyListsQuery,
  useGetUserListsQuery,
  useGetListByIdQuery,
  useCreateListMutation,
  useUpdateListMutation,
  useDeleteListMutation,
  useAddToListMutation,
  useRemoveFromListMutation
} = listApi
