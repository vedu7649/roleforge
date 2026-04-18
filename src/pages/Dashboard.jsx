import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import { Loader2, Zap, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import PerformanceDashboard from '../components/PerformanceDashboard';
import TaskExecutionCard from '../components/TaskExecutionCard';
import DSAProblemCard from '../components/DSAProblemCard';
import ProjectSuggestionCard from '../components/ProjectSuggestionCard';
import RevisionCard from '../components/RevisionCard';
import VisibilityCard from '../components/VisibilityCard';
import SystemDesignCard from '../components/SystemDesignCard';
import TechAwarenessCard from '../components/TechAwarenessCard';
import CareerAwarenessCard from '../components/CareerAwarenessCard';
import './Dashboard.css';

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState({ module: 'Core Engine', progress: 0, total: 8 });
  const [error, setError] = useState(null);

  // Daily Cached AI Data
  const [dailyData, setDailyData] = useState({
    dsa: null,
    projects: null,
    revision: null,
    visibility: null,
    systemDesign: null,
    techAwareness: null,
    career: null
  });

  // Track progress and behavioral metadata
  const [userProgress, setUserProgress] = useState({ tasks: {}, activity: [] });
  const [behaviorSignals, setBehaviorSignals] = useState({
    pace: 'balanced',
    consistency: 'stable',
    focus: 'high',
    depth: 'deep',
    statusMessage: "Initializing your behavioral analysis...",
    actionLabel: "Analyze your patterns..."
  });

  const [expandedPhase, setExpandedPhase] = useState(-1);
  const [showFullRoadmap, setShowFullRoadmap] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const user = auth.currentUser;

    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Core Synchronization
        setLoadingDetails({ module: 'Roadmap Engine', progress: 1, total: 8 });
        let activeRoadmap = state?.phases ? state : null;

        if (!activeRoadmap && user) {
          const cloudMap = await dbService.getActiveRoadmap(user.uid);
          if (cloudMap) activeRoadmap = cloudMap;
        }

        let currentProfile = state?.role ? state : null;
        if (!activeRoadmap && !currentProfile && user) {
          const cloudProfile = await dbService.getUserProfile(user.uid);
          if (cloudProfile && cloudProfile.role) currentProfile = cloudProfile;
        }

        // Check if we need a new roadmap (role/stack changed)
        const needsNewRoadmap = !activeRoadmap ||
          (currentProfile && (
            activeRoadmap.role !== currentProfile.role ||
            activeRoadmap.stack !== currentProfile.stack ||
            activeRoadmap.level !== currentProfile.level ||
            activeRoadmap.timeConstraint !== currentProfile.timeConstraint
          ));

        if (needsNewRoadmap && currentProfile?.stack) {
          activeRoadmap = await aiService.generateRoadmap(
            currentProfile.role,
            currentProfile.stack,
            currentProfile.level,
            currentProfile.timeConstraint
          );
          if (activeRoadmap && user) {
            await dbService.saveRoadmap(user.uid, activeRoadmap, currentProfile);
          }
        }

        if (!activeRoadmap) {
          throw new Error("No active roadmap found. Please initialize a new path.");
        }

        // 2. Load Progress
        setLoadingDetails({ module: 'Behavior History', progress: 2, total: 8 });
        if (user) {
          const progress = await dbService.getUserProgress(user.uid);
          if (isMounted) setUserProgress(progress);
        }

        // 3. Sequential Daily Cache Intelligence
        if (user) {
          let cache = await dbService.getDailyCache(user.uid);
          const needsGeneration = !cache;

          if (needsGeneration) {
            cache = {};
            const role = activeRoadmap.role || currentProfile?.role || 'Developer';
            const stack = activeRoadmap.stack || currentProfile?.stack || '';
            const completedPhases = activeRoadmap.phases?.length || 0;
            const completedTopics = Object.keys(userProgress.tasks);

            // Sequential AI Generation with error handling
            const modules = [
              { key: 'dsa', name: 'DSA Algorithm Forge', fn: () => aiService.generateDSAProblems(role, completedTopics) },
              { key: 'projects', name: 'System Complexity Lab', fn: () => aiService.generateProjectSuggestions(stack, completedPhases, role) },
              { key: 'revision', name: 'Retrieval Practice Engine', fn: () => aiService.generateFlashcards(completedTopics, role) },
              { key: 'visibility', name: 'Visibility Layer', fn: () => aiService.generateVisibilityTasks(completedTopics, role) },
              { key: 'systemDesign', name: 'Architectural Thinking', fn: () => aiService.generateSystemDesignTopics(role, completedPhases, stack) },
              { key: 'techAwareness', name: 'Market Intelligence', fn: () => aiService.generateTechAwareness(stack, role) },
              { key: 'career', name: 'Career Trajectory Analysis', fn: () => aiService.generateCareerGuidance(role, stack, completedPhases) }
            ];

            for (let i = 0; i < modules.length; i++) {
              const mod = modules[i];
              setLoadingDetails({ module: mod.name, progress: i + 2, total: 8 });
              try {
                cache[mod.key] = await mod.fn();
                console.log(`Dashboard: Generated ${mod.key} successfully`);
              } catch (error) {
                console.error(`Dashboard: Failed to generate ${mod.key}:`, error);
                // Use fallback data for this module
                cache[mod.key] = aiService.fallbacks[mod.key] || [];
              }
            }

            await dbService.updateDailyCache(user.uid, cache);
          }

          if (isMounted) setDailyData(cache);
        }

        if (isMounted) {
          setRoadmap(activeRoadmap);
          setLoading(false);
        }
      } catch (err) {
        console.error("Dashboard Init Error:", err);

        if (err.message?.includes('offline') || err.message?.includes('network')) {
          if (state?.phases) {
            setRoadmap(state);
            setLoading(false);
            return;
          }
          setError("You appear to be offline. RoleForge is using a local cache.");
        } else {
          if (isMounted) {
            setError(err.message || "Failed to initialize learning engine.");
          }
        }

        if (isMounted) setLoading(false);
      }
    };

    initializeDashboard();
    return () => { isMounted = false; }
  }, [state, navigate]);


  // --- Logic: Behavior & Task Engine ---

  const checkPrerequisites = (prerequisites) => {
    if (!prerequisites || prerequisites.length === 0) return true;
    return prerequisites.every(id => userProgress.tasks[id]?.isCompleted);
  };

  const calculatePhaseProgress = (phaseTasks) => {
    if (!phaseTasks || phaseTasks.length === 0) return 0;
    const completed = phaseTasks.filter(t => userProgress.tasks[t.id]?.isCompleted).length;
    return Math.round((completed / phaseTasks.length) * 100);
  };

  const calculateOverallStats = () => {
    if (!roadmap) return { completion: 0, streak: 0, skillScore: 0 };
    const allTasks = roadmap.phases.flatMap(p => p.tasks);
    const completedCount = allTasks.filter(t => userProgress.tasks[t.id]?.isCompleted).length;

    // Calculate streak from activity history
    const streak = calculateStreak(userProgress.activity);

    return {
      completion: Math.round((completedCount / allTasks.length) * 100),
      streak,
      skillScore: 40 + (completedCount * 5)
    };
  };

  const getYesterday = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const calculateStreak = useCallback((activity) => {
    if (!activity || activity.length === 0) return 0;
    const dates = [...new Set(activity.map(a => a.timestamp))].sort().reverse();
    let streak = 0;
    let today = new Date().toISOString().split('T')[0];

    // Check if active today or yesterday
    if (dates[0] !== today && dates[0] !== getYesterday()) return 0;

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) { streak++; continue; }
      const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / (1000 * 60 * 60 * 24);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }, [getYesterday]);

  // The "ONE TASK" selector logic
  const getHeroTask = () => {
    if (!roadmap) return null;

    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (!userProgress.tasks[task.id]?.isCompleted && checkPrerequisites(task.prerequisites)) {
          return { task, phase };
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (!userProgress.activity) return;

    // Behavior Signal Calculation Logic
    const calculateSignals = () => {
      const recent = userProgress.activity.slice(-5);
      if (recent.length === 0) return;

      let signals = { ...behaviorSignals };

      // 1. Pace Signal
      const totalTime = recent.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      const avgTime = totalTime / recent.length;
      if (avgTime < 10) signals.pace = 'rushing'; // Mock threshold
      else if (avgTime > 60) signals.pace = 'slow';
      else signals.pace = 'balanced';

      // 2. Consistency
      const streak = calculateStreak(userProgress.activity);
      if (streak >= 3) signals.consistency = 'consistent';
      else if (streak === 0) signals.consistency = 'irregular';
      else signals.consistency = 'stable';

      // 3. Focus & System Status Generation
      if (signals.pace === 'rushing') {
        signals.statusMessage = "You are rushing through tasks and not retaining concepts.";
        signals.actionLabel = "→ Slow down and focus on depth today.";
        signals.focus = 'low';
      } else if (signals.consistency === 'irregular') {
        signals.statusMessage = "Your learning pattern is inconsistent. We detected gaps in your activity.";
        signals.actionLabel = "→ Try to commit at least 30 mins today to rebuild your streak.";
      } else {
        signals.statusMessage = "You have a stable learning rhythm. Keep this momentum!";
        signals.actionLabel = "→ Full speed ahead to the next concept.";
      }

      setBehaviorSignals(prev => ({ ...prev, ...signals }));
    };

    calculateSignals();
  }, [userProgress, calculateStreak]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    const progressPercent = Math.round((loadingDetails.progress / loadingDetails.total) * 100);
    return (
      <div className="full-center flex-col animate-fade-in loading-overlay">
        <div className="premium-loader-container">
          <div className="loader-ring"></div>
          <Zap className="loader-icon" size={32} />
        </div>

        <div className="loading-content text-center mt-8">
          <h2 className="text-2xl font-bold mb-2 tracking-tight">Optimizing Learning Path</h2>
          <p className="text-muted mb-6">Initialized: <span className="text-accent font-medium">{loadingDetails.module}</span></p>

          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="loading-progress-stats">
              <span>Step {loadingDetails.progress} of {loadingDetails.total}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>

        <div className="loading-foot-meta mt-12 text-sm text-dim">
          <Loader2 className="spinner inline mr-2" size={14} />
          Building a data-driven curriculum...
        </div>
      </div>
    );
  }

  const navigateToProfiler = () => navigate('/');

  if (error) {
    return (
      <div className="full-center flex-col animate-fade-in dashboard-error">
        <h2 className="text-danger mb-4">Connection Notice</h2>
        <p className="text-muted mb-6 text-center" style={{ maxWidth: '400px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </button>
          <button
            className="btn btn-outline"
            onClick={navigateToProfiler}
          >
            Return to Profiler
          </button>
        </div>
      </div>
    );
  }

  const toggleTask = async (taskId, phase, sessionTime = 15) => {
    const user = auth.currentUser;
    if (!user) return;

    const isCompleted = !userProgress.tasks[taskId]?.isCompleted;

    // Optimistic Update
    const newProgress = {
      ...userProgress,
      tasks: {
        ...userProgress.tasks,
        [taskId]: { isCompleted, timeSpent: sessionTime }
      },
      activity: [...userProgress.activity, {
        taskId,
        status: isCompleted ? 'completed' : 'partial',
        timeSpent: sessionTime,
        timestamp: new Date().toISOString().split('T')[0]
      }]
    };
    setUserProgress(newProgress);

    // Cloud Sync
    await dbService.updateTaskProgress(user.uid, taskId, isCompleted, { timeSpent: sessionTime });

    // Logic for checkpoints
    const completedInPhase = phase.tasks.filter(t => (t.id === taskId ? isCompleted : userProgress.tasks[t.id]?.isCompleted)).length;
    if (completedInPhase === Math.floor(phase.tasks.length / 2) && isCompleted) {
      setTimeout(() => {
        navigate('/interviewer', { state: { ...state, milestone: phase.checkpoint, role: roadmap.role || state?.role } });
      }, 1000);
    }
  };

  return (
    <div className="dashboard-container main-content animate-fade-in">
      <PerformanceDashboard
        stats={calculateOverallStats()}
        behaviorSignals={behaviorSignals}
        activityHistory={userProgress.activity}
        timeConstraint={roadmap?.timeConstraint || state?.timeConstraint}
      />

      <div className="hero-task-section">
        <div className="section-header">
          <h2 className="section-title">TODAY'S FOCUS</h2>
          <div className="flex items-center gap-2">
            <span className="text-muted text-sm">One task. Full mastery.</span>
            {roadmap?.generationMethod && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                roadmap.generationMethod === 'ai' 
                  ? 'bg-accent/20 text-accent border border-accent/30' 
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}>
                {roadmap.generationMethod === 'ai' ? '🤖 AI Generated' : '📚 Fallback Data'}
              </span>
            )}
          </div>
        </div>

        {getHeroTask() ? (
          <TaskExecutionCard
            task={getHeroTask().task}
            isLocked={false}
            isCompleted={userProgress.tasks[getHeroTask().task.id]?.isCompleted}
            onToggle={() => toggleTask(getHeroTask().task.id, getHeroTask().phase)}
          />
        ) : (
          <div className="glass-panel p-8 text-center animate-fade-in">
            <Zap color="var(--accent)" size={32} className="mx-auto mb-4" />
            <h3>All Targeted Tasks Complete!</h3>
            <p className="text-muted">You've mastered today's objectives. Check the full roadmap for what's next.</p>
          </div>
        )}
      </div>

      <div className="curriculum-toggle">
        <button className="btn-text" onClick={() => setShowFullRoadmap(!showFullRoadmap)}>
          {showFullRoadmap ? "Hide Full Course Curriculum" : "View Full Course Curriculum"}
          {showFullRoadmap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* LAYER 1: DAILY CORE */}
      <DSAProblemCard
        data={dailyData.dsa}
        role={state?.role || roadmap?.role}
        completedTopics={Object.keys(userProgress.tasks)}
      />
      <ProjectSuggestionCard
        data={dailyData.projects}
        stack={state?.stack || roadmap?.stack}
        completedPhases={roadmap?.phases?.length || 0}
      />
      <RevisionCard
        data={dailyData.revision}
        completedTopics={Object.keys(userProgress.tasks)}
      />

      {/* LAYER 2: WEEKLY GROWTH */}
      <VisibilityCard
        data={dailyData.visibility}
        completedTasks={Object.entries(userProgress.tasks)
          .filter(([, t]) => t.isCompleted)
          .map(([id]) => id)}
        role={roadmap?.role || state?.role || 'Developer'}
      />
      <SystemDesignCard
        data={dailyData.systemDesign}
        role={roadmap?.role || state?.role}
        completedPhases={roadmap?.phases?.length || 0}
        stack={roadmap?.stack || state?.stack}
      />

      {/* LAYER 3: STRATEGIC AWARENESS */}
      <TechAwarenessCard
        data={dailyData.techAwareness}
        role={roadmap?.role || state?.role}
        stack={roadmap?.stack || state?.stack}
      />
      <CareerAwarenessCard
        data={dailyData.career}
        currentRole={state?.role || roadmap?.role || 'Full Stack Developer'}
      />

      {showFullRoadmap && (
        <div className="roadmap-grid animate-slide-up">
          {roadmap?.phases?.map((phase, pIdx) => {
            const isPhaseAccessible = pIdx === 0 || (roadmap.phases[pIdx - 1]?.tasks?.every(task => userProgress.tasks[task.id]?.isCompleted) ?? true);
            const isPhaseExpanded = expandedPhase === pIdx;

            return (
              <div key={pIdx} className={`phase-block ${isPhaseExpanded ? 'phase-expanded' : ''} ${!isPhaseAccessible ? 'phase-locked' : ''}`}>
                <div className="phase-header" onClick={() => setExpandedPhase(expandedPhase === pIdx ? -1 : pIdx)} style={{ cursor: 'pointer' }}>
                  <div className="phase-info">
                    {isPhaseExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    <h3 className="phase-title">{phase.name}</h3>
                    <div className="phase-badge">Phase {pIdx + 1}</div>
                    {!isPhaseAccessible && <Lock size={16} className="phase-lock-icon" />}
                  </div>
                  <div className="phase-stats">
                    <span>{calculatePhaseProgress(phase.tasks)}% Complete</span>
                    <div className="progress-bar-mini">
                      <div
                        className="progress-fill"
                        style={{ width: `${calculatePhaseProgress(phase.tasks)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {isPhaseExpanded && (
                  <div className="phase-content animate-slide-up">
                    <div className="concept-tags">
                      {phase.concepts?.map((c, i) => (
                        <span key={i} className="badge-outline">{c}</span>
                      ))}
                    </div>

                    <div className="task-list">
                      {phase.tasks?.map((task) => (
                        <TaskExecutionCard
                          key={task.id}
                          task={task}
                          isLocked={!checkPrerequisites(task.prerequisites)}
                          isCompleted={userProgress.tasks[task.id]?.isCompleted}
                          prerequisites={task.prerequisites}
                          onToggle={() => toggleTask(task.id, phase)}
                        />
                      ))}
                    </div>

                    {phase.project && (
                      <div className={`project-lock-card glass-panel ${!checkPrerequisites(phase.project.lockedUntil) ? 'locked' : ''}`}>
                        <div className="project-body">
                          <Zap size={20} className="icon-glow" />
                          <div className="project-info">
                            <h4>Capstone: {phase.project.title}</h4>
                            <p className="text-sm text-muted">{phase.project.objective}</p>
                          </div>
                        </div>
                        {!checkPrerequisites(phase.project.lockedUntil) && (
                          <div className="lock-tag"><Lock size={12} /> Master tasks to unlock</div>
                        )}
                      </div>
                    )}

                    <div className="checkpoint-divider">
                      <div className="line"></div>
                      <span className="checkpoint-text">Checkpoint: {phase.checkpoint}</span>
                      <div className="line"></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
