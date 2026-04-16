import React, { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function RevisionCard({ 
  initialData = null, 
  completedTopics = [], 
  role = 'Developer',
  isActive = true,
  onLoadComplete = () => {}
}) {
  const [history, setHistory] = useState(initialData ? [initialData] : []);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const hasSignaledLoad = React.useRef(false);

  const flashcards = history[historyIndex] || [];
  const currentCard = flashcards[cardIndex];

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

  const refreshFlashcards = useCallback(async () => {
    if (refreshCooldown > 0) return;
    setIsGenerating(true);
    try {
      const avoidList = history.map(batch => batch.map(c => c.question)).flat();
      const generatedCards = await aiService.generateFlashcards(completedTopics, role, avoidList);
      
      setHistory(prev => {
        const lastBatch = prev[prev.length - 1];
        const isDuplicate = lastBatch && generatedCards && lastBatch[0]?.question === generatedCards[0]?.question;

        if (isDuplicate) {
          console.warn("AI returned duplicate data, applying short 5s retry cooldown.");
          setRefreshCooldown(5);
          return prev;
        }

        setRefreshCooldown(60);
        const newHistory = [...prev, generatedCards];
        setHistoryIndex(newHistory.length - 1);
        setCardIndex(0);
        setIsFlipped(false);
        return newHistory;
      });
    } catch (error) {
      console.error('Error refreshing flashcards:', error);
      setRefreshCooldown(5);
    } finally {
      setIsGenerating(false);
    }
  }, [completedTopics, role, history, refreshCooldown]);

  // Load AI-generated flashcards ONLY on first activation
  useEffect(() => {
    if (history.length > 0) {
      if (isActive && !hasSignaledLoad.current) {
        hasSignaledLoad.current = true;
        onLoadComplete();
      }
      return;
    }

    if (!isActive) return;

    const loadFlashcards = async () => {
      setIsGenerating(true);
      try {
        const generatedCards = await aiService.generateFlashcards(completedTopics, role, []);
        setHistory([generatedCards]);
        setHistoryIndex(0);
        setCardIndex(0);
      } catch (error) {
        console.error('Error loading flashcards:', error);
      } finally {
        setIsGenerating(false);
        if (!hasSignaledLoad.current) {
          hasSignaledLoad.current = true;
          onLoadComplete();
        }
      }
    };
    loadFlashcards();
  }, [completedTopics, role, isActive, onLoadComplete, history.length]);

  const nextCard = () => {
    setCardIndex((prev) => (prev + 1) % flashcards.length);
    setIsFlipped(false);
  };

  const prevCard = () => {
    setCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    setIsFlipped(false);
  };

  const goPrevHistory = () => {
    setHistoryIndex(p => Math.max(0, p - 1));
    setCardIndex(0);
    setIsFlipped(false);
  };

  const goNextHistory = () => {
    setHistoryIndex(p => Math.min(history.length - 1, p + 1));
    setCardIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="dashboard-card revision-card animate-fade-in" style={{ marginTop: '1.5rem' }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Brain size={24} color="var(--primary)" />
          <div>
            <h3>Active Recall</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {isGenerating ? 'Wait...' : `History: ${historyIndex + 1} / ${history.length}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {history.length > 1 && (
            <div className="history-controls" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', borderRadius: '8px', padding: '2px' }}>
              <button 
                className="btn-icon btn-xs" 
                onClick={goPrevHistory} 
                disabled={historyIndex === 0 || isGenerating}
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
                disabled={historyIndex === history.length - 1 || isGenerating}
                style={{ padding: '4px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          
          <button
            type="button"
            className="btn btn-sm"
            onClick={refreshFlashcards}
            disabled={isGenerating || refreshCooldown > 0}
            style={{ gap: '0.5rem', minWidth: '100px' }}
          >
            <RefreshCw size={16} style={{ animation: isGenerating ? 'spin 1s linear infinite' : 'none' }} />
            {isGenerating ? 'Wait...' : refreshCooldown > 0 ? `Wait ${refreshCooldown}s` : 'New Set'}
          </button>
        </div>
      </div>

      <div className="card-body" style={{ position: 'relative', minHeight: '220px', marginTop: '1rem' }}>
        {isGenerating ? (
          <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ✨ AI is synthesizing flashcards...
          </div>
        ) : flashcards.length > 0 ? (
          <div className="flashcard-container" style={{ perspective: '1000px' }}>
            <div 
              className={`flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                minHeight: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.6s',
                transformStyle: 'preserve-3d',
                position: 'relative',
                transformOrigin: 'center',
                transform: isFlipped ? 'rotateY(180deg)' : 'none'
              }}
            >
              {!isFlipped ? (
                <div className="flashcard-front" style={{ backfaceVisibility: 'hidden', width: '100%', textAlign: 'center' }}>
                   <span style={{ 
                     display: 'inline-block',
                     marginBottom: '1rem',
                     fontSize: '0.7rem',
                     fontWeight: 700,
                     color: currentCard?.importance === 'high' ? '#ef4444' : '#f59e0b',
                     textTransform: 'uppercase'
                   }}>
                     {currentCard?.importance || 'medium'} importance
                   </span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                    {currentCard?.question}
                  </p>
                  <span style={{ position: 'absolute', bottom: '1rem', right: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to reveal</span>
                </div>
              ) : (
                <div className="flashcard-back" style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', width: '100%', textAlign: 'center' }}>
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {currentCard?.answer}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem' }}>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); prevCard(); }} disabled={flashcards.length <= 1}>
                <ChevronLeft size={20} />
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {cardIndex + 1} / {flashcards.length}
              </span>
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); nextCard(); }} disabled={flashcards.length <= 1}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
             No flashcards available. Try refreshing.
          </div>
        )}
      </div>
    </div>
  );
}
