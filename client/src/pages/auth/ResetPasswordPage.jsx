import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import API from '../../utils/API'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.')
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }
    setLoading(true)
    setError('')
    try {
      await API.auth.resetPassword(token, { password: form.password })
      navigate('/login', { state: { message: 'Password reset! You can now sign in.' } })
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>TheWire</h1>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={form.confirm}
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p><Link to="/login" className="link">Back to Sign In</Link></p>
    </div>
  )
}
