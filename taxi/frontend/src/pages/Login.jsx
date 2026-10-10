import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, ArrowRight, ArrowLeft, Car } from 'lucide-react';

const Login = ({ onBackToWebsite }) => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(username, password);
    if (!res.success) {
      setError(res.error);
    }
  };

  const handleQuickLogin = async (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
    const res = await login(userVal, passVal);
    if (!res.success) {
      setError(res.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.65) 100%), url('/assets/luxury_fleet_bg.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      padding: '24px'
    }}>
      {/* Frosted Glassmorphism Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        padding: '44px 38px',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.75)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
      }}>
        {/* Back to Website Button */}
        {onBackToWebsite && (
          <div style={{ marginBottom: '16px' }}>
            <button
              type="button"
              onClick={onBackToWebsite}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid #cbd5e1',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={14} />
              <span>Back to Public Website</span>
            </button>
          </div>
        )}
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: '#1e293b',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
            marginBottom: '16px'
          }}>
            <Car size={28} color="#ffffff" />
          </div>
          <h1 style={{ 
            fontSize: '1.65rem', 
            fontWeight: 800, 
            color: '#0f172a', 
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            APEX FLEET
          </h1>
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#475569', 
            marginTop: '6px',
            letterSpacing: '0.01em',
            fontWeight: 500
          }}>
            Executive Fleet & Corporate Mobility Console
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            borderRadius: '12px',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              color: '#1e293b', 
              marginBottom: '6px',
              letterSpacing: '0.02em'
            }}>
              Operator Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-field"
                style={{ paddingLeft: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.95)' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '0.82rem', 
              fontWeight: 600, 
              color: '#1e293b', 
              marginBottom: '6px',
              letterSpacing: '0.02em'
            }}>
              Security Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.95)' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              padding: '13px', 
              marginTop: '8px', 
              borderRadius: '28px', 
              fontSize: '0.92rem',
              fontWeight: 600
            }}
          >
            {loading ? 'Verifying Credentials...' : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Preset Quick Login Buttons */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
          <p style={{ 
            fontSize: '0.72rem', 
            color: '#64748b', 
            textAlign: 'center', 
            marginBottom: '12px', 
            fontWeight: 600, 
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            Quick Access Demo Roles
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button
              onClick={() => handleQuickLogin('admin', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 14px', borderRadius: '16px' }}
            >
              Fleet Admin
            </button>
            <button
              onClick={() => handleQuickLogin('dispatcher1', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 14px', borderRadius: '16px' }}
            >
              Dispatcher
            </button>
            <button
              onClick={() => handleQuickLogin('driver_john', 'admin123')}
              className="btn-secondary"
              style={{ fontSize: '0.78rem', padding: '7px 14px', borderRadius: '16px' }}
            >
              Chauffeur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
