import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import { Loader2, Zap, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import PerformanceDashboard from '../components/PerformanceDashboard';
import TaskExecutionCard from '../components/TaskExecutionCard';
import './Track.css';

export default function Track() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const [showFullRoadmap, setShowFullRoadmap] = useState(true); // Show roadmap by default

  useEffect(() => {
    let isMounted = true;
    const user = auth.currentUser;

    const initializeDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if user has a profile first
        let currentProfile = state?.role ? state : null;
        if (!currentProfile && user) {
          const cloudProfile = await dbService.getUserProfile(user.uid);
          if (!cloudProfile || !cloudProfile.role) {
            // No profile found, redirect to profiler
            console.log("Track: No profile found, redirecting to profiler");
            navigate('/');
            return;
          }
          currentProfile = cloudProfile;
        }

        if (!currentProfile?.role) {
          console.log("Track: No profile available, redirecting to profiler");
          navigate('/');
          return;
        }

        // 1. Try to get existing roadmap from Firestore (don't trust location.state for roadmap data)
        let activeRoadmap = null;
        if (user) {
          const cloudMap = await dbService.getActiveRoadmap(user.uid);
          if (cloudMap && cloudMap.phases && Array.isArray(cloudMap.phases)) {
            // Validate Firestore data
            const isValidRoadmap = cloudMap.phases.every(phase => 
              phase.name && Array.isArray(phase.tasks) && phase.tasks.every(task => task.id && task.title)
            );
            if (isValidRoadmap) {
              activeRoadmap = cloudMap;
            } else {
              console.warn("Track: Invalid roadmap data in Firestore, will regenerate");
            }
          }
        }

        // 2. If no roadmap, try to get profile data to generate one
        if (!activeRoadmap && !currentProfile && user) {
          const cloudProfile = await dbService.getUserProfile(user.uid);
          if (cloudProfile && cloudProfile.stack) {
            currentProfile = cloudProfile;
          }
        }

        // 3. Generate new roadmap if profile exists but roadmap doesn't, or if role changed
        if (!activeRoadmap && currentProfile?.stack) {
          activeRoadmap = await aiService.generateRoadmap(
            currentProfile.role,
            currentProfile.stack,
            currentProfile.level,
            currentProfile.timeConstraint
          );

          activeRoadmap = normalizeRoadmap(activeRoadmap);

          if (activeRoadmap && activeRoadmap.phases && activeRoadmap.phases.length > 0 && user) {
            await dbService.saveRoadmap(user.uid, activeRoadmap, currentProfile);
          }
        } else if (activeRoadmap && currentProfile?.role && activeRoadmap.role !== currentProfile.role) {
          // Regenerate roadmap if role changed
          activeRoadmap = await aiService.generateRoadmap(
            currentProfile.role,
            currentProfile.stack,
            currentProfile.level,
            currentProfile.timeConstraint
          );

          activeRoadmap = normalizeRoadmap(activeRoadmap);

          if (activeRoadmap && activeRoadmap.phases && activeRoadmap.phases.length > 0 && user) {
            await dbService.saveRoadmap(user.uid, activeRoadmap, currentProfile);
          }
        }

        if (activeRoadmap) {
          activeRoadmap = normalizeRoadmap(activeRoadmap);
        }

        if (!activeRoadmap || !activeRoadmap.phases || activeRoadmap.phases.length === 0) {
          throw new Error("No active roadmap found. Please initialize a new path in the Profiler.");
        }

        // 4. Load Progress from Firestore
        if (user) {
          const progress = await dbService.getUserProgress(user.uid);
          if (isMounted) setUserProgress(progress);
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
  // Clear any invalid state data to prevent cross-page contamination
  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const hasInvalidData = (
        // If state has grind-like properties but no roadmap properties
        (location.state.dsa || location.state.project || location.state.revision) && !location.state.phases
      ) || (
        // If state has phases but invalid structure
        location.state.phases && (!Array.isArray(location.state.phases) || 
        !location.state.phases.every(phase => phase.name && Array.isArray(phase.tasks)))
      );
      
      if (hasInvalidData) {
        console.warn("Track: Clearing invalid location.state to prevent data contamination");
        // Note: We can't actually clear location.state, but we won't use it
      }
    }
  }, [location.state]);


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

  const normalizeRoadmap = (roadmap) => {
    if (!roadmap || !Array.isArray(roadmap.phases)) return roadmap;

    return {
      ...roadmap,
      phases: roadmap.phases.map((phase, phaseIndex) => {
        const previousPhaseIds = roadmap.phases[phaseIndex - 1]?.tasks?.map(t => t.id) || [];
        return {
          ...phase,
          tasks: (phase.tasks || []).map((task, taskIndex) => {
            const safeId = task.id || task.title?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `phase${phaseIndex}_task${taskIndex}`;
            const description = task.description || task.summary || task.objective || 'Advance your learning with this task.';

            return {
              id: safeId,
              title: task.title || task.name || `Task ${taskIndex + 1}`,
              description,
              objective: task.objective || description,
              why: task.why || task.rationale || 'This task helps you progress through the roadmap.',
              expectedOutput: task.expectedOutput || task.successCriteria || task.description || 'Finish the task and log your progress.',
              difficulty: task.difficulty || task.level || 'Medium',
              estimatedTime: task.estimatedTime || task.duration || '15 min',
              subtopics: Array.isArray(task.subtopics) && task.subtopics.length > 0
                ? task.subtopics
                : [{
                    title: 'Overview',
                    steps: [{ type: 'learn', action: description }]
                  }],
              prerequisites: Array.isArray(task.prerequisites)
                ? task.prerequisites
                : task.prerequisite || previousPhaseIds.slice(-1)
            };
          }),
          project: {
            ...phase.project,
            lockedUntil: Array.isArray(phase.project?.lockedUntil) ? phase.project.lockedUntil : []
          }
        };
      })
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

    // First pass: find tasks with met prerequisites
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (!userProgress.tasks[task.id]?.isCompleted && checkPrerequisites(task.prerequisites)) {
          return { task, phase };
        }
      }
    }

    // Second pass: if no tasks with met prerequisites, return first incomplete task
    // This ensures there's always something to do
    for (const phase of roadmap.phases) {
      for (const task of phase.tasks) {
        if (!userProgress.tasks[task.id]?.isCompleted) {
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
    return (
      <div className="full-center flex-col animate-fade-in">
        <Loader2 className="spinner mb-4" size={48} />
        <h2 className="text-xl">Initializing Guided Engine...</h2>
        <p className="text-muted">Synchronizing your progress with RoleForge Cloud</p>
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
    <div className="track-container main-content animate-fade-in">
      <PerformanceDashboard
        stats={calculateOverallStats()}
        behaviorSignals={behaviorSignals}
        activityHistory={userProgress.activity}
        timeConstraint={roadmap?.timeConstraint || state?.timeConstraint}
      />

      <div className="hero-task-section">
        <div className="section-header">
          <h2 className="section-title">TODAY'S FOCUS</h2>
          <span className="text-muted text-sm">One task. Full mastery.</span>
        </div>

        {getHeroTask() ? (
          <TaskExecutionCard
            task={getHeroTask().task}
            isLocked={false}
            isCompleted={userProgress.tasks[getHeroTask().task.id]?.isCompleted}
            onToggle={() => toggleTask(getHeroTask().task.id, getHeroTask().phase)}
            showTimer={true} // Hero task always shows timer
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
          {showFullRoadmap ? "Hide Full Curriculum" : "View Full Course Curriculum"}
          {showFullRoadmap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showFullRoadmap && (
        <div className="roadmap-grid animate-slide-up">
          {roadmap?.phases?.map((phase, pIdx) => {
            const isPhaseAccessible = pIdx === 0 || roadmap.phases[pIdx - 1].tasks.every(task => userProgress.tasks[task.id]?.isCompleted);
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
                          isLocked={!checkPrerequisites(task.prerequisites) || !isPhaseAccessible}
                          isCompleted={userProgress.tasks[task.id]?.isCompleted}
                          prerequisites={task.prerequisites}
                          onToggle={() => toggleTask(task.id, phase)}
                          showTimer={getHeroTask()?.task.id === task.id} // Only show timer for hero task
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