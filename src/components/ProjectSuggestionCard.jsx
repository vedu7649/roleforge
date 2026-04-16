import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Code, RefreshCw, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function ProjectSuggestionCard({ 
  initialData = null, 
  stack = '', 
  completedPhases = 0, 
  role = 'Developer',
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasSignaledLoad = React.useRef(false);

  const currentSuggestion = history[currentIndex] || null;

  const [refreshCooldown, setRefreshCooldown] = useState(0);

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

  const refreshSuggestion = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setIsGenerating(true);
    try {
      const avoidList = history.map(p => p.title);
      const newSuggestion = await aiService.generateProjectSuggestions(stack, completedPhases, role, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        const isDuplicate = lastBatch && newSuggestion && lastBatch.title === newSuggestion.title;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5);
          return prev;
        }

        const newHistory = [...prev, newSuggestion];
        setCurrentIndex(newHistory.length - 1);
        setRefreshCooldown(60); 
        return newHistory;
      });
    } catch (error) {
      console.error('Error refreshing project suggestion:', error);
      setRefreshCooldown(5);
    } finally {
      setIsGenerating(false);
    }
  }, [stack, completedPhases, role, history, refreshCooldown]);

  // Load initial data ONLY on first activation
  useEffect(() => {
    if (history.length > 0) {
      if (isActive && !hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
      return;
    }

    if (!isActive) return;

    const loadProject = async () => {
      setIsGenerating(true);
      try {
        const initialProject = await aiService.generateProjectSuggestions(stack, completedPhases, role, []);
        setHistory([initialProject]);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error loading project suggestion:', error);
      } finally {
        setIsGenerating(false);
        if (!hasSignaledLoad.current) {
          hasSignaledLoad.current = true;
          onLoadComplete();
        }
      }
    };
    loadProject();
  }, [stack, completedPhases, role, isActive, onLoadComplete, history.length]);

  const goPrev = () => setCurrentIndex(p => Math.max(0, p - 1));
  const goNext = () => setCurrentIndex(p => Math.min(history.length - 1, p + 1));

  return (
    <div className="dashboard-card project-suggestion-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Lightbulb size={24} color="var(--primary)" />
          <div>
            <h3>Project Discovery</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isGenerating ? 'Wait...' : `History: ${currentIndex + 1} / ${history.length}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {history.length > 1 && (
            <div className="history-controls" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', borderRadius: '8px', padding: '2px' }}>
              <button 
                className="btn-icon btn-xs" 
                onClick={goPrev} 
                disabled={currentIndex === 0 || loading || isGenerating}
                style={{ padding: '4px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 8px', minWidth: '40px', textAlign: 'center' }}>
                {currentIndex + 1}
              </span>
              <button 
                className="btn-icon btn-xs" 
                onClick={goNext} 
                disabled={currentIndex === history.length - 1 || loading || isGenerating}
                style={{ padding: '4px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm"
            onClick={refreshSuggestion}
            disabled={loading || isGenerating || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '110px' }}
          >
            <RefreshCw size={16} style={{ animation: (loading || isGenerating) ? 'spin 1s linear infinite' : 'none' }} />
            {isGenerating ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Idea'}
          </button>
        </div>
      </div>

      {(loading || isGenerating) ? (
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
          ✨ AI is generating personalized project suggestions...
        </div>
      ) : (
        <div className="suggestion-display animate-slide-up" style={{ marginTop: '1rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '1rem', border: '1px solid rgba(var(--primary-rgb), 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ 
                fontSize: '0.7rem', 
                fontWeight: 700, 
                color: 'var(--primary)', 
                background: 'rgba(var(--primary-rgb), 0.1)', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px',
                textTransform: 'uppercase'
              }}>
                {currentSuggestion?.type || 'Recommended'}
              </span>
            </div>
            
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {currentSuggestion?.title || 'System Architect Challenge'}
            </h4>
            
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {currentSuggestion?.description || 'Build a scalable application that utilizes your current tech stack effectively.'}
            </p>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>EXPECTED OUTCOME</span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {currentSuggestion?.expectedOutcome || 'Mastery of full-stack integration and production deployment.'}
              </p>
            </div>

            <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%', gap: '0.5rem' }}>
              Start Work <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
