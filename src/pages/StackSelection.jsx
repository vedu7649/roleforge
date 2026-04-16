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
        <Cpu size={48} className="icon-pulse mb-4" color="var(--primary)" />
        <h2>Stack Intelligence</h2>
        <p className="text-muted mb-6">AI recommends the following stacks for {profile.role}</p>

        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={32} />
            <p>Analyzing optimum technologies...</p>
          </div>
        ) : error ? (
          <div className="error-state mb-4">
            <p className="text-danger mb-4">{error}</p>
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
                <h3>{stack}</h3>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleProceed}
          className="btn btn-primary full-width mt-6" 
          disabled={loading || !selectedStack || saving}
        >
          {saving ? <Loader2 className="spinner" /> : (
            <>Generate Roadmap <ArrowRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  );
}
