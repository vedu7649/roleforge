import React from 'react';
import { Code2, ExternalLink, ShieldCheck } from 'lucide-react';

export default function DSAProblemCard({ data, isLocked }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Code2 size={24} color="var(--primary)" />
          <div>
            <h3>Daily DSA Practice</h3>
            <p className="text-xs text-muted">Pick one to solve for today's streak</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="card-grid-2" style={{ marginTop: '1.5rem' }}>
        {data.map((problem, idx) => (
          <div key={idx} className="dsa-option-box glass-panel p-4">
            <div className="option-label">Option {idx + 1}</div>
            <h4 className="mb-2">{problem.title}</h4>
            <div className="flex items-center gap-2 mb-4" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className={`badge badge-${problem.difficulty?.toLowerCase()}`} style={{
                background: problem.difficulty?.toLowerCase() === 'easy' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: problem.difficulty?.toLowerCase() === 'easy' ? '#10b981' : '#f59e0b',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700
              }}>
                {problem.difficulty}
              </span>
              <span className="text-xs text-muted" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{problem.platform}</span>
            </div>
            <a 
              href={problem.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm full-width"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Solve <ExternalLink size={14} className="ml-1" />
            </a>
          </div>
        ))}
      </div>

      <style>{`
        .dsa-option-box {
          position: relative;
          transition: var(--transition);
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg-card);
          padding: 1.5rem !important;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          min-width: 0;
          word-break: break-word;
          overflow-wrap: break-word;
          box-shadow: var(--shadow-sm);
        }
        .dsa-option-box:hover {
          border-color: var(--primary);
          transform: translateY(-5px);
          box-shadow: var(--shadow-premium);
        }
        .option-label {
          position: absolute;
          top: -12px;
          left: 20px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          color: white;
          font-size: 0.6rem;
          padding: 4px 12px;
          border-radius: 99px;
          font-weight: 800;
          text-transform: uppercase;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
        }
        .lock-indicator {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--warning);
          font-size: 0.8rem;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
