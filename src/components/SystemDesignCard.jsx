import React from 'react';
import { Layers, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function SystemDesignCard({ data, isLocked }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers size={24} color="var(--primary)" />
          <div>
            <h3>System Architecture</h3>
            <p className="text-xs text-muted">Architectural foundations for high-scale systems</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="system-design-grid" style={{ marginTop: '1.5rem', display: 'grid', gap: '1.5rem' }}>
        {data.map((item, idx) => (
          <div key={idx} className="system-topic-box glass-panel p-6">
            <div className="topic-badge">Current Focus</div>
            <h4 className="mb-4 text-xl">{item.topic}</h4>
            
            <div className="workflow-container mb-6">
              {item.flowSteps?.map((step, sIdx) => (
                <div key={sIdx} className="flow-step">
                  <div className="step-num">{sIdx + 1}</div>
                  <div className="step-text">{step}</div>
                  {sIdx < item.flowSteps.length - 1 && <ArrowRight className="flow-arrow" size={14} />}
                </div>
              ))}
            </div>

            <div className="explanation-box">
              <HelpCircle size={16} />
              <p className="text-sm">{item.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .system-topic-box {
          position: relative;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: linear-gradient(to bottom right, var(--bg-card), rgba(var(--primary-rgb), 0.02));
          padding: 1.75rem !important;
        }
        .topic-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.1);
          padding: 4px 12px;
          border-radius: 99px;
          text-transform: uppercase;
        }
        .workflow-container {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem 0;
          overflow-x: auto;
        }
        
        @media (max-width: 600px) {
          .workflow-container {
            flex-direction: column;
            overflow-x: visible;
            gap: 1.5rem;
            padding-left: 0.5rem;
          }
          
          .flow-step {
            width: 100%;
          }
          
          .flow-arrow {
            display: none;
          }
        }
        .explanation-box {
          display: flex;
          gap: 0.75rem;
          background: var(--bg-hover);
          padding: 1rem;
          border-radius: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .explanation-box svg { flex-shrink: 0; margin-top: 3px; color: var(--primary); }
      `}</style>
    </div>
  );
}
