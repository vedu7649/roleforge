import React, { useState, useEffect, useCallback } from 'react';
import { Share2, RefreshCw, ChevronLeft, ChevronRight, Code } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function VisibilityCard({ 
  initialData = null, 
  completedTasks = [], 
  role = 'Developer',
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [taskIndex, setTaskIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const hasSignaledLoad = React.useRef(false);

  const taskSuggestions = history[historyIndex] || [];
  const currentTask = taskSuggestions[taskIndex];

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

  const refreshSuggestions = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setLoading(true);
    try {
      const avoidList = history.map(batch => batch.map(t => t.title)).flat();
      const tasks = await aiService.generateVisibilityTasks(completedTasks, role, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        const isDuplicate = lastBatch && tasks && lastBatch[0]?.title === tasks[0]?.title;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5);
          return prev;
        }

        setRefreshCooldown(60);
        const newHistory = [...prev, tasks];
        setHistoryIndex(newHistory.length - 1);
        setTaskIndex(0);
        return newHistory;
      });
    } catch (error) {
      console.error('Error refreshing visibility tasks:', error);
      setRefreshCooldown(5);
    } finally {
      setLoading(false);
    }
  }, [completedTasks, role, history, refreshCooldown]);

  // Load AI-generated tasks ONLY on first activation
  useEffect(() => {
    if (history.length > 0) {
      if (isActive && !hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
      return;
    }

    if (!isActive) return;

    const loadTasks = async () => {
      setIsGenerating(true);
      try {
        const tasks = await aiService.generateVisibilityTasks(completedTasks, role, []);
        setHistory([tasks]);
        setHistoryIndex(0);
        setTaskIndex(0);
      } catch (error) {
        console.error('Error loading visibility tasks:', error);
      } finally {
        setIsGenerating(false);
        if (!hasSignaledLoad.current) {
          hasSignaledLoad.current = true;
          onLoadComplete();
        }
      }
    };
    loadTasks();
  }, [completedTasks, role, isActive, onLoadComplete, history.length]);

  const nextTask = () => setTaskIndex((prev) => (prev + 1) % taskSuggestions.length);
  const prevTask = () => setTaskIndex((prev) => (prev - 1 + taskSuggestions.length) % taskSuggestions.length);

  const goPrevHistory = () => {
    setHistoryIndex(p => Math.max(0, p - 1));
    setTaskIndex(0);
  };

  const goNextHistory = () => {
    setHistoryIndex(p => Math.min(history.length - 1, p + 1));
    setTaskIndex(0);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className="dashboard-card visibility-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Share2 size={24} color="var(--accent)" />
          <div>
            <h3>Visibility Layer</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isGenerating || loading ? 'Wait...' : `History: ${historyIndex + 1} / ${history.length}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {history.length > 1 && (
            <div className="history-controls" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', borderRadius: '8px', padding: '2px' }}>
              <button 
                className="btn-icon btn-xs" 
                onClick={goPrevHistory} 
                disabled={historyIndex === 0 || loading || isGenerating}
                style={{ padding: '4px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 8px', minWidth: '40px', textAlign: 'center' }}>
                {historyIndex + 1}
              </span>
              <button 
                className="btn-icon btn-xs" 
                onClick={goNextHistory} 
                disabled={historyIndex === history.length - 1 || loading || isGenerating}
                style={{ padding: '4px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-sm"
            onClick={refreshSuggestions}
            disabled={loading || isGenerating || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '120px' }}
          >
            <RefreshCw size={16} style={{ animation: (loading || isGenerating) ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Batch'}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ marginTop: '1rem' }}>
        {isGenerating || loading ? (
          <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            ✨ AI is generating personalized professional presence tasks...
          </div>
        ) : taskSuggestions.length > 0 ? (
          <div className="suggestion-display animate-slide-up">
            <div className="suggestion-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
               <span 
                 className="difficulty-badge" 
                 style={{ 
                   backgroundColor: `${getDifficultyColor(currentTask?.difficulty || 'medium')}20`, 
                   color: getDifficultyColor(currentTask?.difficulty || 'medium'),
                   padding: '0.25rem 0.75rem',
                   borderRadius: '9999px',
                   fontSize: '0.75rem',
                   fontWeight: 700,
                   textTransform: 'uppercase'
                 }}
               >
                 {currentTask?.difficulty || 'medium'}
               </span>
               <h4 className="suggestion-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{currentTask?.title || 'Professional Growth Task'}</h4>
            </div>
            
            <div className="suggestion-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div className="content-section" style={{ padding: '1rem', background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '0.75rem', border: '1px solid rgba(var(--primary-rgb), 0.08)' }}>
                  <span className="section-label" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>THE CHALLENGE</span>
                  <p className="problem-text" style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{currentTask?.problemStatement || 'Build your professional presence by sharing your work.'}</p>
               </div>
               <div className="content-section" style={{ padding: '1rem', background: 'rgba(var(--accent-rgb), 0.05)', borderRadius: '0.75rem', border: '1px solid rgba(var(--accent-rgb), 0.1)' }}>
                  <span className="section-label" style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem', letterSpacing: '1px' }}>MARKETABLE SOLUTION</span>
                  <p className="solution-text" style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>{currentTask?.solution || 'Document your learning journey and share it on technical platforms.'}</p>
               </div>
            </div>

            <div className="suggestion-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
               <p className="hint-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <Code size={14} />
                  Post this to your professional platforms to build authority.
               </p>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <button className="btn-icon btn-sm" onClick={prevTask} disabled={taskSuggestions.length <= 1}>
                   <ChevronLeft size={16} />
                 </button>
                 <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                   {taskIndex + 1} / {taskSuggestions.length}
                 </span>
                 <button className="btn-icon btn-sm" onClick={nextTask} disabled={taskSuggestions.length <= 1}>
                   <ChevronRight size={16} />
                 </button>
               </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
             No tasks suggested yet. Try refreshing.
          </div>
        )}
      </div>
    </div>
  );
}
