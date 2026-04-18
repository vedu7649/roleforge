import React from 'react';
import { Briefcase, Milestone, ShieldCheck, Map } from 'lucide-react';

export default function CareerAwarenessCard({ data, isLocked }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Briefcase size={24} color="var(--primary)" />
          <div>
            <h3>Career Mentorship</h3>
            <p className="text-xs text-muted">Strategic guidance for your path to mastery</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="career-mentorship-grid mt-6" style={{ display: 'grid', gap: '1.5rem' }}>
        {data.map((advice, idx) => (
          <div key={idx} className="advice-box glass-panel p-6 shadow-glow">
            <div className="target-role-badge">Trajectory: {advice.role}</div>
            <h4 className="mb-4 text-xl">Operational Strategy</h4>
            <p className="text-secondary mb-6 line-height-relaxed">{advice.description}</p>
            
            <div className="career-details-grid">
              <div className="detail-col">
                <div className="detail-header"><Milestone size={14} /> CORE SKILLS</div>
                <div className="skills-wrap">
                  {advice.skills?.map((skill, sIdx) => (
                    <span key={sIdx} className="skill-pill">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="detail-col">
                <div className="detail-header"><Map size={14} /> TYPICAL WORKFLOW</div>
                <ul className="workflow-list">
                  {advice.workflow?.map((step, wIdx) => (
                    <li key={wIdx}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .target-role-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--primary);
          background: rgba(var(--primary-rgb), 0.1);
          padding: 4px 12px;
          border-radius: 99px;
          text-transform: uppercase;
          width: fit-content;
          margin-bottom: 1rem;
        }
        .advice-box {
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--bg-card);
          padding: 1.75rem !important;
        }
        .career-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .detail-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          margin-bottom: 1rem;
          letter-spacing: 0.05em;
        }
        .skills-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .skill-pill {
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--bg-hover);
          color: var(--text-primary);
          padding: 4px 10px;
          border-radius: 6px;
        }
        .workflow-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .workflow-list li {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .workflow-list li::before {
          content: "•";
          color: var(--primary);
          font-weight: 900;
        }
        .line-height-relaxed { line-height: 1.6; }

        @media (max-width: 640px) {
          .advice-box { padding: 1.25rem !important; }
          .career-details-grid { grid-template-columns: 1fr; gap: 1.5rem; padding-top: 1rem; }
        }
      `}</style>
    </div>
  );
}
