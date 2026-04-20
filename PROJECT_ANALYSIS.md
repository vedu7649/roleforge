# RoleForge AI - Comprehensive Code Analysis

## Project Overview
RoleForge AI is an advanced personalized learning platform that uses Google's Gemini 2.0 Flash Lite AI to generate customized technical learning roadmaps. Users can follow structured learning paths, track progress, grind daily challenges, and get AI-powered feedback on their development.

**Tech Stack:**
- Frontend: React 19.2.4 + React Router 7.14.0
- UI Library: Lucide React (icons)
- Styling: CSS (theme-aware with light/dark modes)
- Backend: Firebase (Auth, Firestore)
- AI: Google Generative AI SDK (@google/generative-ai 0.24.1)
- Build: Vite 8.0.4

---

## Complete User Flow: Login to Learning

### 1. **Authentication Flow (Auth.jsx)**
```
User visits app
  ↓
App.jsx checks Firebase auth state (onAuthStateChanged)
  ↓
NOT LOGGED IN → Shows /login route → Auth.jsx
  ↓
User clicks "Sign in with Google"
  ↓
signInWithPopup(auth, googleProvider)
  ↓
Firebase Auth handles Google OAuth popup
  ↓
User grants permission
  ↓
Auth state updates in App.jsx
  ↓
User redirected to last visited page or "/" (Profiler)
```

**Error Handling:** 
- Catches `auth/popup-closed-by-user` for user cancellation
- Shows user-friendly error messages
- Credentials validated through Firebase

---

### 2. **Profile Initialization (Profiler.jsx)**
```
User lands on "/" (Profiler)
  ↓
Component checks for existing active roadmap
  ├─ If found: Shows resume section with existing path
  └─ If not found: Shows initialization form
  ↓
User fills form:
  - Role: "Frontend Developer", "AI Engineer", etc.
  - Level: "Beginner", "Intermediate", "Advanced"
  - Time Constraint: "1 month" (Aggressive), "3 months" (Balanced), 
                     "6 months" (Deep), "1 year" (Mastery)
  ↓
Profile saved to Firestore (dbService.saveUserProfile)
  ↓
Navigate to /stack-selection with form data
```

**Data Storage:** 
- Profile stored in Firestore `Users` collection under `userId`
- Recoverable from Cloud if app state lost

---

### 3. **Stack Selection (StackSelection.jsx)**
```
User arrives with role from Profiler
  ↓
Component calls: aiService.getStackSuggestions(role)
  ↓
AI generates 3-5 tech stack recommendations based on role
  Examples:
  - Frontend: "Next.js, React, Tailwind"
  - Backend: "Go, Gin, PostgreSQL"
  - AI/ML: "[AI-generated stack]"
  ↓
User selects one stack
  ↓
Profile updated with stack selection
  ↓
Navigate to /dashboard with full profile
```

**AI Call Details:**
- Uses `requestQueue` for sequential processing
- `retryWithBackoff` for rate limit handling
- Fallback stacks if API fails

---

### 4. **Roadmap Generation (Dashboard.jsx)**
```
User arrives at /dashboard with profile data
  ↓
Dashboard initialization sequence:
  ┌─ Load existing roadmap from Firestore
  │  └─ If none found AND profile complete → Generate new roadmap
  ├─ Load user's progress history
  └─ Generate daily AI cache (if fresh cache not available)
  ↓
Roadmap Generation:
  aiService.generateRoadmap(role, stack, level, timeConstraint)
  │
  ├─ AI generates 4-6 phases with:
  │  ├─ Concepts: Role-specific learning topics
  │  ├─ Tasks: Detailed learning tasks with subtopics
  │  ├─ Checkpoint: Interview question for each phase
  │  └─ Project: Capstone project for phase completion
  │
  └─ If AI fails → Use hardcoded fallback roadmaps
     (Frontend, Backend, AI/ML role-specific fallbacks included)
  ↓
Roadmap saved to Firestore `Roadmaps` collection
  ↓
Dashboard displays the roadmap with cards for:
  - DSA Problems
  - Projects
  - Flashcards
  - System Design
  - Tech Awareness
  - Visibility Tasks
  - Career Guidance
  - Interview Questions
```

**Dashboard Flow:**
- Shows phases in accordion view
- Each task displays objective, why, and execution steps
- Tasks locked until prerequisites completed
- Daily cache generated once per day

---

### 5. **Daily Learning (Track.jsx & Dashboard.jsx)**
```
User navigates to /dashboard or /track
  ↓
Shows current phase and locked/unlocked tasks
  ├─ Green: Completed tasks
  ├─ Blue: Current phase tasks (unlocked)
  └─ Gray: Locked tasks (prerequisites required)
  ↓
User clicks on task → TaskExecutionCard expands
  ├─ Shows objective & rationale
  ├─ Shows execution steps (Learn → Do → Check)
  ├─ Optional timer for session tracking
  └─ Mark complete button
  ↓
On completion:
  dbService.updateTaskProgress(userId, taskId, true)
  │
  ├─ Updates Progress document with task completion
  ├─ Logs activity with timestamp
  └─ Triggers streak calculation
  ↓
Performance Dashboard updates:
  - Completion percentage
  - Current streak
  - Behavior signals (pace, consistency, focus, depth)
  - Calendar visualization of activity
```

---

### 6. **Daily Grind Mode (Grind.jsx)**
```
User navigates to /grind
  ↓
Loads existing grind plan OR initiates plan generation
  ↓
Plan Generation:
  aiService.generateBulkGrindPlan(profile, progressCallback)
  │
  ├─ Calculates total items per category:
  │  ├─ DSA: 2x time constraint multiplier (capped at 50)
  │  ├─ Project: 2x multiplier
  │  ├─ Revision: 3x multiplier
  │  ├─ Visibility: 2x multiplier
  │  ├─ System Design: 2x multiplier
  │  ├─ Tech Awareness: 3x multiplier
  │  └─ Career: 2x multiplier
  │
  └─ Generates in small batches (3 items) to avoid API throttling
  ↓
Plan saved to Firestore `GrindPlans` collection
  ↓
Daily Grind Display:
  ┌─ One DSA Problem (random from daily set)
  ├─ One Project Suggestion
  ├─ One Flashcard
  ├─ One Visibility Task
  ├─ One System Design Topic
  ├─ One Tech Awareness Article
  ├─ One Career Guidance Block
  └─ "Commit to Today" Button (logs daily activity)
  ↓
On "Commit to Today":
  ├─ Records activity timestamp
  ├─ Updates streak calculation
  ├─ Increments daily counter
  └─ Persists in GrindStates
```

---

### 7. **Interview Mode (Interviewer.jsx)**
```
User navigates to /interviewer with milestone data
  ↓
Generate interview question:
  aiService.generateInterviewQuestion(milestone)
  │
  ├─ AI generates question appropriate to milestone
  ├─ Includes expected answer depth
  └─ Assigns difficulty level
  ↓
User answers in text area
  ↓
On submission:
  aiService.evaluateAnswer(question, expected, actual)
  │
  ├─ AI evaluates candidate answer
  ├─ Scores 0-100
  ├─ Identifies weak areas
  └─ Returns pass/fail result
  ↓
Result saved to Firestore
  ↓
User sees feedback and weak areas
```

---

### 8. **Profile Management (Profile.jsx)**
```
User navigates to /profile
  ↓
Displays:
  ├─ All created roadmaps (most recent per role)
  ├─ Current stats: streak, completions
  ├─ Quick actions:
  │  ├─ "Resume Course" → Navigate to /dashboard
  │  ├─ "Restart Course" → Reset progress & streak
  │  └─ "Delete Course" → Remove roadmap entirely
  └─ "Start New Path" → Navigate to Profiler
  ↓
"Nuke Everything" action:
  dbService.nukeEverything(userId)
  │
  └─ Deletes all roadmaps, progress, cache, and grind state
```

---

## Architecture Overview

### Page Hierarchy
```
App.jsx (Main Router)
├── /login → Auth.jsx (Public)
├── / → Profiler.jsx (Protected)
├── /stack-selection → StackSelection.jsx (Protected)
├── /dashboard → Dashboard.jsx (Protected)
├── /track → Track.jsx (Protected)
├── /grind → Grind.jsx (Protected)
├── /profile → Profile.jsx (Protected)
├── /interviewer → Interviewer.jsx (Protected)
└── Navbar (Global, in all pages)
```

### Component Architecture
```
App.jsx
├── ErrorBoundary (Top-level error catch)
├── Router
├── Navbar (Navigation, Auth, Theme toggle)
├── MobileBottomNav (Mobile navigation)
├── ProtectedRoute wrapper
└── Main content routes
    ├── Dashboard.jsx
    │   ├── PerformanceDashboard (Stats & Activity)
    │   ├── TaskExecutionCard (Task details & timer)
    │   ├── DSAProblemCard (2-problem carousel)
    │   ├── ProjectSuggestionCard (Project ideas)
    │   ├── RevisionCard (Flashcards)
    │   ├── VisibilityCard (Visibility tasks)
    │   ├── SystemDesignCard (System architecture)
    │   ├── TechAwarenessCard (Tech trends)
    │   └── CareerAwarenessCard (Career paths)
    ├── Track.jsx
    │   ├── PerformanceDashboard
    │   └── TaskExecutionCard (for each task)
    ├── Grind.jsx
    │   ├── GrindLoader (Generation progress)
    │   ├── DSAProblemCard
    │   ├── ProjectSuggestionCard
    │   ├── RevisionCard
    │   ├── VisibilityCard
    │   ├── SystemDesignCard
    │   ├── TechAwarenessCard
    │   └── CareerAwarenessCard
    └── Profile.jsx (Course list & management)
```

---

## Services Architecture

### 1. **Firebase Service (firebase.js)**

**Configuration:**
- Uses environment variables: `VITE_FIREBASE_*`
- Validates config before initialization
- **Critical Issue:** If config missing, `auth` becomes a mock object

```javascript
// Mock auth if config invalid
auth = { 
  currentUser: null, 
  onAuthStateChanged: (cb) => { console.warn("..."); return () => {}; } 
}
```

**Features:**
- Firestore with persistent local cache and multi-tab manager
- Auth with Google OAuth provider
- Offline support through local caching

---

### 2. **AI Service (aiService.js)**

**Core Mechanism: Request Queue + Rate Limiting**

```
RequestQueue Class:
├─ Queues API requests
├─ Enforces 1000ms minimum delay between requests
├─ Processes sequentially (no parallel)
└─ Prevents API overload

Retry with Backoff:
├─ Detects 429/quota errors
├─ Exponential backoff: baseDelay × 2^attempt
├─ On quota error: Sets 60-second cooldown
├─ Max 3 retries per request
└─ Throws error after max retries
```

**API Methods:**

| Method | Purpose | Queue | Retries | Fallback |
|--------|---------|-------|---------|----------|
| `generateRoadmap` | Main learning path | ✓ | 3 | Role-specific hardcoded |
| `generateDSAProblems` | Coding challenges | ✓ | 3 | LeetCode problems |
| `generateProjectSuggestions` | Project ideas | ✓ | 3 | Generic projects |
| `generateFlashcards` | Spaced repetition | ✓ | 3 | Basic flashcards |
| `generateVisibilityTasks` | Personal branding | ✓ | 3 | Portfolio tasks |
| `generateSystemDesignTopics` | Architecture | ✓ | 3 | Standard topics |
| `generateTechAwareness` | Tech trends | ✓ | 3 | Basic trends |
| `generateCareerGuidance` | Career paths | ✓ | 3 | Standard roles |
| `generateInterviewQuestion` | Interview prep | ✓ | 3 | Generic question |
| `evaluateAnswer` | Answer evaluation | ✓ | 3 | Auto-pass fallback |
| `generateBulkGrindPlan` | Daily plan generation | ✓ | N/A | Fallback per category |

**Rate Limiting Implementation:**

```javascript
// Global cooldown (60 seconds on 429 error)
let quotaCooldownUntil = 0;

// In retryWithBackoff:
if (quotaCooldownUntil > Date.now()) {
  throw new Error("COOLDOWN");
}
// On 429 error:
quotaCooldownUntil = Date.now() + 60000;
```

**Fallback Data:** 
Comprehensive hardcoded fallbacks for each category (DSA, projects, flashcards, etc.)

---

### 3. **Database Service (dbService.js)**

**Collections:**

| Collection | Key | Purpose | Merge Strategy |
|------------|-----|---------|-----------------|
| `Roadmaps` | Generated ID | Learning roadmaps | setDoc (new) |
| `Progress` | `userId` | Task completion status | updateDoc |
| `DailyCache` | `userId` | Daily AI-generated content | setDoc (overwrite) |
| `GrindPlans` | `userId` | Grind plan items | setDoc (overwrite) |
| `GrindStates` | `userId` | Streak, current day | setDoc merge: true |
| `Users` | `userId` | User profile data | setDoc merge: true |

**Key Operations:**

```javascript
// Roadmap Management
saveRoadmap(userId, roadmapData, metadata)
  → Marks existing active roadmaps as inactive
  → Creates new active roadmap
  → Returns roadmapId

getActiveRoadmap(userId)
  → Returns only isActive: true roadmap

listUserRoadmaps(userId)
  → Returns all roadmaps sorted by updatedAt

// Progress Tracking
updateTaskProgress(userId, taskId, isCompleted, behaviorData)
  → Records completion with timestamp
  → Adds to activity array (for streak calculation)
  → Enables streak synchronization across devices

getUserProgress(userId)
  → Returns { tasks: {}, activity: [] }

// Cache Management
getDailyCache(userId)
  → Returns cached data if generated today
  → Null if cache outdated

updateDailyCache(userId, cacheData)
  → Stores with lastUpdated date (prevents duplicate generation)

// Account Management
resetUserData(userId)
  → Clears progress, cache, grind state (keeps roadmap)

nukeEverything(userId)
  → DELETES all data (roadmaps, progress, cache, grind state, profile)
```

---

## Data Flow: From User Input to Display

### Example: Dashboard Page Load

```
User navigates to /dashboard
  ↓
Dashboard.useEffect initializes:
  ├─ Step 1: Load Profile (state or Firebase)
  ├─ Step 2: Check for existing roadmap
  │   ├─ If found in state → use it
  │   ├─ If found in Firestore → use it
  │   └─ If not found → Generate new via AI
  │       └─ aiService.generateRoadmap()
  │           → requestQueue.add()
  │               → retryWithBackoff()
  │                   → model.generateContent(prompt)
  ├─ Step 3: Normalize roadmap structure
  ├─ Step 4: Load user progress history
  │   └─ dbService.getUserProgress(userId)
  ├─ Step 5: Check daily cache status
  │   ├─ If fresh cache exists → use it
  │   └─ If expired → Generate 7 new daily modules
  │       ├─ DSA problems
  │       ├─ Projects
  │       ├─ Flashcards
  │       ├─ Visibility tasks
  │       ├─ System design
  │       ├─ Tech trends
  │       └─ Career guidance
  │       └─ Save to DailyCache
  └─ Step 6: Set state, render UI
  ↓
Performance Dashboard receives:
  ├─ stats: { completion%, streak, etc. }
  ├─ behaviorSignals: { pace, consistency, focus, depth }
  ├─ activityHistory: timestamps of completed tasks
  └─ timeConstraint: for calendar visualization
  ↓
Task cards receive:
  ├─ Task data from roadmap
  ├─ Completion status from progress
  ├─ Lock status (checks prerequisites)
  └─ Timer running flag
  ↓
User clicks on task:
  ├─ TaskExecutionCard expands
  ├─ Timer starts (if enabled)
  └─ Shows objective, why, and steps
  ↓
User marks complete:
  ├─ dbService.updateTaskProgress()
  │   └─ Records activity with timestamp
  ├─ Streak recalculated on next page load
  └─ Dashboard state refreshes
```

---

## AI API Call Management

### Request Lifecycle

```
User action triggers AI call
  ↓
requestQueue.add(async () => {
  return retryWithBackoff(async () => {
    // Check if in cooldown period
    if (quotaCooldownUntil > Date.now()) {
      throw new Error("COOLDOWN");
    }
    
    // Make API call
    const res = await model.generateContent(prompt);
    return parseAIResponse(res.response.text());
  }, maxRetries=3, baseDelay=1000);
})
  ↓
Request queued and processed sequentially
  ↓
If successful:
  ├─ Parse JSON response
  ├─ Validate structure
  └─ Return to caller
  ↓
If fails with 429/quota:
  ├─ Set cooldown = now + 60000ms
  ├─ Retry after exponential backoff
  └─ If max retries exceeded → throw error
  ↓
If error not quota-related:
  ├─ Retry with exponential backoff
  ├─ Max 3 retries
  └─ Fallback on final failure
```

### Rate Limit Handling Strategy

**Problem:** Google Gemini API has rate limits (typically 10 requests/min or 1000 requests/day)

**Solution Implemented:**
1. **Sequential Processing**: Only 1 request in flight at a time
2. **Minimum Delay**: 1000ms between requests (prevents burst)
3. **Quota Detection**: Catches 429 and 'quota' error messages
4. **60-Second Cooldown**: Pauses all requests for 60s on quota error
5. **Exponential Backoff**: 1s → 2s → 4s delays
6. **Fallback Data**: Hardcoded responses for all AI methods

**Dashboard Daily Generation:**
- Calls 7 AI methods sequentially (Dashboard.jsx lines ~120-150)
- Each wrapped in try/catch with fallback
- Uses Firestore DailyCache to prevent regeneration within same day
- **Total time**: ~8-10 seconds (7 methods × 1-2s each)

**Grind Plan Generation:**
- Batches requests in groups of 3
- Smaller batches = lower risk of quota exhaustion
- Calls callback to update progress UI
- ~60-90 requests total for 3-month constraint
- **Total time**: ~2-3 minutes

---

## Error Handling Patterns

### 1. **Error Boundary (ErrorBoundary.jsx)**
```javascript
// Catches React component crashes
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error("Critical System Error Detected:", error, errorInfo);
  }
  
  // Displays user-friendly error page with:
  // - Styled error message
  // - Technical details (error.toString())
  // - Action buttons (Reboot/Return Home)
  // - Env variable hint
}
```

### 2. **Service-Level Error Handling**

**Firebase Config Validation:**
```javascript
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
  console.error("⚠️ FIREBASE CONFIGURATION MISSING...");
  // Return mock auth object
}
```

**AI Service Errors:**
```javascript
// Automatic fallback on AI failure
async generateDSAProblems(...) {
  try {
    // AI call
  } catch (e) {
    return this.fallbacks.dsa.slice(0, count); // Fallback
  }
}
```

**Database Errors:**
```javascript
// Returns safe defaults on Firestore errors
async getUserProgress(userId) {
  try {
    const data = await getDoc(...);
    return data.exists() ? data.data() : { tasks: {}, activity: [] };
  } catch (err) {
    return { tasks: {}, activity: [] }; // Safe default
  }
}
```

### 3. **Component-Level Error Handling**

**User Feedback:**
- Loading states with spinners
- Error messages in glass panels
- User-friendly error messages (vs. technical ones)
- Retry buttons for failed operations

---

## Potential Issues & Crash Points

### 🔴 **Critical Issues**

#### 1. **Firebase Configuration Missing**
- **Location:** `firebase.js` initialization
- **Symptom:** App doesn't crash but auth is mocked, no persistence
- **Impact:** All auth features fail silently, user data not saved
- **Fix:** Validate `.env` file has all `VITE_FIREBASE_*` variables

#### 2. **Gemini API Key Missing**
- **Location:** `aiService.js` line 3
- **Symptom:** AI calls fail immediately, always uses fallback
- **Impact:** All generated content is hardcoded (not personalized)
- **Fix:** Set `VITE_GEMINI_API_KEY` in deployment environment

#### 3. **Roadmap Generation Failure**
- **Location:** `Dashboard.jsx` line ~60
- **Symptom:** Blank dashboard or error message
- **Cause:** AI fails, fallback generation fails, no stack in profile
- **Fix:** Ensure user completed StackSelection, has valid role/stack

#### 4. **Uninitialized State in Tasks**
- **Location:** `aiService.generateRoadmap()` line ~360
- **Issue:** Tasks may have undefined prerequisites array
- **Symptom:** Locked task display breaks (lock indicator missing)
- **Evidence:** Code handles this but should validate all tasks

---

### 🟡 **High-Risk Issues**

#### 5. **Streak Calculation Logic Error**
- **Location:** Multiple files (Dashboard, Track, Grind, Profile)
- **Issue:** Each file calculates streak independently
- **Problem:** Inconsistency if activity timestamps unclear
- **Code:** 
  ```javascript
  const dates = [...new Set(activity.map(a => a.timestamp))].sort().reverse();
  // Check if dates[0] === today or yesterday
  // Then count consecutive days
  ```
- **Risk:** Streak resets unexpectedly if timestamp format varies

#### 6. **Firestore Offline Cache**
- **Location:** `firebase.js` initialization
- **Feature:** `persistentLocalCache` enabled
- **Risk:** Offline data might be stale after several days
- **No Sync Conflict:** Doesn't handle multi-device conflicts

#### 7. **Daily Cache Expiration**
- **Location:** `dbService.getDailyCache()`
- **Issue:** Compares `lastUpdated === new Date().toISOString().split('T')[0]`
- **Risk:** If user crosses timezones, cache expires incorrectly
- **Timeline**: Could cause unnecessary API calls

#### 8. **Task Prerequisite Chains**
- **Location:** `aiService.generateRoadmap()` lines 340-350
- **Issue:** Prerequisites link to "last task of previous phase"
- **Problem:** If phase has 0 tasks, chain breaks
- **Current Code:**
  ```javascript
  prerequisites: Array.isArray(task.prerequisites) 
    ? task.prerequisites 
    : previousPhaseTasks.slice(-1) // Takes only last task
  ```
- **Risk:** Middle tasks may not have proper unlock conditions

---

### 🟠 **Medium-Risk Issues**

#### 9. **No Validation on AI Response Structure**
- **Location:** `aiService.parseAIResponse()`
- **Issue:** Only regex matches `[...]` or `{...}` patterns
- **Risk:** Malformed JSON causes parse error → fallback
- **No validation:** Field types, required keys not checked

#### 10. **Bulk Grind Plan Generation**
- **Location:** `aiService.generateBulkGrindPlan()` lines 1000+
- **Issue:** Generates 60-90 API requests sequentially
- **Timeline:** Takes 2-3 minutes to complete
- **UX Risk:** User might close browser before completion
- **No persistence:** If fails mid-generation, all progress lost

#### 11. **Memory Leak in Timer**
- **Location:** `TaskExecutionCard.jsx` useEffect
- **Code:**
  ```javascript
  useEffect(() => {
    if (expanded && !isCompleted && isTimerRunning && showTimer) {
      timerRef.current = setInterval(() => { ... }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [expanded, isCompleted, isTimerRunning, showTimer]);
  ```
- **Risk:** If timer never stops, interval continues in background
- **Mitigation:** Dependencies look correct but should verify

#### 12. **No Duplicate Prevention in AI Generation**
- **Location:** `aiService.generateBulkGrindPlan()` → `_generateItemsForCategory()`
- **Issue:** Creates `avoidIds` list of last 20 items, but AI might still generate duplicates
- **Problem:** With 60+ items, could have significant duplication
- **Fix:** More robust deduplication or timestamp-based uniqueness

---

### 🟢 **Low-Risk/Design Issues**

#### 13. **Mobile Navigation**
- **Location:** `App.jsx` has both desktop and mobile nav
- **Implementation:** Works but duplicates code
- **Suggestion:** Combine into single responsive component

#### 14. **Theme Persistence**
- **Location:** `App.jsx` line 20
- **Uses:** localStorage and system preference
- **Good:** Persists across sessions
- **Minor:** No sync between tabs (one tab changes theme, other doesn't know)

#### 15. **No Network Status Detection**
- **Location:** Various pages catch Firestore errors
- **Missing:** No global offline indicator
- **Feature:** App continues working offline but UI doesn't indicate it

#### 16. **Hardcoded Time Constraint Mapping**
- **Location:** `aiService.js` line 18
- **Code:**
  ```javascript
  const TIME_MAP = {
    '1 month': 30,
    '3 months': 90,
    '6 months': 180,
    '1 year': 365
  };
  ```
- **Risk:** If user selects different time value, map lookup fails

---

## Suspicious Code Patterns

### Pattern 1: **Normalize Roadmap Function Missing**
- **Location:** `Track.jsx` calls `normalizeRoadmap()` but function not defined
- **Status:** Will throw ReferenceError at runtime
- **Severity:** HIGH - Will crash Track page

```javascript
// Track.jsx line ~80
activeRoadmap = normalizeRoadmap(activeRoadmap); // ← Not defined!
```

### Pattern 2: **Unused `navigate` Variable**
- **Location:** `App.jsx` Navbar function uses `navigate` but it's not imported
- **Status:** May cause ReferenceError
- **Code:**
  ```javascript
  onClick={() => {
    setProfileMenuOpen(false);
    navigate('/profile'); // ← navigate not defined in component scope
  }}
  ```
- **Expected:** Should use `useNavigate()` hook

### Pattern 3: **Duplicate Role-Specific Fallbacks**
- **Location:** `aiService.js` fallback roadmaps
- **Issue:** Fallback roadmaps are inside `_generateRoleSpecificFallback()`
- **Problem:** If called during bulk generation, returns inconsistent data
- **Risk:** Grind plan might have missing/malformed items

### Pattern 4: **Progress Update Doesn't Return Value**
- **Location:** `dbService.updateTaskProgress()`
- **Returns:** `true` on success but callers don't check return value
- **Risk:** Silent failures if Firestore write fails

### Pattern 5: **No Validation on Profile Completion**
- **Location:** Multiple places assume profile has role/stack/level
- **Risk:** If user skips steps or closes browser mid-flow, data incomplete
- **Mitigation:** Some pages check with Navigate but not consistent

---

## Summary of Rate Limiting

**API:** Google Generative AI (Gemini)

**Current Limits (Estimated):**
- Free tier: ~10-15 requests/minute
- Paid tier: Higher limits (not specified in code)

**RoleForge Implementation:**
| Scenario | Requests | Time | Status |
|----------|----------|------|--------|
| Load Dashboard | 7 sequential AI calls | 8-10s | ✅ Safe (sequential) |
| First grind plan gen | 60-90 requests | 2-3 min | ✓ Batched (ok) |
| Daily cache refresh | 7 requests | 8-10s | ✅ Safe |
| Interview question | 2 requests | 2-3s | ✅ Safe |
| **Stress test:** Multiple users | Could burst | Unknown | ⚠️ Risk |

**Protection Mechanisms:**
1. ✅ Sequential queue (no parallel)
2. ✅ 1000ms minimum delay
3. ✅ Exponential backoff on failure
4. ✅ 60-second cooldown on 429
5. ✅ Daily cache prevents re-generation
6. ✅ Comprehensive fallbacks
7. ❌ No per-user quota tracking
8. ❌ No request throttling dashboard
9. ❌ No warning when approaching limits

---

## Component Dependency Map

```
App.jsx (Main)
├── ErrorBoundary
├── Auth.jsx (standalone)
├── Profiler.jsx
│   └── dbService: saveUserProfile, listUserRoadmaps, getUserProfile
├── StackSelection.jsx
│   ├── aiService: getStackSuggestions
│   └── dbService: saveUserProfile, getUserProfile
├── Dashboard.jsx
│   ├── aiService: generateRoadmap, all daily cache generators
│   ├── dbService: getActiveRoadmap, saveRoadmap, getUserProgress, getDailyCache, updateDailyCache
│   ├── PerformanceDashboard
│   ├── TaskExecutionCard
│   └── [Daily Content Cards x7]
├── Track.jsx
│   ├── aiService: generateRoadmap
│   ├── dbService: getActiveRoadmap, saveRoadmap, getUserProfile, getUserProgress
│   ├── PerformanceDashboard
│   └── TaskExecutionCard
├── Grind.jsx
│   ├── aiService: generateBulkGrindPlan
│   ├── dbService: getGrindPlan, saveGrindPlan, getGrindState, saveGrindState, getUserProfile, getUserProgress, updateTaskProgress
│   ├── GrindLoader
│   └── [Content Cards x7]
├── Interviewer.jsx
│   ├── aiService: generateInterviewQuestion, evaluateAnswer
│   └── Firestore: addDoc to Progress
└── Profile.jsx
    ├── dbService: listUserRoadmaps, getGrindState, getUserProgress, resetUserData, nukeEverything
    └── useNavigate hooks

Navbar (Global)
├── auth: onAuthStateChanged, signOut
└── localStorage: theme persistence
```

---

## Fallback System Overview

**Fallbacks Available For:**
1. ✅ DSA Problems (4 LeetCode examples)
2. ✅ Projects (2 generic projects)
3. ✅ Visibility Tasks (4 personal branding ideas)
4. ✅ Tech Awareness (2 week topics)
5. ✅ Career Guidance (2 role descriptions)
6. ✅ Flashcards (2 basic flashcards)
7. ✅ System Design (2 architecture topics)
8. ✅ Roadmap (Role-specific hardcoded versions: Frontend, Backend, AI/ML, Generic)

**Fallback Coverage:** ~100% (every AI method has fallback)

---

## Testing Recommendations

### Unit Tests Needed
- [ ] `TaskExecutionCard` timer calculations
- [ ] Streak calculation logic (especially timezone edge cases)
- [ ] `parseAIResponse` with malformed JSON
- [ ] `retryWithBackoff` quota error handling
- [ ] Firestore offline cache behavior

### Integration Tests Needed
- [ ] Complete user flow: login → profiler → selection → dashboard
- [ ] Rate limit simulation (trigger multiple requests)
- [ ] Fallback activation (disable API key, verify fallbacks work)
- [ ] Offline functionality (disable network, verify cache works)
- [ ] Multi-device sync (same user, two browsers)

### E2E Tests Needed
- [ ] Interview flow and evaluation
- [ ] Grind plan generation (full 90+ requests)
- [ ] Streak persistence across browser sessions
- [ ] Mobile navigation on phones/tablets

---

## Deployment Checklist

- [ ] `.env` file has all 6 Firebase variables
- [ ] `.env` file has `VITE_GEMINI_API_KEY`
- [ ] Fix `normalizeRoadmap` function in Track.jsx
- [ ] Fix `navigate` scope in Navbar
- [ ] Test with Firebase config validation off
- [ ] Test with API key missing (fallbacks activate)
- [ ] Monitor quota usage in Google Cloud Console
- [ ] Set up error logging (currently only console.error)
- [ ] Consider implementing queue depth visualization
- [ ] Add request counter/dashboard for monitoring

---

## Conclusion

RoleForge AI is a **well-architected** system with:

**Strengths:**
- ✅ Comprehensive error handling & fallbacks
- ✅ Sophisticated rate limiting (sequential + exponential backoff)
- ✅ Offline-capable with Firestore cache
- ✅ Multi-device data sync
- ✅ Role-specific personalization
- ✅ Clean component hierarchy

**Weaknesses:**
- ❌ Missing `normalizeRoadmap` function (crash risk)
- ❌ Navigation scope issue in Navbar
- ❌ No global network status indicator
- ❌ Bulk grind generation can timeout
- ❌ Streak calculation inconsistency risk
- ❌ No API quota dashboard

**Risk Level:** MEDIUM (few critical bugs, good error handling overall)

**Recommended Priority Fixes:**
1. Add `normalizeRoadmap` function or remove calls
2. Fix `navigate` scope in Navbar
3. Add network status detection
4. Implement request quota monitoring
5. Standardize streak calculation across all pages
