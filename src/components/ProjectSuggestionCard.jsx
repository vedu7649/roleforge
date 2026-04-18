import React from 'react';
import { Rocket, ExternalLink, ShieldCheck, Star } from 'lucide-react';

export default function ProjectSuggestionCard({ data, isLocked }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Rocket size={24} color="var(--primary)" />
          <div>
            <h3>Project Discovery</h3>
            <p className="text-xs text-muted">Pick the challenge that fits your focus today</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="card-grid-2" style={{ marginTop: '1.5rem' }}>
        {data.map((project, idx) => (
          <div key={idx} className="project-option-box glass-panel p-5">
            <div className="option-label">Option {idx + 1}</div>
            <div className={`type-tag ${project.type?.toLowerCase()}`}>{project.type}</div>
            <h4 className="mb-3 mt-2">{project.title}</h4>
            <p className="text-sm text-muted mb-4 line-clamp-3">{project.description}</p>
            
            <div className="outcome-box mb-4">
              <Star size={14} />
              <span>{project.expectedOutcome}</span>
            </div>

            <button className="btn btn-primary btn-sm full-width" style={{ width: '100%' }}>
              Select Project
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .project-option-box {
          position: relative;
          transition: var(--transition);
          border: 1px solid var(--border);
          border-radius: 20px;
          background: var(--bg-card);
          display: flex;
          flex-direction: column;
          padding: 2rem !important;
          min-height: 420px;
          justify-content: space-between;
          min-width: 0;
          overflow-wrap: break-word;
          box-shadow: var(--shadow-sm);
        }
        .project-option-box:hover {
          border-color: var(--primary);
          transform: translateY(-8px);
          box-shadow: var(--shadow-premium);
        }
        .option-label {
          position: absolute;
          top: -12px;
          left: 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          color: white;
          font-size: 0.6rem;
          padding: 4px 14px;
          border-radius: 99px;
          font-weight: 800;
          text-transform: uppercase;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
        }
        .type-tag {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          width: fit-content;
          padding: 4px 12px;
          border-radius: 6px;
          margin-bottom: 0.5rem;
          letter-spacing: 0.5px;
        }
        .type-tag.advanced { 
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 100%); 
          color: #8b5cf6; 
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        .type-tag.intermediate { 
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%); 
          color: #3b82f6; 
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .outcome-box {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: linear-gradient(to right, rgba(var(--primary-rgb), 0.05), transparent);
          padding: 1rem;
          border-radius: 12px;
          font-size: 0.85rem;
          color: var(--text-primary);
          line-height: 1.5;
          flex-grow: 1;
          border-left: 3px solid var(--primary);
        }
        .outcome-box svg { flex-shrink: 0; margin-top: 2px; color: var(--warning); filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.3)); }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
