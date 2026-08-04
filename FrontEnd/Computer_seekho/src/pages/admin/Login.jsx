import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArchMotif } from '../../components/ui/ui';
import GoogleSignInButton from '../../components/GoogleSignInButton';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function goToDestination() {
    const from = location.state?.from && location.state.from !== '/admin/login' ? location.state.from : '/admin/dashboard';
    navigate(from, { replace: true });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(username, password);
      goToDestination();
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your username and password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onGoogleSuccess(idToken) {
    setError('');
    try {
      await signInWithGoogle(idToken);
      goToDestination();
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    }
  }

  return (
    <div className="login-bg">
      <div className="login-left">
        <div className="brand brand-on-dark">
          <span className="brand-mark">CS</span>
          <span className="brand-word">Computer <br /> Seekho</span>
        </div>
        <h1 className="on-dark login-headline">Manage enquiries, admissions and website content.</h1>
        <p className="login-sub">
          Authorized staff can review follow-ups, register students, record fees, print receipts and maintain
          database-driven public content.
        </p>
        <div className="login-motif"><ArchMotif /></div>
      </div>
      <div className="login-right">
        <form className="card card-pad login-card" onSubmit={onSubmit}>
          <h2>Admin login</h2>
          <p className="muted" style={{ marginBottom: 20 }}>Use your authorized staff account.</p>
          {error && <p className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</p>}
          <div className="field" style={{ marginBottom: 14 }}>
            <label>Username or email</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
          </div>
          <div className="login-row">
            <label className="checkbox-row"><input type="checkbox" /> Remember me</label>
            <button type="button" className="link-btn-light" onClick={() => setShowForgot((v) => !v)}>Forgot password?</button>
          </div>
          {showForgot && (
            <p className="alert alert-info" style={{ marginBottom: 14 }}>
              Contact your institute administrator to reset your password.
            </p>
          )}
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Sign in'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e2e2e2' }} />
            <span className="muted" style={{ fontSize: 12 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: '#e2e2e2' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleSignInButton onSuccess={onGoogleSuccess} onError={(err) => setError(err.message)} />
          </div>

          <p className="login-foot">Restricted to authorized staff members only.</p>
        </form>
      </div>
    </div>
  );
}