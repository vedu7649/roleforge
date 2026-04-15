import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Loader2, SunMoon, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Profiler from './pages/Profiler';
import StackSelection from './pages/StackSelection';
import Dashboard from './pages/Dashboard';
import Interviewer from './pages/Interviewer';
import Auth from './pages/Auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('roleforge-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('roleforge-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    
    if (loading) {
      return (
        <div className="full-center flex-col" style={{ height: '70vh' }}>
          <Loader2 className="spinner" size={48} />
          <p className="mt-4 text-muted">Verifying Identity...</p>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
  };

  return (
    <Router>
      <div className="layout-container">
        <nav className="navbar">
          <Link to="/" className="nav-brand">
            {/* <BrainCircuit color="var(--primary)" size={28} /> */}
            <span className="brand-text">RoleForge <span className="brand-icon">AI</span></span>
          </Link>
          <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="btn btn-outline theme-toggle"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              aria-label="Toggle theme"
            >
              <SunMoon size={18} />
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: 0, minWidth: '40px', minHeight: '40px', borderRadius: '50%', overflow: 'hidden' }}
                  onClick={() => setProfileMenuOpen(prev => !prev)}
                  aria-label="Open profile menu"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} />
                  )}
                </button>
                {profileMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 0.5rem)',
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)',
                    padding: '0.75rem',
                    zIndex: 60,
                    width: '220px'
                  }}>
                    <div style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                      Logged in as
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{user.email}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.85rem' }}
                      onClick={() => {
                        setProfileMenuOpen(false);
                        signOut(auth);
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem'}}>Sign In</Link>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/login" element={<Auth />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Profiler />
            </ProtectedRoute>
          } />
          
          <Route path="/stack-selection" element={
            <ProtectedRoute>
              <StackSelection />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/interviewer" element={
            <ProtectedRoute>
              <Interviewer />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
