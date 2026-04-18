import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Play,
  CheckCircle2,
  Lock,
  Clock,
  Info,
  Check
} from 'lucide-react';
import './TaskExecutionCard.css';

export default function TaskExecutionCard({ task, isLocked, isCompleted, onToggle, prerequisites = [], showTimer = false }) {
  const [expanded, setExpanded] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (expanded && !isCompleted && isTimerRunning && showTimer) {
      timerRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [expanded, isCompleted, isTimerRunning, showTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };


  if (isLocked) {
    return (
      <div className="task-card-locked glass-panel">
        <div className="lock-overlay">
          <Lock size={24} />
          <p>Locked: Complete {prerequisites.join(', ')} first</p>
        </div>
        <h3>{task.title}</h3>
      </div>
    );
  }

  return (
    <div className={`task-execution-card glass-panel ${isCompleted ? 'completed' : ''} ${expanded ? 'expanded' : ''}`}>
      <div className="task-header" onClick={() => {
        const newExpanded = !expanded;
        setExpanded(newExpanded);
        if (newExpanded && !isCompleted) setIsTimerRunning(true);
      }}>
        <div className="task-main-info">
          <div className="status-indicator">
            {isCompleted ? <CheckCircle2 color="var(--accent)" /> : <Clock color="var(--text-muted)" size={20} />}
          </div>
          <div className="title-section">
            <h4>{task.title}</h4>
            <div className="meta-tags">
              <span className="badge-outline mini"><Clock size={10} /> {task.estimatedTime || '15 min'}</span>
              <span className="badge-outline mini" data-level={typeof task.difficulty === 'string' ? task.difficulty : task.difficulty?.level}>
                {typeof task.difficulty === 'string' ? task.difficulty : task.difficulty?.level || 'Medium'}
              </span>
            </div>
          </div>
        </div>
        <div className="task-toggle">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="task-content animate-fade-in">
          <div className="insight-box">
            <div className="insight-section">
              <span className="label">OBJECTIVE</span>
              <p>{task.objective || task.description || 'Complete this learning task and master the key concept.'}</p>
            </div>
            <div className="insight-section">
              <span className="label">WHY</span>
              <p>{task.why || task.rationale || 'This task moves your roadmap forward and improves your mastery.'}</p>
            </div>
          </div>

          <div className="subtopics-container">
            <h5>Execution Steps</h5>
            {(task.subtopics && task.subtopics.length > 0 ? task.subtopics : [{
              title: 'Overview',
              steps: [{ type: 'learn', action: task.description || 'Read the task details and begin.' }]
            }]).map((sub, sIdx) => (
              <div key={sIdx} className="subtopic-group">
                <div className="subtopic-header">
                  <span className="subtopic-title">{sub.title}</span>
                </div>
                <div className="steps-list">
                  {sub.steps?.map((step, stIdx) => (
                    <div key={stIdx} className={`micro-step ${step.type}`}>
                      <div className="step-icon">
                        {step.type === 'learn' && <BookOpen size={14} />}
                        {step.type === 'do' && <Play size={14} />}
                        {step.type === 'check' && <Check size={14} />}
                      </div>
                      <p>{step.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="task-footer">
            <div className="expected-output">
              <Info size={14} />
              <span><strong>Success Criteria:</strong> {task.expectedOutput || task.description || 'Complete the task successfully.'}</span>
            </div>
            <div className="task-actions">
              {!isCompleted && expanded && showTimer && (
                <button
                  className={`btn btn-sm ${isTimerRunning ? 'btn-danger' : 'btn-accent'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTimerRunning(!isTimerRunning);
                  }}
                >
                  {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                </button>
              )}
              <button
                className={`btn ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(task.id, Math.round(sessionSeconds / 60));
                }}
              >
                <div className="btn-content">
                  {isCompleted ? 'Mark Incomplete' : 'Finish Task'}
                  {!isCompleted && expanded && showTimer && <span className="timer-badge">{formatTime(sessionSeconds)}</span>}
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
