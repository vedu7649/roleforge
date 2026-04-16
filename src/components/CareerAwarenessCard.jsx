import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, ChevronLeft, ChevronRight, RefreshCw, Star, CheckCircle2 } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function CareerAwarenessCard({ 
  initialData = null, 
  role = 'Developer', 
  stack = '', 
  completedPhases = 0,
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const hasSignaledLoad = React.useRef(false);

  const guidance = history[currentIndex] || null;

  // Timer for cooldown
  useEffect(() => {
    let timer;
    if (refreshCooldown > 0) {
      timer = setInterval(() => {
        setRefreshCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [refreshCooldown]);

  const loadGuidance = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setLoading(true);
    try {
      const avoidList = history.map(g => g.role);
      const guidance = await aiService.generateCareerGuidance(role, stack, completedPhases, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        const isDuplicate = lastBatch && guidance && lastBatch.description === guidance.description;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5);
          return prev;
        }

        const newHistory = [...prev, guidance];
        setCurrentIndex(newHistory.length - 1);
        setRefreshCooldown(60);
        return newHistory;
      });
    } catch (error) {
      console.error('Error refreshing career guidance:', error);
      setRefreshCooldown(5);
    } finally {
      setLoading(false);
      if (!hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
    }
  }, [role, stack, completedPhases, history, onLoadComplete, refreshCooldown]);

  // Load AI-generated guidance ONLY on first activation
  useEffect(() => {
    if (history.length > 0) {
      if (isActive && !hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
      return;
    }

    if (isActive) {
      loadGuidance();
    }
  }, [isActive, history.length, loadGuidance, onLoadComplete]);

  const goPrev = () => setCurrentIndex(p => Math.max(0, p - 1));
  const goNext = () => setCurrentIndex(p => Math.min(history.length - 1, p + 1));

  return (
    <div className="dashboard-card career-awareness-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={24} color="var(--primary)" />
          <div>
            <h3>Career Mentorship</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {loading && history.length === 0 ? 'Wait...' : `History: ${currentIndex + 1} / ${history.length}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {history.length > 1 && (
            <div className="history-controls" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', borderRadius: '8px', padding: '2px' }}>
              <button 
                type="button"
                className="btn-icon btn-xs" 
                onClick={goPrev} 
                disabled={currentIndex === 0 || loading}
                style={{ padding: '4px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 8px', minWidth: '40px', textAlign: 'center' }}>
                {currentIndex + 1}
              </span>
              <button 
                type="button"
                className="btn-icon btn-xs" 
                onClick={goNext} 
                disabled={currentIndex === history.length - 1 || loading}
                style={{ padding: '4px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm"
            onClick={loadGuidance}
            disabled={loading || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '120px' }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Insight'}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ marginTop: '1rem' }}>
        {loading && history.length === 0 ? (
          <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            ✨ AI is analyzing market trends for your role...
          </div>
        ) : guidance ? (
          <div className="guidance-content animate-slide-up">
            <div className="role-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', padding: '0.4rem 1rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              <Star size={14} fill="var(--primary)" />
              {guidance.role || role}
            </div>
            
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {guidance.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem' }}>
              <div className="skills-section">
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>CORE SKILLS TO MASTER</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {guidance.skills?.map((skill, i) => (
                    <span key={i} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{skill}</span>
                  ))}
                </div>
              </div>

              <div className="workflow-section">
                <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase' }}>STRATEGIC DAILY WORKFLOW</span>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {guidance.workflow?.map((step, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={14} color="var(--primary)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No guidance loaded. Refresh to get mentorship.</p>
        )}
      </div>
    </div>
  );
}
