import React from 'react';
import { Target, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';

export default function VisibilityCard({ data, isLocked }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Target size={24} color="var(--primary)" />
          <div>
            <h3>Visibility Layer</h3>
            <p className="text-xs text-muted">Build your digital presence with one task</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="card-grid-2" style={{ marginTop: '1.5rem' }}>
        {data.map((task, idx) => (
          <div key={idx} className="visibility-option-box glass-panel p-5">
            <div className="option-label">Option {idx + 1}</div>
            <h4 className="mb-2">{task.title}</h4>
            <div className={`difficulty-indicator ${task.difficulty?.toLowerCase()}`}>
               {task.difficulty} Complexity
            </div>
            
            <div className="problem-section mb-4">
              <div className="section-label">THE MISSION</div>
              <p className="text-sm">{task.problemStatement}</p>
            </div>

            <div className="solution-section mb-6">
              <div className="section-label">EXPECTED OUTCOME</div>
              <p className="text-sm text-secondary">{task.solution}</p>
            </div>

            <button className="btn btn-outline btn-sm full-width" style={{ width: '100%', gap: '0.5rem' }}>
              <CheckCircle size={14} /> Start Task
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .visibility-option-box {
          position: relative;
          transition: var(--transition);
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-card);
          display: flex;
          flex-direction: column;
          padding: 1.5rem !important;
          min-height: 420px;
          justify-content: space-between;
          min-width: 0;
          overflow-wrap: break-word;
        }
        .visibility-option-box:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .difficulty-indicator {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .difficulty-indicator.easy { color: #10b981; }
        .difficulty-indicator.medium { color: #f59e0b; }
        .difficulty-indicator.hard { color: #ef4444; }

        .section-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 0.5rem;
          letter-spacing: 0.1em;
        }
        .problem-section, .solution-section {
          background: rgba(var(--primary-rgb), 0.03);
          padding: 0.75rem;
          border-radius: 8px;
          flex-grow: 1;
        }
        .solution-section {
          background: rgba(34, 197, 94, 0.03);
        }
        .solution-section .section-label { color: #10b981; }
      `}</style>
    </div>
  );
}
