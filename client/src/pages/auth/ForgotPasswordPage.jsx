import { useState } from 'react'
import { Link } from 'react-router-dom'
import API from '../../utils/API'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const { data } = await API.auth.forgotPassword({ email })
      setMessage(data.message)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>TheWire</h1>
      <h2>Forgot Password</h2>
      {message ? (
        <div>
          <p className="form-success">{message}</p>
          <p><Link to="/login" className="link">Back to Sign In</Link></p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="auth-subtext">Enter your email and we'll send you a link to reset your password.</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
    </div>
  )
}
