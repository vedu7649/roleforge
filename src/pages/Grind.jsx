import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import { aiService } from '../services/aiService';
import { CheckCircle2, Flame, Loader2, PlayCircle, Trophy } from 'lucide-react';

import DSAProblemCard from '../components/DSAProblemCard';
import ProjectSuggestionCard from '../components/ProjectSuggestionCard';
import RevisionCard from '../components/RevisionCard';
import VisibilityCard from '../components/VisibilityCard';
import SystemDesignCard from '../components/SystemDesignCard';
import TechAwarenessCard from '../components/TechAwarenessCard';
import CareerAwarenessCard from '../components/CareerAwarenessCard';
import GrindLoader from '../components/GrindLoader';
import './Grind.css';

export default function Grind() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [plan, setPlan] = useState(null);
  const [grindState, setGrindState] = useState({ currentDay: 0, lastCommitDate: null, streak: 0 });
  const [userProgress, setUserProgress] = useState({ tasks: {}, activity: [] });
  const [recoveredProfile, setRecoveredProfile] = useState(null);

  const getYesterday = useCallback(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const calculateStreak = useCallback((activity) => {
    if (!activity || activity.length === 0) return 0;
    const dates = [...new Set(activity.map(a => a.timestamp))].sort().reverse();
    let streakVal = 0;
    let todayVal = new Date().toISOString().split('T')[0];

    // Check if active today or yesterday
    if (dates[0] !== todayVal && dates[0] !== getYesterday()) return 0;

    for (let i = 0; i < dates.length; i++) {
      if (i === 0) { streakVal++; continue; }
      const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / (1000 * 60 * 60 * 24);
      if (diff === 1) streakVal++;
      else break;
    }
    return streakVal;
  }, [getYesterday]);

  // Initial Data Load
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadGrindInfo = async () => {
      setLoading(true);
      try {
        const [existingPlan, existingState, cloudProfile, progress] = await Promise.all([
          dbService.getGrindPlan(user.uid),
          dbService.getGrindState(user.uid),
          dbService.getUserProfile(user.uid),
          dbService.getUserProgress(user.uid)
        ]);

        // Validate grind plan data
        if (existingPlan && typeof existingPlan === 'object' && 
            (existingPlan.dsa || existingPlan.project || existingPlan.revision || existingPlan.visibility)) {
          setPlan(existingPlan);
        } else if (existingPlan) {
          console.warn("Grind: Invalid grind plan data, ignoring");
        }

        // Validate grind state data
        if (existingState && typeof existingState === 'object' && 
            typeof existingState.currentDay === 'number') {
          setGrindState(existingState);
        } else if (existingState) {
          console.warn("Grind: Invalid grind state data, using defaults");
          setGrindState({ currentDay: 0, lastCommitDate: null, streak: 0 });
        } else {
          setGrindState({ currentDay: 0, lastCommitDate: null, streak: 0 });
        }

        if (cloudProfile) setRecoveredProfile(cloudProfile);
        if (progress) setUserProgress(progress);
      } catch (err) {
        console.error("Error loading grind data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadGrindInfo();
  }, [user]);

  const handleGeneratePlan = async () => {
    const profile = state || recoveredProfile;
    if (!profile?.role || !profile?.timeConstraint) {
      alert("Please complete your profile first.");
      navigate('/');
      return;
    }

    setGenerating(true);
    setGenProgress(0);

    try {
      const newPlan = await aiService.generateBulkGrindPlan(profile, (p) => setGenProgress(p));
      await dbService.saveGrindPlan(user.uid, newPlan);
      setPlan(newPlan);
      setGenProgress(100); // Set to 100% when complete

      const initialState = { currentDay: 0, lastCommitDate: null, streak: 0 };
      await dbService.saveGrindState(user.uid, initialState);
      setGrindState(initialState);
    } catch (err) {
      console.error("Generation failed:", err);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
      setGenProgress(0);
    }
  };

  const handleCommitToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    if (grindState.lastCommitDate === today) return;

    // 1. Update Global Activity (Source of truth for streak)
    await dbService.updateTaskProgress(user.uid, 'grind_commitment', true, { timeSpent: 30 });
    
    // 2. Fetch updated progress to sync streak immediately
    const updatedProgress = await dbService.getUserProgress(user.uid);
    setUserProgress(updatedProgress);

    // 3. Update local Grind State (Days count)
    const newState = {
      ...grindState,
      currentDay: grindState.currentDay + 1,
      lastCommitDate: today
    };

    setGrindState(newState);
    await dbService.saveGrindState(user.uid, newState);
  };

  const isCommittedToday = grindState.lastCommitDate === new Date().toISOString().split('T')[0];

  if (loading) return <div className="full-center"><Loader2 className="spinner" size={48} /></div>;

  if (!plan) {
    return (
      <div className="grind-empty-state full-center main-content">
        <div className="empty-glass text-center animate-slide-up">
          <Trophy size={64} className="text-accent mb-6 mx-auto" />
          <h2 className="mb-4">Initialize Your Grind Plan</h2>
          <p className="text-muted mb-8 text-lg">
            We'll generate a custom {state?.timeConstraint || '3-month'} curriculum based on your role
            as a <strong>{state?.role || 'Developer'}</strong>. This only needs to be done once.
          </p>
          <button
            className="btn btn-primary btn-lg full-width"
            onClick={handleGeneratePlan}
            disabled={generating}
          >
            {generating ? (
              <><Loader2 className="spinner" size={20} /> Generating ({Math.round(genProgress)}%)</>
            ) : (
              <><PlayCircle size={20} /> Craft My 2x Curriculum</>
            )}
          </button>
        </div>
        {generating && <GrindLoader progress={genProgress} />}
      </div>
    );
  }

  return (
    <div className="grind-page-wrapper">
      <div className="grind-container animate-fade-in">

        {/* HEADER & COMMIT SECTION */}
        <div className="grind-header-premium shadow-lg">
          <div className="header-top">
            <div>
              <h1 className="page-title">Day {grindState.currentDay + 1}</h1>
              <p className="page-subtitle">Multi-X deterministic progression active</p>
            </div>
            <div className="streak-badge">
              <Flame size={20} />
              <span>{calculateStreak(userProgress.activity)} Day Streak</span>
            </div>
          </div>

          <div className="commit-action-zone">
            {isCommittedToday ? (
              <div className="complete-msg animate-fade-in">
                <CheckCircle2 size={24} />
                <span>Goal Met for Today! Next focus unlocks tomorrow.</span>
              </div>
            ) : (
              <button className="btn btn-primary commit-btn pulse" onClick={handleCommitToday}>
                Confirm Daily Commitment
              </button>
            )}
          </div>
        </div>

        {/* DATA CARDS - Sliced by multipliers */}
        <div className="grind-grid">
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <DSAProblemCard
              data={plan.dsa?.slice(grindState.currentDay * 2, (grindState.currentDay + 1) * 2)}
              isLocked={!isCommittedToday && grindState.currentDay > 0}
            />
          </div>
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <ProjectSuggestionCard
              data={plan.project?.slice(grindState.currentDay * 2, (grindState.currentDay + 1) * 2)}
            />
          </div>
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <RevisionCard
              data={plan.revision?.slice(grindState.currentDay * 3, (grindState.currentDay + 1) * 3)}
            />
          </div>
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <VisibilityCard
              data={plan.visibility?.slice(grindState.currentDay * 2, (grindState.currentDay + 1) * 2)}
            />
          </div>
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <SystemDesignCard
              data={plan.system?.slice(grindState.currentDay * 2, (grindState.currentDay + 1) * 2)}
            />
          </div>
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <TechAwarenessCard
              data={plan.tech?.slice(grindState.currentDay * 3, (grindState.currentDay + 1) * 3)}
            />
          </div>
          <div className="grind-card-wrapper animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <CareerAwarenessCard
              data={plan.career?.slice(grindState.currentDay * 2, (grindState.currentDay + 1) * 2)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}