import React, { useState } from 'react';
import { Brain, RotateCw, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';

export default function RevisionCard({ data, isLocked }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!data || data.length === 0) return null;

  const currentCard = data[activeIdx];

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % data.length);
    setIsFlipped(false);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + data.length) % data.length);
    setIsFlipped(false);
  };

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Brain size={24} color="var(--primary)" />
          <div>
            <h3>Active Recall</h3>
            <p className="text-xs text-muted">Memorize these {data.length} concepts today</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="flashcard-system" style={{ marginTop: '1.5rem' }}>
        <div className="card-counter">Concept {activeIdx + 1} of {data.length}</div>
        
        <div 
          className={`flashcard-container ${isFlipped ? 'flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="vibration-ring"></div>
              <div className="question-text">{currentCard.question}</div>
              <div className="hint-text">Click to reveal answer</div>
            </div>
            <div className="flashcard-back">
              <div className="answer-text">{currentCard.answer}</div>
              <div className={`importance-tag ${currentCard.importance}`}>{currentCard.importance}</div>
            </div>
          </div>
        </div>

        <div className="card-navigation mt-6">
          <button className="btn btn-outline btn-icon" onClick={handlePrev}><ChevronLeft /></button>
          <div className="pagination-dots">
            {data.map((_, i) => (
              <div key={i} className={`dot ${i === activeIdx ? 'active' : ''}`} />
            ))}
          </div>
          <button className="btn btn-outline btn-icon" onClick={handleNext}><ChevronRight /></button>
        </div>
      </div>

      <style>{`
        .flashcard-system {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .card-counter {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }
        .flashcard-container {
          perspective: 1000px;
          width: 100%;
          height: 250px;
          cursor: pointer;
        }
        .flashcard-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
        }
        .flashcard-container.flipped .flashcard-inner {
          transform: rotateY(180deg);
        }
        .flashcard-front, .flashcard-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          backdrop-filter: blur(12px);
          transition: var(--transition);
        }
        .flashcard-front {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .flashcard-back {
          background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(var(--accent-rgb), 0.05) 100%);
          color: var(--text-primary);
          transform: rotateY(180deg);
          border-color: var(--primary);
          box-shadow: var(--shadow-glow);
        }
        .question-text { font-size: 1.25rem; font-weight: 800; line-height: 1.4; letter-spacing: -0.01em; }
        .answer-text { font-size: 1.1rem; line-height: 1.6; color: var(--text-secondary); font-weight: 500; }
        .hint-text { margin-top: 1.5rem; font-size: 0.7rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        
        .importance-tag {
          position: absolute;
          bottom: 20px;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          color: white;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          letter-spacing: 0.5px;
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.2);
        }
        .importance-tag.high { background: var(--danger); }

        .card-navigation {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .pagination-dots { display: flex; gap: 0.65rem; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: var(--transition); }
        .dot.active { width: 24px; border-radius: 4px; background: var(--primary); box-shadow: 0 0 10px rgba(var(--primary-rgb), 0.3); }
      `}</style>
    </div>
  );
}
