import { baseApi } from './baseApi'

export const importApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    importCSV: builder.mutation({
      query: (formData) => ({
        url: '/import',
        method: 'POST',
        body: formData,
        // Don't set Content-Type — browser sets it with boundary for multipart
        formData: true
      }),
      invalidatesTags: ['Content', 'User']
    })
  })
})

export const { useImportCSVMutation } = importApi
