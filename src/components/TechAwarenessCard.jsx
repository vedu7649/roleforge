import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Globe, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function TechAwarenessCard({ 
  initialData = null, 
  role = 'Developer', 
  stack = '',
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const hasSignaledLoad = React.useRef(false);

  const trends = history[currentIndex] || [];

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

  const loadTrends = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setLoading(true);
    try {
      const avoidList = history.map(batch => batch.map(w => w.items.map(i => i.name))).flat(2);
      const generatedTrends = await aiService.generateTechAwareness(stack, role, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        // Check if the first trend name of the first week is identical
        const isDuplicate = lastBatch && generatedTrends && 
                           lastBatch[0]?.items[0]?.name === generatedTrends[0]?.items[0]?.name;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5);
          return prev;
        }

        const newHistory = [...prev, generatedTrends];
        setCurrentIndex(newHistory.length - 1);
        setRefreshCooldown(60);
        return newHistory;
      });
    } catch (error) {
      console.error('Error refreshing tech awareness:', error);
      setRefreshCooldown(5);
    } finally {
      setLoading(false);
      if (!hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
    }
  }, [role, stack, history, onLoadComplete, refreshCooldown]);

  // Load AI-generated trends ONLY on first activation
  useEffect(() => {
    if (history.length > 0) {
      if (isActive && !hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
      return;
    }

    if (isActive) {
      loadTrends();
    }
  }, [isActive, history.length, loadTrends, onLoadComplete]);

  const goPrev = () => setCurrentIndex(p => Math.max(0, p - 1));
  const goNext = () => setCurrentIndex(p => Math.min(history.length - 1, p + 1));

  const getTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'framework': return { bg: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' };
      case 'tool': return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      case 'trend': return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
      default: return { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' };
    }
  };

  return (
    <div className="dashboard-card tech-awareness-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp size={24} color="var(--primary)" />
          <div>
            <h3>Tech Pulse</h3>
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
            onClick={loadTrends}
            disabled={loading || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '110px' }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Pulse'}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ marginTop: '1rem' }}>
        {loading && history.length === 0 ? (
          <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
            ✨ AI is scanning the technical landscape...
          </div>
        ) : trends.length > 0 ? (
          <div className="trends-container animate-slide-up">
            {trends.map((week, idx) => (
              <div key={idx} style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                  <Globe size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{week.week}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {week.items?.map((item, itemIdx) => {
                    const status = getTypeColor(item.type);
                    return (
                      <div key={itemIdx} style={{ 
                        padding: '1rem', 
                        background: 'var(--bg-card)', 
                        borderRadius: '1rem',
                        border: '1px solid var(--border)',
                        transition: 'all 0.2s ease'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 700, 
                            color: status.color, 
                            background: status.bg, 
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px', 
                            textTransform: 'uppercase' 
                          }}>
                            {item.type}
                          </span>
                        </div>
                        <h5 style={{ margin: '0.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</h5>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No trends loaded. Refresh to scan.</p>
        )}
      </div>
    </div>
  );
}
