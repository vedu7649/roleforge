import React from 'react';
import { Zap, Activity, BarChart3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import './PerformanceDashboard.css';

export default function PerformanceDashboard({ stats, behaviorSignals, activityHistory = [], timeConstraint }) {

  // 1. Calculate Grid Size
  const totalDays = React.useMemo(() => {
    if (!timeConstraint) return 28;
    const match = timeConstraint.match(/(\d+)\s*(month|week|year)/i);
    if (!match) return 28;
    const val = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    if (unit.includes('month')) return val * 30;
    if (unit.includes('week')) return val * 7;
    if (unit.includes('year')) return val * 365;
    return 28;
  }, [timeConstraint]);

  // 2. Format Data for Semantic Calendar (Completed, Partial, Skipped)
  const calendarWeeks = React.useMemo(() => {
    // Map activity history to a date-keyed object for fast lookup
    const historyMap = activityHistory.reduce((acc, curr) => {
      acc[curr.timestamp] = curr.status;
      return acc;
    }, {});

    const weeks = [];
    const today = new Date();
    
    // We want to show 'totalDays' ending at today
    const days = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        status: historyMap[dateStr] || 'none'
      });
    }

    // Pad to full weeks
    while (days.length % 7 !== 0) days.unshift({ status: 'hidden' });

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [activityHistory, totalDays]);

  const getSignalIcon = (signal, value) => {
    if (signal === 'pace') {
      if (value === 'rushing') return <AlertCircle size={14} color="#ef4444" />;
      if (value === 'balanced') return <CheckCircle2 size={14} color="#10b981" />;
      return <Clock size={14} color="#f59e0b" />;
    }
    return <Activity size={14} color="var(--primary)" />;
  };

  return (
    <div className="performance-dashboard animate-fade-in">
      
      {/* 1. System Status Hero */}
      <div className="system-status-hero glass-panel">
        <div className="status-main">
          <div className="status-icon-glow">
            <Zap size={24} className="icon-pulse" />
          </div>
          <div className="status-content">
            <h3>System Status</h3>
            <p className="status-message">{behaviorSignals.statusMessage}</p>
            <p className="status-action">{behaviorSignals.actionLabel}</p>
          </div>
        </div>
        <div className="quick-stats">
          <div className="hero-stat-card glass-panel">
            <div className="stat-icon-mini completion">
              <CheckCircle2 size={16} />
            </div>
            <div className="q-stat">
              <span className="q-label">COMPLETION</span>
              <span className="q-value">{stats.completion}%</span>
            </div>
          </div>

          <div className="hero-stat-card glass-panel">
            <div className="stat-icon-mini streak">
              <Zap size={16} />
            </div>
            <div className="q-stat">
              <span className="q-label">STREAK</span>
              <span className="q-value">{stats.streak}d</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Behavior Tracking Layer (The 4 Signals) */}
      <div className="signals-grid">
        {['pace', 'consistency', 'focus', 'depth'].map((sig) => (
          <div key={sig} className="signal-card glass-panel">
            <div className="signal-header">
              {getSignalIcon(sig, behaviorSignals[sig])}
              <span className="signal-name">{sig.toUpperCase()}</span>
            </div>
            <div className="signal-value-container">
              <span className={`signal-value ${behaviorSignals[sig]}`}>
                {behaviorSignals[sig].replace('_', ' ')}
              </span>
              <div className="signal-bar">
                <div 
                  className={`signal-fill ${behaviorSignals[sig]}`} 
                  style={{ width: behaviorSignals[sig] === 'rushing' || behaviorSignals[sig] === 'irregular' ? '30%' : '100%' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Behavior Calendar (Semantic Activity) */}
      <div className="calendar-panel glass-panel">
        <div className="panel-header">
          <BarChart3 size={16} color="var(--primary)" />
          <span>Behavioral Consistency</span>
        </div>

        <div className="calendar-scroll-container">
          <div className="calendar-grid">
            {calendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="calendar-week-column">
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className={`calendar-cell semantic ${day.status}`}
                    title={day.date ? `${day.date}: ${day.status}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-meta">
          <div className="legend semantic">
            <div className="l-item"><div className="calendar-cell semantic completed"></div> <span>Completed</span></div>
            <div className="l-item"><div className="calendar-cell semantic partial"></div> <span>Partial</span></div>
            <div className="l-item"><div className="calendar-cell semantic skipped"></div> <span>Skipped</span></div>
            <div className="l-item"><div className="calendar-cell semantic none"></div> <span>No Activity</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}