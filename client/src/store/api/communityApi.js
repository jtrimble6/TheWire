import { baseApi } from './baseApi'

export const communityApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCommunities: builder.query({
      query: ({ q = '', page = 1 } = {}) => `/communities?q=${encodeURIComponent(q)}&page=${page}`,
      providesTags: ['Community']
    }),
    getMyCommunities: builder.query({
      query: () => '/communities/mine',
      providesTags: ['Community']
    }),
    getCommunityBySlug: builder.query({
      query: (slug) => `/communities/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Community', id: slug }]
    }),
    createCommunity: builder.mutation({
      query: (body) => ({ url: '/communities', method: 'POST', body }),
      invalidatesTags: ['Community']
    }),
    joinCommunity: builder.mutation({
      query: (slug) => ({ url: `/communities/${slug}/join`, method: 'POST' }),
      invalidatesTags: (result, error, slug) => [{ type: 'Community', id: slug }, 'Community', 'Feed']
    }),
    leaveCommunity: builder.mutation({
      query: (slug) => ({ url: `/communities/${slug}/leave`, method: 'POST' }),
      invalidatesTags: (result, error, slug) => [{ type: 'Community', id: slug }, 'Community', 'Feed']
    }),
    getCommunityPosts: builder.query({
      query: ({ slug, page = 1 }) => `/communities/${slug}/posts?page=${page}`,
      providesTags: (result, error, { slug }) => [{ type: 'Community', id: `posts-${slug}` }]
    }),
    createCommunityPost: builder.mutation({
      query: ({ slug, body }) => ({ url: `/communities/${slug}/posts`, method: 'POST', body: { body } }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Community', id: `posts-${slug}` }]
    }),
    deleteCommunityPost: builder.mutation({
      query: ({ slug, postId }) => ({ url: `/communities/${slug}/posts/${postId}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Community', id: `posts-${slug}` }]
    }),
    toggleCommunityPostLike: builder.mutation({
      query: ({ slug, postId }) => ({ url: `/communities/${slug}/posts/${postId}/like`, method: 'POST' }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Community', id: `posts-${slug}` }]
    }),
    inviteToCommunity: builder.mutation({
      query: ({ slug, usernames }) => ({ url: `/communities/${slug}/invite`, method: 'POST', body: { usernames } }),
      invalidatesTags: (result, error, { slug }) => [{ type: 'Community', id: slug }]
    })
  })
})

export const {
  useGetCommunitiesQuery,
  useGetMyCommunitiesQuery,
  useGetCommunityBySlugQuery,
  useCreateCommunityMutation,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
  useGetCommunityPostsQuery,
  useCreateCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useToggleCommunityPostLikeMutation,
  useInviteToCommunityMutation
} = communityApi
