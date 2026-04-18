import React from 'react';
import { Zap, ExternalLink, ShieldCheck, Box } from 'lucide-react';

export default function TechAwarenessCard({ data, isLocked }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in" style={{ opacity: isLocked ? 0.6 : 1 }}>
      <div className="card-header card-header-flex">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap size={24} color="var(--primary)" />
          <div>
            <h3>Tech Pulse</h3>
            <p className="text-xs text-muted">Stay ahead of the curve with daily insights</p>
          </div>
        </div>
        
        {isLocked && (
          <div className="lock-indicator">
            <ShieldCheck size={16} /> <span>Locked</span>
          </div>
        )}
      </div>

      <div className="tech-trends-grid mt-6" style={{ display: 'grid', gap: '1rem' }}>
        {data.map((trend, idx) => (
          <div key={idx} className="trend-box glass-panel p-5">
            <div className="trend-header mb-4">
              <div className="trend-badge">Insight {idx + 1}</div>
              <h4 className="m-0">{trend.week}</h4>
            </div>
            
            <div className="trend-items">
              {trend.items?.map((item, iIdx) => (
                <div key={iIdx} className="trend-item">
                  <div className="item-icon"><Box size={14} /></div>
                  <div className="item-content">
                    <div className="item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="item-name">{item.name}</span>
                      <span className="item-type">{item.type}</span>
                    </div>
                    <p className="item-desc">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .trend-box {
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-card);
          transition: var(--transition);
          padding: 1.5rem !important;
        }
        .trend-box:hover {
          border-color: var(--primary);
        }
        .trend-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .trend-badge {
          font-size: 0.6rem;
          font-weight: 800;
          color: white;
          background: var(--primary);
          padding: 2px 10px;
          border-radius: 99px;
          text-transform: uppercase;
        }
        .trend-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(var(--primary-rgb), 0.02);
          border-radius: 8px;
          margin-bottom: 0.75rem;
        }
        .item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .item-content { flex-grow: 1; }
        .item-name { font-weight: 700; color: var(--text-primary); font-size: 0.9rem; }
        .item-type { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .item-desc { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.4; }

        @media (max-width: 480px) {
          .trend-box { padding: 1.25rem !important; }
          .trend-item { padding: 0.75rem; gap: 0.75rem; }
          .item-icon { width: 28px; height: 28px; }
          .item-header { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
        }
      `}</style>
    </div>
  );
}
