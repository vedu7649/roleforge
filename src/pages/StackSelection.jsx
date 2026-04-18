import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { Cpu, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import './StackSelection.css';

export default function StackSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(location.state);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStack, setSelectedStack] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      let currentProfile = profile;
      setLoading(true);

      // If state is missing, recover from Firebase
      if (!currentProfile?.role) {
        const user = auth.currentUser;
        if (user) {
          const cloudProfile = await dbService.getUserProfile(user.uid);
          if (cloudProfile) {
            currentProfile = cloudProfile;
            setProfile(cloudProfile);
          }
        }
      }

      if (!currentProfile?.role) {
        setLoading(false);
        return;
      }

      try {
        const stacks = await aiService.getStackSuggestions(currentProfile.role);
        setSuggestions(stacks);
      } catch (err) {
        console.error("Stack suggestion error:", err);
        setError("Failed to fetch stack recommendations. AI quota might be exceeded.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [profile]);

  if (loading && !profile?.role) {
     return (
       <div className="full-center">
         <Loader2 className="spinner" size={48} />
       </div>
     );
  }

  if (!profile?.role && !loading) return <Navigate to="/" />;

  const handleProceed = async () => {
    if (!selectedStack) return;
    setSaving(true);

    const finalData = { ...profile, stack: selectedStack };
    const user = auth.currentUser;
    if (user) {
      await dbService.saveUserProfile(user.uid, finalData);
    }

    setSaving(false);
    navigate('/dashboard', { state: finalData });
  };

  return (
    <div className="stack-container main-content animate-fade-in">
      <div className="glass-panel form-card text-center">
        <div className="flex justify-center mb-6">
          <div className="status-icon-glow">
            <Cpu size={32} className="text-primary" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-2 tracking-tight">Stack Intelligence</h2>
        <p className="text-secondary mb-8">RoleForge AI recommends the optimum tech stacks for <span className="text-accent font-bold">{profile.role}</span></p>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={40} />
            <p className="text-muted tracking-wide uppercase text-xs font-bold">Analyzing market-ready technologies...</p>
          </div>
        ) : error ? (
          <div className="error-state mb-4 p-6 bg-danger/10 rounded-xl border border-danger/20">
            <p className="text-danger mb-4 font-medium">{error}</p>
            <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry Analysis</button>
          </div>
        ) : (
          <div className="stack-list">
            {suggestions.map((stack, idx) => (
              <div 
                key={idx} 
                className={`stack-card animate-slide-up ${selectedStack === stack ? 'selected' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => setSelectedStack(stack)}
              >
                <div className="flex items-center justify-between">
                   <h3 className="m-0">{stack}</h3>
                   {selectedStack === stack && <ArrowRight size={18} className="text-primary" />}
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleProceed}
          className="btn btn-primary full-width mt-10 py-4 text-lg" 
          disabled={loading || !selectedStack || saving}
        >
          {saving ? <Loader2 className="spinner" /> : (
            <>Finalize & Generate Roadmap <ArrowRight size={20} /></>
          )}
        </button>
      </div>
    </div>
  );
}
