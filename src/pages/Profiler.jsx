import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import { useEffect } from 'react';
import './Profiler.css';

export default function Profiler() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    role: '',
    level: 'Beginner',
    timeConstraint: '3 months',
    strategy: 'Balanced'
  });
  const [saving, setSaving] = useState(false);
  const [activePath, setActivePath] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [checkingPath, setCheckingPath] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      const user = auth.currentUser;
      if (user) {
        // Get all roadmaps for this user
        const allRoadmaps = await dbService.listUserRoadmaps(user.uid);
        setAllCourses(allRoadmaps);

        // Find the active one
        const activeRoadmap = allRoadmaps.find(r => r.isActive);
        if (activeRoadmap) setActivePath(activeRoadmap);

        // Also check for existing profile draft
        const profile = await dbService.getUserProfile(user.uid);
        if (profile) {
          setFormData(prev => ({ ...prev, ...profile }));
        }
      }
      setCheckingPath(false);
    };
    checkExisting();
  }, []);

  const timeOptions = [
    { value: '1 month', strategy: 'Aggressive', desc: 'Skip depth, high intensity' },
    { value: '3 months', strategy: 'Balanced', desc: 'Core + some depth' },
    { value: '6 months', strategy: 'Deep', desc: 'Strong fundamentals + projects' },
    { value: '1 year', strategy: 'Mastery', desc: 'Full system + optimization' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) return;
    
    setSaving(true);
    const user = auth.currentUser;
    if (user) {
      await dbService.saveUserProfile(user.uid, formData);
    }

    // Still pass data forward as a fast-path, but it's now backed by Firebase
    setSaving(false);
    navigate('/stack-selection', { state: formData });
  };

  return (
    <div className="profiler-container main-content animate-fade-in">
      <div className="profiler-header">
        <h1>Initialize Your Path</h1>
        <p className="text-secondary text-lg">RoleForge AI will customize your technical trajectory based on your unique profile.</p>
      </div>

      <div className="profiler-grid">
        {/* CARD 1: INITIALIZATION */}
        <div className="profiler-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="status-icon-glow" style={{ width: '40px', height: '40px' }}>
              <Target size={20} className="text-accent" />
            </div>
            <h3 className="m-0 text-xl font-bold">Initialize New Role</h3>
          </div>
          
          {checkingPath ? (
            <div className="full-center py-12">
              <Loader2 className="spinner" size={32} />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profiler-form">
              <div className="form-group mb-4">
                <label className="text-sm font-bold uppercase tracking-wider text-muted mb-2">
                  <Target size={16} /> Target Role
                </label>
                <input 
                  type="text" 
                  className="answer-input"
                  placeholder="e.g. Frontend Developer, Data Engineer"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group mb-4">
                <label className="text-sm font-bold uppercase tracking-wider text-muted mb-2">
                  <Zap size={16} /> Current Level
                </label>
                <select 
                  className="answer-input"
                  value={formData.level} 
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Beginner">Beginner (No experience)</option>
                  <option value="Intermediate">Intermediate (Some basics)</option>
                  <option value="Advanced">Advanced (Looking to specialize)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-sm font-bold uppercase tracking-wider text-muted mb-4">
                  <Clock size={16} /> Time Constraint & Strategy
                </label>
                <div className="time-grid">
                  {timeOptions.map(opt => (
                    <div 
                      key={opt.value}
                      className={`time-card ${formData.timeConstraint === opt.value ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, timeConstraint: opt.value, strategy: opt.strategy })}
                    >
                      <h4 className="font-bold">{opt.value.split(' ')[0]} <span className="badge">{opt.strategy}</span></h4>
                      <p className="text-xs mt-2">{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary full-width mt-8 py-4 text-lg" disabled={!formData.role || saving}>
                {saving ? <Loader2 className="spinner" /> : 'Analyze Stack Options'}
                <ArrowRight size={20} />
              </button>
            </form>
          )}
        </div>

        {/* CARD 2: RESUME / RECENT */}
        <div className="glass-panel profiler-card resume-section">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={20} className="text-accent" />
            <h3 className="m-0">Resume Journey</h3>
          </div>
          <p className="text-muted text-sm mb-6">Continue where you left off in your active path.</p>

          {activePath ? (
            <div className="resume-active-path animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="m-0 text-primary">{activePath.role}</h4>
                  <p className="text-muted text-sm">{activePath.stack}</p>
                </div>
                <div className="badge">Active</div>
              </div>
              <button
                className="btn btn-primary full-width"
                onClick={() => navigate('/dashboard', { state: activePath })}
              >
                Enter Dashboard <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="empty-state py-8">
              <Target size={48} className="text-muted mb-4 opacity-20" />
              <p className="text-muted italic">No active path detected.</p>
            </div>
          )}

          {allCourses.length > 0 && (
            <div className="recent-paths-section mt-8">
              <h4 className="mb-4">Recent Trajectories</h4>
              <div className="recent-paths-list">
                {allCourses.slice(0, 3).map((course) => (
                  <div 
                    key={course.id} 
                    className="recent-path-item"
                    onClick={() => navigate('/dashboard', { state: course })}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="recent-path-info">
                      <h5>{course.role}</h5>
                      <p>{course.stack}</p>
                    </div>
                    <ArrowRight size={14} className="text-muted" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
