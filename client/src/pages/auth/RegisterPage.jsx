import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser, clearError } from '../../store/slices/authSlice'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' })

  const handleChange = (e) => {
    dispatch(clearError())
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(registerUser(form))
    if (registerUser.fulfilled.match(result)) navigate('/home')
  }

  return (
    <div className="auth-page">
      <h1>TheWire</h1>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <input name="displayName" placeholder="Display Name" value={form.displayName} onChange={handleChange} />
        <input name="username" placeholder="Username" value={form.username} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Sign in</Link></p>
    </div>
  )
}
