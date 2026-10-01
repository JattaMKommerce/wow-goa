import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './index.css'
import App from './App.jsx'
import { SiteConfigProvider } from './context/SiteConfigContext.jsx'
import { CustomerCurrencyProvider } from './context/CustomerCurrencyContext.jsx'

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CRITICAL] Uncaught error caught by GlobalErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#0D1B2E', color: '#fff', padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', background: '#162840', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px' }}>⚠️</span>
              <div>
                <h3 style={{ margin: 0, color: '#FF6333', fontWeight: 700 }}>Something went wrong</h3>
                <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>An error occurred while rendering the page</p>
              </div>
            </div>

            <div style={{ background: '#09131F', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,99,51,0.3)', marginBottom: '24px', overflowX: 'auto' }}>
              <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '15px', marginBottom: '8px' }}>
                {this.state.error && this.state.error.toString()}
              </div>
              <pre style={{ color: '#94a3b8', fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo?.componentStack || this.state.error?.stack}
              </pre>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { localStorage.clear(); window.location.reload(); }}
                style={{ background: 'linear-gradient(90deg, #FF6333, #FF8A00)', border: 'none', color: '#fff', fontWeight: 600, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Clear Cache & Reload
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <SiteConfigProvider>
        <CustomerCurrencyProvider>
          <App />
        </CustomerCurrencyProvider>
      </SiteConfigProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
