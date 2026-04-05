import { baseApi } from './baseApi'

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification']
    }),
    getUnreadCount: builder.query({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification']
    }),
    markNotificationsRead: builder.mutation({
      query: () => ({ url: '/notifications/read', method: 'PATCH' }),
      invalidatesTags: ['Notification']
    })
  })
})

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationsReadMutation
} = notificationApi
