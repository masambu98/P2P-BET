import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          color: 'red',
          padding: '20px',
          margin: '20px',
          backgroundColor: '#1a1a1a',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>
            React Application Error
          </h2>
          <p style={{ marginBottom: '8px' }}>
            <strong>Error:</strong> {this.state.error.message}
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Stack:</strong>
          </p>
          <pre style={{
            backgroundColor: '#2a2a2a',
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            color: '#fff'
          }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  </React.StrictMode>,
)
