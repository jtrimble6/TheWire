import { baseApi } from './baseApi'

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    searchContent: builder.query({
      query: ({ q, type, provider }) => {
        let url = `/content/search?q=${encodeURIComponent(q)}`
        if (type && type !== 'streaming') url += `&type=${type}`
        if (provider) url += `&provider=${provider}`
        return url
      },
      providesTags: ['Content']
    }),
    getTrending: builder.query({
      query: () => '/content/trending',
      providesTags: ['Content']
    }),
    getContentById: builder.query({
      query: (id) => `/content/${id}`,
      providesTags: (result, error, id) => [{ type: 'Content', id }]
    }),
    getContentMeta: builder.query({
      query: (id) => `/content/${id}/meta`,
      providesTags: (result, error, id) => [{ type: 'Content', id: `meta-${id}` }]
    }),
    getWatchProviders: builder.query({
      query: (id) => `/content/${id}/watch`,
      providesTags: (result, error, id) => [{ type: 'Content', id: `watch-${id}` }]
    }),
    browseByProvider: builder.query({
      query: ({ provider, mediaType = 'movie', page = 1 }) =>
        `/content/browse?provider=${provider}&mediaType=${mediaType}&page=${page}`,
      providesTags: ['Content']
    }),
    getRecommendations: builder.query({
      query: (id) => `/content/${id}/recommendations`,
      providesTags: (result, error, id) => [{ type: 'Content', id: `rec-${id}` }]
    })
  })
})

export const {
  useSearchContentQuery, useGetTrendingQuery, useGetContentByIdQuery,
  useGetContentMetaQuery, useGetWatchProvidersQuery, useBrowseByProviderQuery,
  useGetRecommendationsQuery
} = contentApi
