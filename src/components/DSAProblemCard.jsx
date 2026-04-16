import React, { useState, useEffect, useCallback } from 'react';
import { Code2, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function DSAProblemCard({ 
  initialData = null, 
  role = 'Developer', 
  completedTopics = [],
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasSignaledLoad = React.useRef(false);

  const problems = history[currentIndex] || [];

  const platformColors = {
    leetcode: '#FFB800',
    codechef: '#3776AB',
    codeforces: '#1F1C3F'
  };

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

  const refreshProblems = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setIsGenerating(true);
    try {
      const avoidList = history.map(batch => batch.map(p => p.title)).flat();
      const newProblems = await aiService.generateDSAProblems(role, completedTopics, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        const isDuplicate = lastBatch && newProblems && 
                           lastBatch[0]?.title === newProblems[0]?.title;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5); // Only 5 seconds wait for duplicates
          return prev;
        }

        const newHistory = [...prev, newProblems];
        setCurrentIndex(newHistory.length - 1);
        setRefreshCooldown(60); // Full 60s wait for successful new data
        return newHistory;
      });
    } catch (error) {
      console.error('Error refreshing DSA problems:', error);
      setRefreshCooldown(5); // 5s wait on total failure
    } finally {
      setIsGenerating(false);
    }
  }, [completedTopics, role, history, refreshCooldown]);

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

    const loadProblems = async () => {
      setIsGenerating(true);
      try {
        const initialProblems = await aiService.generateDSAProblems(role, completedTopics, []);
        setHistory([initialProblems]);
        setCurrentIndex(0);
      } catch (error) {
        console.error('Error loading DSA problems:', error);
      } finally {
        setIsGenerating(false);
        if (!hasSignaledLoad.current) {
          hasSignaledLoad.current = true;
          onLoadComplete();
        }
      }
    };
    loadProblems();
  }, [role, completedTopics, isActive, onLoadComplete, history.length]);

  const goPrev = () => setCurrentIndex(p => Math.max(0, p - 1));
  const goNext = () => setCurrentIndex(p => Math.min(history.length - 1, p + 1));

  return (
    <div className="dashboard-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Code2 size={24} color="var(--primary)" />
          <div>
            <h3>Daily DSA Practice</h3>
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
            onClick={refreshProblems}
            disabled={loading || isGenerating || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '120px' }}
          >
            <RefreshCw size={16} style={{ animation: (loading || isGenerating) ? 'spin 1s linear infinite' : 'none' }} />
            {isGenerating ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Problems'}
          </button>
        </div>
      </div>

      {(loading || isGenerating) ? (
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
          ✨ AI is generating personalized DSA problems...
        </div>
      ) : (
        <div className="card-grid-2" style={{ marginTop: '1rem' }}>
        {problems && Array.isArray(problems) ? problems.map((problem, idx) => (
          <a
            key={`${currentIndex}-${idx}`}
            href={problem.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <div
              style={{
                padding: '1rem',
                border: `1px solid rgba(15, 23, 42, 0.08)`,
                borderRadius: '0.75rem',
                background: 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                hover: { transform: 'translateY(-2px)' }
              }}
              className="problem-card"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'white',
                    background: platformColors[problem.platform] || 'var(--primary)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}
                >
                  {problem.platform}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    background:
                      problem.difficulty === 'easy'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : problem.difficulty === 'medium'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                    color:
                      problem.difficulty === 'easy'
                        ? '#10b981'
                        : problem.difficulty === 'medium'
                        ? '#f59e0b'
                        : '#ef4444'
                  }}
                >
                  {problem.difficulty ? problem.difficulty.toUpperCase() : 'MEDIUM'}
                </span>
              </div>
              <h4 style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {problem.title || 'Coding Challenge'}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: 'var(--primary)', fontSize: '0.8rem' }}>
                Solve <ExternalLink size={14} />
              </div>
            </div>
          </a>
        )) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No problems found. Refresh to try again.
          </div>
        )}
        </div>
      )}
    </div>
  );
}
