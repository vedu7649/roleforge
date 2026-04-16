import React, { useState, useEffect, useCallback } from 'react';
import { Server, Layout, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function SystemDesignCard({ 
  initialData = null, 
  role = 'Developer', 
  completedPhases = 0, 
  stack = '',
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasSignaledLoad = React.useRef(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  const designTopic = history[currentIndex] || null;

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

  const loadDesignTopic = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setLoading(true);
    try {
      const avoidList = history.map(t => t.topic);
      const topic = await aiService.generateSystemDesignTopics(role, completedPhases, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        const isDuplicate = lastBatch && topic && lastBatch.topic === topic.topic;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5);
          return prev;
        }

        setRefreshCooldown(60);
        const newHistory = [...prev, topic];
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      });
    } catch (error) {
      console.error('Error loading design topic:', error);
      setRefreshCooldown(5);
    } finally {
      setLoading(false);
      if (!hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
    }
  }, [role, completedPhases, history, onLoadComplete, refreshCooldown]);

  // Load AI-generated topic ONLY on first activation
  useEffect(() => {
    if (history.length > 0) {
      if (isActive && !hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
      return;
    }

    if (isActive) {
      loadDesignTopic();
    }
  }, [isActive, history.length, loadDesignTopic, onLoadComplete]);

  const goPrev = () => setCurrentIndex(p => Math.max(0, p - 1));
  const goNext = () => setCurrentIndex(p => Math.min(history.length - 1, p + 1));

  return (
    <div className="dashboard-card system-design-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Server size={24} color="var(--primary)" />
          <div>
            <h3>System Architecture</h3>
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
            onClick={loadDesignTopic}
            disabled={loading || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '120px' }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Topic'}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ marginTop: '1rem' }}>
        {loading && history.length === 0 ? (
          <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            ✨ AI is whiteboarding a system pattern...
          </div>
        ) : designTopic ? (
          <div className="design-topic animate-slide-up">
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {designTopic.topic}
            </h4>
            
            <div className="flow-visual" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              position: 'relative',
              paddingLeft: '1.5rem',
              borderLeft: '2px dashed var(--border)',
              margin: '1.5rem 0'
            }}>
              {designTopic.flowSteps?.map((step, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', 
                    left: '-2.15rem', 
                    top: '0.25rem',
                    width: '1.25rem', 
                    height: '1.25rem', 
                    background: 'var(--primary)', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    color: 'white',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{step}</p>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-hover)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                <Layout size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle', color: 'var(--primary)' }} />
                {designTopic.explanation}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No design topic loaded. Refresh to try again.</p>
        )}
      </div>
    </div>
  );
}
