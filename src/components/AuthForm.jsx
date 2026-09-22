import { useState } from 'react'

export function AuthForm({ onSubmit, loading, error, mode = 'login', onSwitchMode }) {
  const isSignup = mode === 'signup'
  const [form, setForm] = useState({
    username: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [localError, setLocalError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
    setLocalError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (isSignup) {
      if (!form.username.trim()) {
        setLocalError('Please enter your full name.')
        return
      }

      if (!form.mobile.trim()) {
        setLocalError('Please enter your mobile number.')
        return
      }

      if (form.password.trim().length < 6) {
        setLocalError('Password must be at least 6 characters long.')
        return
      }

      if (form.password !== form.confirmPassword) {
        setLocalError('Passwords do not match.')
        return
      }
    }

    setLocalError('')
    onSubmit({
      username: form.username,
      mobile: form.mobile,
      email: form.email,
      password: form.password,
    })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignup && (
        <>
          <div className="field-group">
            <label htmlFor="username">Full name</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter full name"
              required
              autoComplete="name"
            />
          </div>

          <div className="field-group">
            <label htmlFor="mobile">Mobile number</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter mobile number"
              required
              autoComplete="tel"
            />
          </div>
        </>
      )}

      <div className="field-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="admin@gargnews.in"
          required
          autoComplete="email"
        />
      </div>

      <div className="field-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder={isSignup ? 'Create a password' : 'Enter your password'}
          required
          autoComplete={isSignup ? 'new-password' : 'current-password'}
        />
      </div>

      {isSignup && (
        <div className="field-group">
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter password"
            required
            autoComplete="new-password"
          />
        </div>
      )}

      {(error || localError) && <p className="form-message form-message--error">{error || localError}</p>}

      <button type="submit" className="primary-button" disabled={loading}>
        {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Create account' : 'Login')}
      </button>

      {onSwitchMode && (
        <button type="button" className="text-button" onClick={onSwitchMode}>
          {isSignup ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      )}
    </form>
  )
}
