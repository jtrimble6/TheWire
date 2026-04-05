import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { loginUser, clearError } from '../../store/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', password: '' })

  const successMessage = location.state?.message

  const handleChange = (e) => {
    dispatch(clearError())
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(loginUser(form))
    if (loginUser.fulfilled.match(result)) navigate('/home')
  }

  return (
    <div className="auth-page">
      <h1>TheWire</h1>
      <h2>Sign In</h2>
      {successMessage && <p className="form-success">{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p><Link to="/forgot-password" className="link">Forgot your password?</Link></p>
      <p>Don't have an account? <Link to="/register">Sign up</Link></p>
    </div>
  )
}
