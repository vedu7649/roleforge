import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { dbService } from '../services/dbService';
import {
  BookOpen,
  Trash2,
  RefreshCcw,
  Plus,
  Award,
  Zap,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({ streak: 0, completions: 0 });

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }
      setUser(currentUser);

      const [roadmaps, grindState, progress] = await Promise.all([
        dbService.listUserRoadmaps(currentUser.uid),
        dbService.getGrindState(currentUser.uid),
        dbService.getUserProgress(currentUser.uid)
      ]);

      // Filter to only show the most recent roadmap for each unique role
      const uniqueRolesMap = new Map();
      roadmaps.forEach(roadmap => {
        const existing = uniqueRolesMap.get(roadmap.role);
        if (!existing || (roadmap.updatedAt?.toMillis() || 0) > (existing.updatedAt?.toMillis() || 0)) {
          uniqueRolesMap.set(roadmap.role, roadmap);
        }
      });
      
      const filteredRoadmaps = Array.from(uniqueRolesMap.values()).sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
      });

      // Unified Streak Calculation
      const calculateStreak = (activity) => {
        if (!activity || activity.length === 0) return 0;
        const dates = [...new Set(activity.map(a => a.timestamp))].sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (dates[0] !== today && dates[0] !== yesterdayStr) return 0;

        for (let i = 0; i < dates.length; i++) {
          if (i === 0) { streak++; continue; }
          const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / (1000 * 60 * 60 * 24);
          if (diff === 1) streak++;
          else break;
        }
        return streak;
      };

      setCourses(filteredRoadmaps);
      setStats({
        streak: calculateStreak(progress.activity),
        completions: Object.keys(grindState.completedDays || {}).length
      });
      setLoading(false);
    };

    loadProfile();
  }, [navigate]);

  const handleRestart = async (roadmapId) => {
    if (!window.confirm("Are you sure? This will reset your daily progress and streak for this course.")) return;

    setActionLoading(roadmapId);
    try {
      await dbService.resetUserData(user.uid);
      // Refresh state
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (roadmapId) => {
    if (!window.confirm("Nuclear Option: This will permanently delete this course and all associated data.")) return;

    setActionLoading(roadmapId);
    try {
      await dbService.deleteRoadmap(user.uid, roadmapId);
      setCourses(prev => prev.filter(c => c.id !== roadmapId));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNuke = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete ALL roadmaps, your profile, your daily progress, and all history. This cannot be undone.")) return;
    if (!window.confirm("SECOND CONFIRMATION: Are you absolutely sure? Everything will be wiped.")) return;

    setActionLoading('nuclear');
    try {
      await dbService.nukeEverything(user.uid);
      window.location.href = '/';
    } catch (err) {
      console.error(err);
      alert("Nuclear reset failed. Check console.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddNew = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="full-center flex-col">
        <Loader2 className="spinner" size={48} />
        <p className="mt-4 text-muted">Synchronizing Trajectories...</p>
      </div>
    );
  }

  return (
    <div className="profile-container main-content animate-fade-in">
      <header className="profile-header">
        <div className="user-info">
          <div className="avatar-large">
            {user.photoURL ? <img src={user.photoURL} alt="User" /> : <Award size={40} />}
          </div>
          <div>
            <h1>Command Center</h1>
            <p className="text-muted">{user.email}</p>
          </div>
        </div>

        <div className="global-stats">
          <div className="stat-pill">
            <Zap size={18} color="var(--primary)" />
            <span>{stats.streak} Day Streak</span>
          </div>
          <div className="stat-pill">
            <Calendar size={18} color="var(--secondary)" />
            <span>{stats.completions} Milestones</span>
          </div>
        </div>
      </header>

      <section className="courses-section">
        <div className="section-header">
          <h2>Your Active Trajectories</h2>
          <button className="btn btn-primary btn-sm" onClick={handleAddNew}>
            <Plus size={16} /> Select New Role
          </button>
        </div>

        <div className="courses-grid">
          {courses.length > 0 ? courses.map((course) => (
            <div key={course.id} className={`course-card glass-panel ${course.isActive ? 'active-border' : ''}`}>
              <div className="course-card-bg"></div>

              <div className="course-info">
                <div className="role-tag">{course.role}</div>
                <h3 className="course-title">{course.stack}</h3>
                <div className="course-meta">
                  <span>Level: {course.level || 'Intermediate'}</span>
                  <span className="dot"></span>
                  <span>{course.timeConstraint} Path</span>
                </div>
              </div>

              <div className="course-actions">
                <div className="primary-actions">
                  <button
                    className="btn btn-primary full-width"
                    onClick={() => navigate('/dashboard', { state: course })}
                    disabled={actionLoading}
                  >
                    Resume Path <ChevronRight size={16} />
                  </button>
                </div>

                <div className="danger-zone">
                  <button
                    className="btn-icon-label"
                    title="Reset Progress"
                    onClick={() => handleRestart(course.id)}
                    disabled={actionLoading === course.id}
                  >
                    <RefreshCcw size={14} className={actionLoading === course.id ? 'spinner' : ''} />
                    <span>Restart</span>
                  </button>
                  <button
                    className="btn-icon-label text-danger"
                    title="Delete Course"
                    onClick={() => handleDelete(course.id)}
                    disabled={actionLoading === course.id}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              {course.isActive && <div className="active-badge">Active</div>}
            </div>
          )) : (
            <div className="empty-state glass-panel">
              <BookOpen size={48} className="text-muted mb-4" />
              <h3>No Active Trajectories</h3>
              <p className="text-muted">Start your journey by selecting a role and building a custom roadmap.</p>
              <button className="btn btn-primary mt-6" onClick={handleAddNew}>
                Initialize First Course
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="account-footer">
        <div className="warning-box mb-6">
          <ShieldAlert size={20} color="var(--danger)" />
          <p>Careful: Restarting a course will reset your daily streaks and grind history globally.</p>
        </div>

        <button
          className="btn btn-outline text-danger full-width"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.2)',
            background: 'rgba(239, 68, 68, 0.03)',
            padding: '1rem'
          }}
          onClick={handleNuke}
          disabled={actionLoading === 'nuclear'}
        >
          <Trash2 size={18} className="mr-2" />
          {actionLoading === 'nuclear' ? 'Initiating Cleanup...' : 'Delete All Data & Reset Account'}
        </button>
      </div>
    </div>
  );
}
