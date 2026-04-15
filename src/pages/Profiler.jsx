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
  const [checkingPath, setCheckingPath] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      const user = auth.currentUser;
      if (user) {
        // First check for active roadmap
        const roadmap = await dbService.getActiveRoadmap(user.uid);
        if (roadmap) setActivePath(roadmap);

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
      <div className="glass-panel form-card">
        <div className="header-text">
          <h2>Initialize Target Role</h2>
          <p className="text-muted">RoleForge AI will customize your learning trajectory.</p>
        </div>

        {activePath && (
          <div className="resume-card glass-panel mb-8 animate-slide-up">
            <div className="resume-info">
              <Zap size={20} color="var(--accent)" />
              <div>
                <h4>Resume Active Path</h4>
                <p className="text-sm text-muted">{activePath.role} • {activePath.stack}</p>
              </div>
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/dashboard', { state: activePath })}
            >
              Resume <ArrowRight size={14} />
            </button>
          </div>
        )}

        {checkingPath ? (
          <div className="full-center py-8">
            <Loader2 className="spinner" />
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="profiler-form">
          <div className="form-group">
            <label><Target size={18} /> Target Role</label>
            <input 
              type="text" 
              placeholder="e.g. Frontend Developer, Data Engineer"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              required 
            />
          </div>

          <div className="form-group row">
             <div className="col">
                <label><Zap size={18} /> Current Level</label>
                <select 
                  value={formData.level} 
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                >
                  <option value="Beginner">Beginner (No experience)</option>
                  <option value="Intermediate">Intermediate (Some basics)</option>
                  <option value="Advanced">Advanced (Looking to specialize)</option>
                </select>
             </div>
          </div>

          <div className="form-group">
            <label><Clock size={18} /> Time Constraint & Strategy</label>
            <div className="time-grid">
              {timeOptions.map(opt => (
                <div 
                  key={opt.value}
                  className={`time-card ${formData.timeConstraint === opt.value ? 'selected' : ''}`}
                  onClick={() => setFormData({ ...formData, timeConstraint: opt.value, strategy: opt.strategy })}
                >
                  <h4>{opt.value} <span className="badge">{opt.strategy}</span></h4>
                  <p>{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary full-width" disabled={!formData.role || saving}>
            {saving ? <Loader2 className="spinner" /> : 'Analyze Stack Options'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
