import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import API from '../../utils/API'
import { baseApi } from '../api/baseApi'

export const loginUser = createAsyncThunk('auth/login', async (credentials, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await API.auth.login(credentials)
    dispatch(baseApi.util.resetApiState())
    return data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await API.auth.register(userData)
    dispatch(baseApi.util.resetApiState())
    return data.user
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  await API.auth.logout()
  dispatch(baseApi.util.resetApiState())
})

export const checkSession = createAsyncThunk('auth/checkSession', async (_, { rejectWithValue }) => {
  try {
    const { data } = await API.auth.me()
    return data.user
  } catch {
    return rejectWithValue(null)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: false, loading: false, error: null },
  reducers: {
    clearError: (state) => { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; state.isAuthenticated = true })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(logoutUser.fulfilled, (state) => { state.user = null; state.isAuthenticated = false })
      .addCase(checkSession.fulfilled, (state, action) => { state.user = action.payload; state.isAuthenticated = true })
      .addCase(checkSession.rejected, (state) => { state.user = null; state.isAuthenticated = false })
  }
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
