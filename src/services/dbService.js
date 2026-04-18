import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export const dbService = {
  // --- ROADMAP ENGINE (Multi-Course Support) ---

  saveRoadmap: async (userId, roadmapData, metadata) => {
    try {
      // 1. Mark existing roadmaps as inactive
      const q = query(collection(db, 'Roadmaps'), where('userId', '==', userId), where('isActive', '==', true));
      const snapshots = await getDocs(q);
      const batch = [];
      snapshots.forEach(child => {
        batch.push(updateDoc(doc(db, 'Roadmaps', child.id), { isActive: false }));
      });
      await Promise.all(batch);

      // 2. Create new active roadmap with unique ID
      const newRoadmapRef = doc(collection(db, 'Roadmaps'));
      await setDoc(newRoadmapRef, {
        id: newRoadmapRef.id,
        userId,
        phases: roadmapData.phases,
        role: metadata.role,
        stack: metadata.stack,
        level: metadata.level,
        timeConstraint: metadata.timeConstraint,
        updatedAt: serverTimestamp(),
        isActive: true
      });
      return newRoadmapRef.id;
    } catch (err) {
      console.error("Error saving roadmap:", err);
      return null;
    }
  },

  getActiveRoadmap: async (userId) => {
    try {
      const q = query(collection(db, 'Roadmaps'), where('userId', '==', userId), where('isActive', '==', true));
      const snapshots = await getDocs(q);
      if (!snapshots.empty) {
        return snapshots.docs[0].data();
      }
      return null;
    } catch (err) {
      console.error("Error fetching roadmap:", err);
      return null;
    }
  },

  listUserRoadmaps: async (userId) => {
    try {
      const q = query(
        collection(db, 'Roadmaps'),
        where('userId', '==', userId)
      );
      const snapshots = await getDocs(q);
      // Sort by updatedAt in memory since orderBy might require composite index
      const roadmaps = snapshots.docs.map(d => d.data());
      return roadmaps.sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return b.updatedAt.toMillis() - a.updatedAt.toMillis();
      });
    } catch (err) {
      console.error("Error listing roadmaps:", err);
      return [];
    }
  },

  deleteRoadmap: async (userId, roadmapId) => {
    try {
      await deleteDoc(doc(db, 'Roadmaps', roadmapId));
      // Also clear progress/grind locally if it was the active one
      // (This is handled by UI redirects usually)
      return true;
    } catch (err) {
      console.error("Error deleting roadmap:", err);
      return false;
    }
  },

  // --- PROGRESS & ACTIVITY ---

  updateTaskProgress: async (userId, taskId, isCompleted, behaviorData = {}) => {
    try {
      // Progress is still keyed by userId for now for simplicity, 
      // but in a full multi-course app, it should be keyed by roadmapId
      const progressRef = doc(db, 'Progress', userId);
      const docSnap = await getDoc(progressRef);

      const newAction = {
        taskId,
        status: isCompleted ? 'completed' : 'partial',
        timeSpent: behaviorData.timeSpent || 0,
        timestamp: new Date().toISOString().split('T')[0]
      };

      if (!docSnap.exists()) {
        await setDoc(progressRef, {
          userId,
          tasks: { [taskId]: { isCompleted, ...behaviorData, lastUpdated: serverTimestamp() } },
          activity: [newAction],
          lastUpdated: serverTimestamp()
        });
      } else {
        const currentData = docSnap.data();
        const updatedActivity = [...(currentData.activity || []), newAction];
        await updateDoc(progressRef, {
          [`tasks.${taskId}`]: { isCompleted, ...behaviorData, lastUpdated: serverTimestamp() },
          activity: updatedActivity,
          lastUpdated: serverTimestamp()
        });
      }
      return true;
    } catch (err) {
      return false;
    }
  },

  getUserProgress: async (userId) => {
    try {
      const progressRef = doc(db, 'Progress', userId);
      const docSnap = await getDoc(progressRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { tasks: data.tasks || {}, activity: data.activity || [] };
      }
      return { tasks: {}, activity: [] };
    } catch (err) {
      return { tasks: {}, activity: [] };
    }
  },

  // --- ACCOUNT MANAGEMENT ---

  resetUserData: async (userId) => {
    try {
      // Nukes progress and active plans to allow a completely fresh start
      const refs = [
        doc(db, 'Progress', userId),
        doc(db, 'DailyCache', userId),
        doc(db, 'GrindStates', userId),
        doc(db, 'GrindPlans', userId)
      ];
      await Promise.all(refs.map(r => deleteDoc(r)));
      return true;
    } catch (err) {
      console.error("Error resetting data:", err);
      return false;
    }
  },

  nukeEverything: async (userId) => {
    try {
      // 1. Fetch all roadmaps for this user
      const q = query(collection(db, 'Roadmaps'), where('userId', '==', userId));
      const snapshots = await getDocs(q);

      const deletions = [];
      snapshots.forEach(roadmapDoc => {
        deletions.push(deleteDoc(doc(db, 'Roadmaps', roadmapDoc.id)));
      });

      // 2. Clear all other keyed documents
      deletions.push(
        deleteDoc(doc(db, 'Progress', userId)),
        deleteDoc(doc(db, 'DailyCache', userId)),
        deleteDoc(doc(db, 'GrindStates', userId)),
        deleteDoc(doc(db, 'GrindPlans', userId)),
        deleteDoc(doc(db, 'Users', userId))
      );

      await Promise.all(deletions);
      return true;
    } catch (err) {
      console.error("Nuclear reset failed:", err);
      return false;
    }
  },

  // --- CACHE & GRIND ---

  getDailyCache: async (userId) => {
    try {
      const cacheRef = doc(db, 'DailyCache', userId);
      const docSnap = await getDoc(cacheRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.lastUpdated === new Date().toISOString().split('T')[0] ? data.cache : null;
      }
      return null;
    } catch (err) { return null; }
  },

  updateDailyCache: async (userId, cacheData) => {
    try {
      const cacheRef = doc(db, 'DailyCache', userId);
      await setDoc(cacheRef, {
        userId,
        cache: cacheData,
        lastUpdated: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });
      return true;
    } catch (err) { return false; }
  },

  saveGrindPlan: async (userId, plan) => {
    try {
      await setDoc(doc(db, 'GrindPlans', userId), { userId, plan, updatedAt: serverTimestamp() });
      return true;
    } catch (err) { return false; }
  },

  getGrindPlan: async (userId) => {
    try {
      const snap = await getDoc(doc(db, 'GrindPlans', userId));
      return snap.exists() ? snap.data().plan : null;
    } catch (err) { return null; }
  },

  saveGrindState: async (userId, state) => {
    try {
      await setDoc(doc(db, 'GrindStates', userId), { userId, ...state, lastUpdated: serverTimestamp() }, { merge: true });
      return true;
    } catch (err) { return false; }
  },

  getGrindState: async (userId) => {
    try {
      const snap = await getDoc(doc(db, 'GrindStates', userId));
      return snap.exists() ? snap.data() : { currentDay: 0, lastCommitDate: null, streak: 0 };
    } catch (err) { return { currentDay: 0, lastCommitDate: null, streak: 0 }; }
  },

  getUserProfile: async (userId) => {
    try {
      const snap = await getDoc(doc(db, 'Users', userId));
      return snap.exists() ? snap.data().profile : null;
    } catch (err) { return null; }
  },

  saveUserProfile: async (userId, profileData) => {
    try {
      await setDoc(doc(db, 'Users', userId), { profile: profileData, lastUpdated: serverTimestamp() }, { merge: true });
      return true;
    } catch (err) { return false; }
  }
};
