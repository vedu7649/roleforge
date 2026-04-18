import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical System Error Detected:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="full-center flex-col p-8 text-center" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
          <div className="status-icon-glow mb-6" style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
            <AlertTriangle size={40} className="text-danger" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Neural Pathway Interrupted</h1>
          <p className="text-secondary max-w-md mb-8">
            The RoleForge engine encountered a critical disruption. This is often caused by missing configuration or rate limits.
          </p>

          <div className="glass-panel text-left p-4 mb-8" style={{ maxWidth: '600px', width: '100%', borderLeft: '4px solid var(--danger)' }}>
            <div className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Technical Analysis</div>
            <code style={{ fontSize: '0.8rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
              {this.state.error?.toString() || "Unknown Engine Failure"}
            </code>
          </div>

          <div className="flex gap-4">
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={18} /> Reboot System
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => window.location.href = '/'}
            >
              <Home size={18} /> Return Home
            </button>
          </div>
          
          <p className="mt-12 text-xs text-muted">
            If this persists, verify that your Environment Variables are correctly set in your deployment dashboard.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
