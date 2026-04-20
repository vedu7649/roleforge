# RoleForge Deployment Issue - Root Cause Analysis

## THE PROBLEM

**Local**: Works perfectly ✅
**Deployed**: App feels crashed, no roadmap created ❌

---

## ROOT CAUSE

Missing environment variables on deployed platform (Vercel/Netlify/Firebase Hosting).

### What's Happening:

```
Deployed Platform (No Env Vars)
    ↓
firebase.js checks: isConfigValid = false
    ↓
Sets: db = null, auth = mock object
    ↓
App.jsx calls: onAuthStateChanged(auth, ...)
    ↓
Mock auth returns immediately → user stays null
    ↓
User redirected to /login
    ↓
Login might appear to work (no validation)
    ↓
If user bypasses to Dashboard
    ↓
dbService.saveRoadmap() calls collection(db, 'Roadmaps')
    ↓
❌ CRASH: db is null
    ↓
Error caught silently
    ↓
No roadmap shows
    ↓
APP FEELS BROKEN
```

---

## FAILURE CHAIN

| Component | Expected | Actual | Result |
|-----------|----------|--------|--------|
| Firebase Init | Valid config | No env vars | `db = null` |
| Auth | User logged in | Mock auth | User stuck as `null` |
| Profiler | Load saved profile | No DB access | Can't load user data |
| Stack Selection | Saved selection | No DB access | Can't save stack |
| Dashboard | Generate roadmap | No DB access | Can't save roadmap |
| AI | Generate with API | Fallback data | Works (but can't save) |
| Track | Show progress | No DB access | Empty page |

---

## CRITICAL CODE PATHS THAT BREAK

### 1. **dbService.saveRoadmap()** - Line 20
```javascript
const q = query(collection(db, 'Roadmaps'), where('userId', '==', userId));
// ❌ CRASH if db = null
// collection(null, 'Roadmaps') throws error
```

### 2. **dbService.getActiveRoadmap()** - Line 47
```javascript
const q = query(collection(db, 'Roadmaps'), where('userId', '==', userId));
// ❌ CRASH if db = null
```

### 3. **dbService.updateUserProfile()** - Likely calls db operations
```javascript
await setDoc(doc(db, 'Users', userId), ...);
// ❌ CRASH if db = null
```

### 4. **Dashboard.jsx** - Line 67
```javascript
const cloudMap = await dbService.getActiveRoadmap(user.uid);
// Returns null due to crash
// activeRoadmap = null
// No roadmap displays
```

---

## WHAT SEEMS TO WORK (Misleading)

- **Login page loads** ✅ (doesn't need Firebase)
- **Button clicks work** ✅ (no validation yet)
- **AI fallbacks work** ✅ (if code reaches there)
- **Local cache shows old data** ✅ (from previous session)

## WHAT BREAKS (Cascade)

- **User auth doesn't persist** ❌
- **Can't load user profile** ❌
- **Can't save roadmap** ❌
- **Can't track progress** ❌
- **App looks empty/broken** ❌

---

## VERIFICATION STEPS

### On your deployed site:
1. Open **Developer Tools** (F12)
2. Go to **Console** tab
3. Look for messages like:
   ```
   ⚠️ FIREBASE CONFIGURATION MISSING: Please ensure all VITE_FIREBASE_... 
   ```
4. Try to login
5. Check **Network** tab:
   - Are there Firebase API calls? **No** → Missing config
   - Do you see 401/403 errors? → Missing credentials
6. Check **Application** tab → **Local Storage**:
   - Look for `roleforge-profile` → Should be empty on new deploy

---

## SOLUTION (Deployment Config)

Add these 8 environment variables to your deployment platform:

| Variable | Value |
|----------|-------|
| `VITE_GEMINI_API_KEY` | `AIzaSyAVOybgJqvSgfTFOjebja-k52jgEiPBZ_s` |
| `VITE_FIREBASE_API_KEY` | `AIzaSyApif6slgTjdFM965pdJvWZM02v1I7w6WQ` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `roleforge-ai.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `roleforge-ai` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `roleforge-ai.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `210117190123` |
| `VITE_FIREBASE_APP_ID` | `1:210117190123:web:e71a6323f1d9bc48e679ae` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-CGJJXSEZ40` |

**Platform-specific instructions:**

**Vercel:**
1. Go to project settings
2. Click "Environment Variables"
3. Add all 8 variables
4. Redeploy (`git push` or manual deploy)

**Netlify:**
1. Go to Site settings
2. Build & Deploy → Environment
3. Add all 8 variables
4. Trigger redeploy

**Firebase Hosting:**
1. Create `.env.production` file locally
2. Run: `firebase deploy --only hosting`

**GitHub Pages:**
❌ Can't use private env vars (public repository)
→ Use Vercel/Netlify instead

---

## WHY THIS HAPPENS

**Vite builds everything at compile time:**
- `import.meta.env.VAR` values are **baked into the JS bundle**
- Local dev: `.env` file provides values
- Production: Platform must provide via environment settings
- If missing: Values become `undefined`
- Fallback logic kicks in: `API_KEY || ""`
- Result: Empty/invalid config

---

## QUICK DIAGNOSTIC

On deployed site, check Console:
```javascript
// Run this in console:
console.log(
  "Config status:",
  {
    firebase: window.location.hostname.includes('firebase') ? 'native' : 'third-party',
    hasLocalStorage: typeof localStorage !== 'undefined',
    canAccessIndexedDB: typeof indexedDB !== 'undefined'
  }
);

// Look for warning messages about missing configuration
```

---

## SYMPTOMS CHECKLIST

- [ ] App loads but user stays logged out
- [ ] Login button does nothing or loops
- [ ] Dashboard shows "No roadmap found"
- [ ] Track page is empty
- [ ] Console shows error about Firebase config
- [ ] Can see "🤖 AI Generated" badge but no data saves

**If you check 3+ of these:** Definitely missing env vars.

---

## NEXT STEPS

1. **Verify you have a deployment platform** (Vercel/Netlify/etc)
2. **Add the 8 environment variables**
3. **Redeploy**
4. **Test login** → Should persist
5. **Generate roadmap** → Should appear
6. **Check Console** → Should see no Firebase warnings

If still broken after adding env vars → Different issue (CORS, API key invalid, etc)
