import { createSlice } from '@reduxjs/toolkit'

const feedSlice = createSlice({
  name: 'feed',
  initialState: { sortBy: 'latest', filterType: 'all' },
  reducers: {
    setSortBy: (state, action) => { state.sortBy = action.payload },
    setFilterType: (state, action) => { state.filterType = action.payload }
  }
})

export const { setSortBy, setFilterType } = feedSlice.actions
export default feedSlice.reducer
