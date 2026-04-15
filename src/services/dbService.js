import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

export const dbService = {
  // Save or Update Active Roadmap
  saveRoadmap: async (userId, roadmapData, metadata) => {
    try {
      const roadmapRef = doc(db, 'Roadmaps', userId);
      await setDoc(roadmapRef, {
        userId,
        phases: roadmapData.phases,
        role: metadata.role,
        stack: metadata.stack,
        level: metadata.level,
        timeConstraint: metadata.timeConstraint,
        updatedAt: serverTimestamp(),
        isActive: true
      });
      return true;
    } catch (err) {
      console.error("Error saving roadmap:", err);
      return false;
    }
  },

  // Get Active Roadmap
  getActiveRoadmap: async (userId) => {
    try {
      const roadmapRef = doc(db, 'Roadmaps', userId);
      const docSnap = await getDoc(roadmapRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (err) {
      console.error("Error fetching roadmap:", err);
      return null;
    }
  },

  // Update Task Progress with Behavior Metadata
  updateTaskProgress: async (userId, taskId, isCompleted, behaviorData = {}) => {
    try {
      const progressRef = doc(db, 'Progress', userId);
      const docSnap = await getDoc(progressRef);
      
      const newAction = {
        taskId,
        status: isCompleted ? 'completed' : 'partial',
        timeSpent: behaviorData.timeSpent || 0,
        timestamp: new Date().toISOString().split('T')[0] // Calendar date YYYY-MM-DD
      };

      if (!docSnap.exists()) {
        await setDoc(progressRef, {
          userId,
          tasks: { 
            [taskId]: { 
              isCompleted, 
              ...behaviorData,
              lastUpdated: serverTimestamp() 
            } 
          },
          activity: [newAction],
          lastUpdated: serverTimestamp()
        });
      } else {
        const currentData = docSnap.data();
        const updatedActivity = [...(currentData.activity || []), newAction];
        
        await updateDoc(progressRef, {
          [`tasks.${taskId}`]: { 
            isCompleted, 
            ...behaviorData, 
            lastUpdated: serverTimestamp() 
          },
          activity: updatedActivity,
          lastUpdated: serverTimestamp()
        });
      }
      return true;
    } catch (err) {
      console.error("Error updating progress:", err);
      return false;
    }
  },

  // Get User Progress (Tasks + Activity History)
  getUserProgress: async (userId) => {
    try {
      const progressRef = doc(db, 'Progress', userId);
      const docSnap = await getDoc(progressRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          tasks: data.tasks || {},
          activity: data.activity || []
        };
      }
      return { tasks: {}, activity: [] };
    } catch (err) {
      console.error("Error fetching progress:", err);
      return { tasks: {}, activity: [] };
    }
  },

  // Save Stats (Streaks, Skill Score)
  updateUserStats: async (userId, stats) => {
    try {
      const userRef = doc(db, 'Users', userId);
      await setDoc(userRef, {
        stats,
        lastActive: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Error updating stats:", err);
      return false;
    }
  },

  // Get User Stats
  getUserStats: async (userId) => {
    try {
      const userRef = doc(db, 'Users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data().stats;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user stats:", err);
      return null;
    }
  },

  // Save/Update User Profile (Draft info like Role, Stack, etc)
  saveUserProfile: async (userId, profileData) => {
    try {
      const userRef = doc(db, 'Users', userId);
      await setDoc(userRef, {
        profile: profileData,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Error saving user profile:", err);
      return false;
    }
  },

  // Get User Profile
  getUserProfile: async (userId) => {
    try {
      const userRef = doc(db, 'Users', userId);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        return docSnap.data().profile || null;
      }
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  }
};
