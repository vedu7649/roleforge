import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Activity, BrainCircuit, Loader2, SunMoon, User, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Profiler from './pages/Profiler';
import StackSelection from './pages/StackSelection';
import Dashboard from './pages/Dashboard';
import Interviewer from './pages/Interviewer';
import Auth from './pages/Auth';
import Track from './pages/Track';
import Grind from './pages/Grind';
import Profile from './pages/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('roleforge-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return stored || (prefersDark ? 'dark' : 'light');
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  const Navbar = ({ user, theme, setTheme, profileMenuOpen, setProfileMenuOpen }) => {
    const location = useLocation();
    
    return (
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <span className="brand-text">RoleForge <span className="brand-icon">AI</span></span>
        </Link>
        
        {/* Desktop Links - Hidden on Mobile via CSS */}
        <div className="nav-links desktop-only">
          <Link to="/track" className={`nav-link ${location.pathname === '/track' ? 'active' : ''}`}>
            <Activity size={18} />
            <span>Track</span>
          </Link>
          <Link to="/grind" className={`nav-link ${location.pathname === '/grind' ? 'active' : ''}`}>
            <Zap size={18} />
            <span>Grind</span>
          </Link>
        </div>
        
        <div className="nav-actions">
          <button
            type="button"
            className="btn btn-outline theme-toggle"
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            aria-label="Toggle theme"
          >
            <SunMoon size={18} />
          </button>
          
          {user ? (
            <div className="profile-wrapper">
              <button
                type="button"
                className="btn btn-outline profile-trigger"
                onClick={() => setProfileMenuOpen(prev => !prev)}
                aria-label="Open profile menu"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="avatar-img" />
                ) : (
                  <User size={20} />
                )}
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-user-info">
                    Logged in as
                    <div className="user-email">{user.email}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      window.location.href = '/profile';
                    }}
                  >
                    My Courses
                  </button>
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
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </nav>
    );
  };

  const MobileBottomNav = ({ user }) => {
    const location = useLocation();
    if (!user) return null;

    return (
      <div className="mobile-bottom-nav">
        <Link to="/track" className={`mobile-nav-item ${location.pathname === '/track' ? 'active' : ''}`}>
          <Activity size={20} />
          <span>Track</span>
        </Link>
        <Link to="/grind" className={`mobile-nav-item ${location.pathname === '/grind' ? 'active' : ''}`}>
          <Zap size={20} />
          <span>Grind</span>
        </Link>
        <Link to="/profile" className={`mobile-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
          <User size={20} />
          <span>Me</span>
        </Link>
      </div>
    );
  };

  return (
    <Router>
      <div className="layout-container">
        <Navbar user={user} theme={theme} setTheme={setTheme} profileMenuOpen={profileMenuOpen} setProfileMenuOpen={setProfileMenuOpen} />
        
        <main className="main-content-wrapper">
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
            
            <Route path="/track" element={
              <ProtectedRoute>
                <Track />
              </ProtectedRoute>
            } />
            
            <Route path="/grind" element={
              <ProtectedRoute>
                <Grind />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/interviewer" element={
              <ProtectedRoute>
                <Interviewer />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <MobileBottomNav user={user} />
      </div>
    </Router>
  );
}

export default App;
