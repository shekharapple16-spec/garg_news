import { AuthForm } from '../components/AuthForm'
import { BrandLogo } from '../components/BrandLogo'

export function LoginPage({ onLogin, onSignup, error, loading, mode = 'login', onSwitchMode }) {
  const isSignup = mode === 'signup'

  return (
    <div className="page-shell auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <BrandLogo className="brand-mark" size={56} alt="Garg News Channel logo" />
          <div>
            <p className="eyebrow">Regional newsroom</p>
            <h1>Garg News Channel</h1>
          </div>
        </div>

        <div className="auth-card__header">
          <p className="eyebrow">Admin access</p>
          <h2>{isSignup ? 'Create admin account' : 'Sign in'}</h2>
          <p className="muted-text">Ferozepur, Punjab</p>
        </div>

        <AuthForm
          onSubmit={isSignup ? onSignup : onLogin}
          loading={loading}
          error={error}
          mode={mode}
          onSwitchMode={onSwitchMode}
        />
      </div>
    </div>
  )
}
