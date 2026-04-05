import { baseApi } from './baseApi'

export const watchPartyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createWatchParty: builder.mutation({
      query: (body) => ({ url: '/watch-parties', method: 'POST', body }),
      invalidatesTags: ['WatchParty']
    }),
    getWatchParty: builder.query({
      query: (id) => `/watch-parties/${id}`,
      providesTags: (result, error, id) => [{ type: 'WatchParty', id }]
    }),
    getMyParties: builder.query({
      query: () => '/watch-parties/mine',
      providesTags: ['WatchParty']
    }),
    getPublicParties: builder.query({
      query: (q = '') => `/watch-parties/public${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      providesTags: ['WatchParty']
    }),
    inviteToParty: builder.mutation({
      query: ({ id, userIds }) => ({ url: `/watch-parties/${id}/invite`, method: 'POST', body: { userIds } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WatchParty', id }]
    }),
    joinParty: builder.mutation({
      query: (id) => ({ url: `/watch-parties/${id}/join`, method: 'POST' }),
      invalidatesTags: ['WatchParty']
    }),
    startParty: builder.mutation({
      query: (id) => ({ url: `/watch-parties/${id}/start`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'WatchParty', id }]
    }),
    endParty: builder.mutation({
      query: (id) => ({ url: `/watch-parties/${id}/end`, method: 'PATCH' }),
      invalidatesTags: (result, error, id) => [{ type: 'WatchParty', id }]
    }),
    rsvpToParty: builder.mutation({
      query: ({ id, action }) => ({ url: `/watch-parties/${id}/rsvp`, method: 'PATCH', body: { action } }),
      invalidatesTags: ['WatchParty']
    }),
    updateWatchParty: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/watch-parties/${id}`, method: 'PATCH', body }),
      invalidatesTags: (result, error, { id }) => [{ type: 'WatchParty', id }, 'WatchParty']
    })
  })
})

export const {
  useCreateWatchPartyMutation, useGetWatchPartyQuery, useGetMyPartiesQuery,
  useGetPublicPartiesQuery, useInviteToPartyMutation, useJoinPartyMutation,
  useStartPartyMutation, useEndPartyMutation, useRsvpToPartyMutation, useUpdateWatchPartyMutation
} = watchPartyApi
