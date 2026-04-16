import React, { useState, useEffect } from 'react';
import { Loader2, Zap, Brain, Rocket, Shield, Globe, Award } from 'lucide-react';

const STATUS_MESSAGES = [
  "Initializing neural pathways...",
  "Analyzing skill gaps in your stack...",
  "Synthesizing daily DSA challenges...",
  "Constructing experimental project architectures...",
  "Optimizing revision flashcards...",
  "Building professional visibility strategies...",
  "Architecting system design patterns...",
  "Aggregating global tech trends...",
  "Calibrating career trajectory data...",
  "Finalizing your daily grind set..."
];

export default function GrindLoader({ progress }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    const icons = [<Brain />, <Zap />, <Rocket />, <Globe />, <Shield />, <Award />];
    return icons[messageIndex % icons.length];
  };

  return (
    <div className="grind-loader-overlay">
      <div className="loader-content">
        <div className="loader-visual">
          <div className="pulse-container">
            <div className="pulse-ring"></div>
            <div className="pulse-ring"></div>
            <div className="pulse-center">
              {React.cloneElement(getIcon(), { size: 32, className: 'loader-icon-main' })}
            </div>
          </div>
          <div className="spinning-border"></div>
        </div>

        <div className="loader-info">
          <h2 className="loader-title">Preparing Your Grind</h2>
          <p className="loader-message">{STATUS_MESSAGES[messageIndex]}</p>
          
          <div className="modern-progress-container">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            <div className="progress-meta">
              <span className="percent-text">{Math.round(progress)}%</span>
              <span className="wait-time">ETA: ~{Math.max(0, Math.round((100 - progress) / 5))}s</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .grind-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--bg-main);
          background-image: radial-gradient(circle at center, rgba(var(--primary-rgb), 0.08) 0%, transparent 70%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(15px);
        }

        .loader-content {
          text-align: center;
          max-width: 450px;
          width: 90%;
        }

        .loader-visual {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 2.5rem;
        }

        .pulse-container {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
        }

        .pulse-center {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(var(--primary-rgb), 0.1);
          border: 1px solid rgba(var(--primary-rgb), 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          z-index: 2;
        }

        .loader-icon-main {
          filter: drop-shadow(0 0 12px rgba(var(--primary-rgb), 0.4));
        }

        .pulse-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 2px solid var(--primary);
          border-radius: 50%;
          opacity: 0;
          animation: loader-pulse 2s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }

        .pulse-ring:nth-child(2) {
          animation-delay: 1s;
        }

        .spinning-border {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-top: 2px solid var(--primary);
          border-right: 2px solid var(--primary);
          border-radius: 50%;
          animation: loader-spin 1.5s linear infinite;
        }

        .loader-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
        }

        .loader-message {
          font-size: 0.95rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
          height: 1.5rem;
          font-weight: 500;
        }

        .modern-progress-container {
          background: var(--bg-card);
          padding: 1.5rem;
          border-radius: 1.25rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }

        .progress-track {
          width: 100%;
          height: 10px;
          background: var(--bg-hover);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary), var(--accent));
          border-radius: 999px;
          transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .progress-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 20px;
          height: 100%;
          background: white;
          filter: blur(8px);
          opacity: 0.5;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .percent-text {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .wait-time {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        @keyframes loader-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes loader-pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
