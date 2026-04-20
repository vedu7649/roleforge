import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const AI_ENABLED = !!API_KEY;

if (!API_KEY) {
  console.warn("⚠️ GEMINI API KEY MISSING: AI-generated content will be disabled and fallbacks will be used. Please set VITE_GEMINI_API_KEY in your environment.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = API_KEY ? genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" }) : null;

const TIME_MAP = {
  '1 month': 30,
  '3 months': 90,
  '6 months': 180,
  '1 year': 365
};

const MULTIPLIERS = {
  dsa: 2,
  project: 2,
  revision: 3,
  visibility: 2,
  system: 2,
  tech: 3,
  career: 2
};

let quotaCooldownUntil = 0;

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastRequestTime = 0;
    this.minDelay = 1000;
  }
  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.process();
    });
  }
  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const { requestFn, resolve, reject } = this.queue.shift();
      try {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minDelay) {
          await new Promise(resolve => setTimeout(resolve, this.minDelay - timeSinceLastRequest));
        }
        const result = await requestFn();
        this.lastRequestTime = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (quotaCooldownUntil > Date.now()) throw new Error("COOLDOWN");
      return await fn();
    } catch (error) {
      if (error.message === "COOLDOWN") throw error;
      const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');
      if (!isQuotaError && attempt === maxRetries) throw error;
      let delay = baseDelay * Math.pow(2, attempt);
      if (isQuotaError) quotaCooldownUntil = Date.now() + 60000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

const parseAIResponse = (text) => {
  try {
    const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : clean);
  } catch (e) {
    console.error("Parse Error:", text);
    throw e;
  }
};

const SCENARIOS = [
  "High-concurrency e-commerce traffic",
  "Optimizing for extreme memory constraints",
  "Edge computing in low-latency environments",
  "Migrating a legacy monolithic system",
  "Real-time data streaming for analytics",
  "Building for offline-first reliability",
  "Scalable multi-tenant SaaS architecture",
  "Security-first fintech core systems",
  "AI-integrated background processing",
  "High-availability healthcare data pipelines"
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const aiService = {
  fallbacks: {
    dsa: [
      { id: 1, title: "Two Sum", platform: "leetcode", difficulty: "easy", link: "https://leetcode.com/problems/two-sum/" },
      { id: 2, title: "Valid Palindrome", platform: "leetcode", difficulty: "easy", link: "https://leetcode.com/problems/valid-palindrome/" },
      { id: 3, title: "Longest Substring Without Repeating Characters", platform: "leetcode", difficulty: "medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
      { id: 4, title: "Container With Most Water", platform: "leetcode", difficulty: "medium", link: "https://leetcode.com/problems/container-with-most-water/" }
    ],
    project: [
      { type: "advanced", title: "Real-time Collaboration Engine", description: "Build a distributed whiteboard with CRDT synchronization.", expectedOutcome: "Master conflict-free data types and WebSockets" },
      { type: "intermediate", title: "Custom Metric Aggregator", description: "Design a system to collect and visualize high-resolution server metrics.", expectedOutcome: "Understand timeseries data storage and visualization." }
    ],
    visibility: [
      { id: 1, title: "Open Source Contribution", problemStatement: "Find a 'good first issue' in a major React library.", solution: "Submitted a PR for documentation clarity.", difficulty: "medium" },
      { id: 2, title: "Tech Blog Post", problemStatement: "Explain 'Hydration' in modern frameworks.", solution: "Published a 500-word deep dive on Dev.to.", difficulty: "easy" },
      { id: 3, title: "Build a CLI Tool", problemStatement: "Automate a tedious part of your daily workflow.", solution: "Released a Node.js CLI tool for project scaffolding.", difficulty: "medium" },
      { id: 4, title: "Interactive Tutorial", problemStatement: "Create a guide for an advanced CSS concept.", solution: "Built a CodePen collection demonstrating Grid wizardry.", difficulty: "medium" }
    ],
    tech: [
      { week: "Micro-Frontend Architecture", items: [{ name: "Module Federation", type: "tool", description: "Sharing code between isolated builds." }] },
      { week: "Serverless State Management", items: [{ name: "Durable Objects", type: "tool", description: "Strongly consistent state at the edge." }] }
    ],
    career: [
      { role: "Senior Engineer", description: "Focus on cross-team leadership and system reliability.", skills: ["System Design", "Mentorship", "Budgeting"], workflow: ["Design review", "1-on-1s"] },
      { role: "Staff Architect", description: "Strategic tech decisions and long-term roadmap planning.", skills: ["Domain Driven Design", "Executive Presence"], workflow: ["Architecture council", "RFC review"] }
    ],
    flashcards: [
      { id: 1, question: "What is Event Sourcing?", answer: "Storing state changes as a sequence of events.", importance: "high" },
      { id: 2, question: "Define Sharding?", answer: "Partitioning data across multiple database instances.", importance: "high" }
    ],
    system: [
      { topic: "Global Load Balancing", flowSteps: ["User request", "DNS resolution", "Anycast routing", "PoP selection"], explanation: "Redirecting traffic to the nearest edge location." },
      { topic: "Database Replication Pools", flowSteps: ["Master write", "Binlog update", "Slave pull", "Async commit"], explanation: "Using secondary nodes for read-only scaling." }
    ]
  },

  async generateInterviewQuestion(milestone = "General Tech") {
    return await requestQueue.add(async () => {
      if (!AI_ENABLED) {
        console.log("📚 AI_DISABLED: Using fallback question");
        return { question: "Explain a difficult technical challenge you solved recently.", expectedAnswer: "Clear STAR methodology explanation.", difficulty: "medium" };
      }
      return await retryWithBackoff(async () => {
        try {
          const prompt = `You are a Senior Technical Interviewer. The user is at the '${milestone}' checkpoint.
          Generate a GENUINE, challenging interview question appropriate for this milestone.
          - If the role is AI/ML/Data: Focus on Linear Algebra, Calculus, Model Optimization, or Data Engineering.
          - If the role is Web/Mobile: Focus on UI performance, APIs, or State Management.
          DO NOT ASK generic questions like 'What is MERN' for AI roles.
          Return ONLY JSON: {question, expectedAnswer, difficulty}.`;

          const res = await model.generateContent(prompt);
          return parseAIResponse(res.response.text());
        } catch (e) {
          return { question: "Explain a difficult technical challenge you solved recently.", expectedAnswer: "Clear STAR methodology explanation.", difficulty: "medium" };
        }
      });
    });
  },

  async evaluateAnswer(question, expected, actual) {
    return await requestQueue.add(async () => {
      try {
        const prompt = `As a Senior Technical Interviewer, evaluate this candidate answer.
        Question: ${question}
        Expected Depth: ${expected}
        Candidate Answer: ${actual}
        
        Provide a JSON evaluation: {result: 'pass'|'fail', score: 0-100, feedback, weakAreas: []}`;

        const res = await model.generateContent(prompt);
        return parseAIResponse(res.response.text());
      } catch (e) {
        return { result: 'pass', score: 70, feedback: "System was unable to evaluate deeply. Manual pass granted.", weakAreas: [] };
      }
    });
  },

  async generateVisibilityTasks(completedDocs = [], role = "Developer", avoidList = [], count = 4) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.visibility.slice(0, count);
          const prompt = `Role: ${role}. Generate ${count} UNIQUE, genuine visibility tasks to build a technical personal brand.
          - AI Roles: Kaggle, HuggingFace, Paper Summaries, ML Performance benchmarks.
          - Web Roles: Open source PRs, Tech Blogs, Performance optimization demos.
          Return JSON array [{id, title, problemStatement, solution, difficulty}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.visibility.slice(0, count); }
      });
    });
  },

  async generateDSAProblems(role = "Developer", completedTopics = [], avoidList = [], count = 2) {
    return await requestQueue.add(async () => {
      if (!AI_ENABLED) {
        console.log("📚 AI_DISABLED: Using fallback DSA problems");
        return [{ problem: "Two Sum - Find two numbers that add to target", difficulty: "Easy", concepts: ["Hash Map"] }];
      }
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.dsa.slice(0, count);
          const prompt = `Role: ${role}. Generate ${count} UNIQUE DSA problems. 
          - For AI/ML: Prioritize Matrix manipulation, Tensors, Optimization algorithms, and Graph Theory.
          - For Web: Focused on Arrays, Trees, HashMaps, and Strings.
          Return JSON array [{id, title, platform, difficulty, link}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.dsa.slice(0, count); }
      });
    });
  },

  async generateProjectSuggestions(stack = "", completedPhases = 0, role = "Developer", avoidList = [], count = 2) {
    return await requestQueue.add(async () => {
      if (!AI_ENABLED) {
        console.log("📚 AI_DISABLED: Using fallback projects");
        return [{ title: "Build a REST API", description: "Create a backend API with authentication", complexity: "Intermediate" }];
      }
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.project.slice(0, count);
          const prompt = `Role: ${role}. Stack: ${stack}. Generate ${count} GENUINE, complex project ideas.
          - AI Roles: Fine-tuning pipelines, Custom Inference Engines, LLM RAG Systems, Data Lake architectures.
          - Web Roles: Microservices, Real-time collaboration, Progressive Web Apps with high-perf rendering.
          Return JSON array [{type, title, description, expectedOutcome}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.project.slice(0, count); }
      });
    });
  },

  async generateFlashcards(completedTopics = [], role = "Developer", avoidList = [], count = 3) {
    return await requestQueue.add(async () => {
      if (!AI_ENABLED) {
        console.log("📚 AI_DISABLED: Using fallback flashcards");
        return [{ front: "What is async/await?", back: "JavaScript syntax for handling asynchronous operations cleanly" }];
      }
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.flashcards.slice(0, count);
          const prompt = `Role: ${role}. Generate ${count} UNIQUE Active Recall flashcards.
          - AI Roles: Loss functions, Backpropagation, Gradient vanishing, Regularization math.
          - Web Roles: Browser rendering lifecycle, Auth flows, Caching strategies, DOM events.
          Return JSON array [{id, question, answer, importance}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.flashcards.slice(0, count); }
      });
    });
  },

  async generateSystemDesignTopics(role = "Developer", completedPhases = 0, avoidList = [], count = 2) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.system.slice(0, count);
          const prompt = `Role: ${role}. Generate ${count} UNIQUE System Architecture topics.
          - AI Roles: Distributed training, Model Sharding, Vector Databases, Feature Stores, Low-latency Inference.
          - Web Roles: Load balancing, CDN orchestration, SQL/NoSQL sharding, Websocket scaling.
          Return JSON array [{topic, flowSteps, explanation}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.system.slice(0, count); }
      });
    });
  },

  async generateTechAwareness(stack = "", role = "Developer", avoidList = [], count = 3) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.tech.slice(0, count);
          const prompt = `Role: ${role}. Current Stack: ${stack}. Generate ${count} UNIQUE tech trends.
          - AI Roles: New Model architectures (Transformers, State Space Models), AI Hardware (TPU, H100), Quantization.
          - Web Roles: Newer framework features (React Server Components), WASM, Edge computing trends.
          Return JSON array [{week, items:[{name, type, description}]}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.tech.slice(0, count); }
      });
    });
  },

  async generateCareerGuidance(role = "Developer", stack = "", completedPhases = 0, avoidList = [], count = 2) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return this.fallbacks.career.slice(0, count);
          const prompt = `Career Strategy for a ${role} using ${stack}. Generate ${count} UNIQUE advice blocks.
          - AI Roles: Research paths vs Engineering paths, MLOps specialization, Math vs SDE focus.
          - Web Roles: Product focus vs Architectural focus, Open source influence, Freelance vs Enterprise.
          Return JSON array [{role, description, skills, workflow}]. Avoid: ${avoidList.join(",")}`;
          const res = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
          return parseAIResponse(res.response.text());
        } catch (e) { return this.fallbacks.career.slice(0, count); }
      });
    });
  },

  async getStackSuggestions(role) {
    return await requestQueue.add(async () => {
      try {
        const prompt = `You are a Principal Architect. A user wants to become a ${role}. 
        Suggest 3 professional, industry-standard tech stacks that are highly relevant to this specific role TODAY. 
        - For AI/ML roles: Focus on Python/PyTorch/C++/Mojo.
        - For Web: Use modern frameworks (Next.js, Go, Rust, etc).
        - For Mobile: Use specialized mobile stacks.
        Avoid suggest generalist stacks (like MERN) for specialized roles.
        Return ONLY a JSON array of strings (e.g., ["Python, PyTorch, FastAPI", ...]).`;

        const res = await model.generateContent(prompt);
        return parseAIResponse(res.response.text());
      } catch (e) {
        return this._getSmartFallback(role);
      }
    });
  },

  _getSmartFallback(role) {
    const r = role.toLowerCase();
    if (r.includes('ai') || r.includes('machine') || r.includes('data')) {
      return ["Python, PyTorch, FastAPI", "Python, TensorFlow, Scikit-learn", "Mojo, Modular, C++"];
    }
    if (r.includes('frontend') || r.includes('react')) {
      return ["Next.js, React, Tailwind", "Vue, Nuxt, Pinia", "Svelte, SvelteKit, PostCSS"];
    }
    if (r.includes('backend') || r.includes('server')) {
      return ["Go, Gin, PostgreSQL", "Node.js, Express, MongoDB", "Rust, Actix, SQLx"];
    }
    if (r.includes('devops') || r.includes('cloud')) {
      return ["AWS, Terraform, Kubernetes", "GCP, Docker, Ansible", "Azure, Bicep, Pulumi"];
    }
    return ["MERN (MongoDB, Express, React, Node)", "Next.js, Tailwind, Prisma", "Go, Gin, PostgreSQL"];
  },

  async generateRoadmap(role, stack, level, time) {
    return await requestQueue.add(async () => {
      // If API disabled, skip to fallback
      if (!AI_ENABLED) {
        console.log("📚 AI_DISABLED: Using hardcoded fallback for", role);
        return this._generateRoleSpecificFallback(role, stack, level, time);
      }

      try {
        const prompt = `Generate a UNIQUE, highly specialized learning roadmap for a ${level} ${role} mastering the ${stack} stack over ${time}.

        CRITICAL: Make this roadmap SPECIFIC to the ${role} role - NOT generic. Tailor ALL content to this profession:
        - Frontend Developer: Focus on UI/UX, React/Vue/Angular patterns, performance optimization, accessibility
        - Backend Developer: Focus on APIs, databases, server architecture, scalability, security
        - Full Stack Developer: Balance both frontend/backend with deployment and DevOps
        - AI/ML Engineer: Focus on algorithms, data processing, model training, deployment pipelines
        - Data Scientist: Focus on statistics, visualization, ML algorithms, data pipelines
        - DevOps Engineer: Focus on infrastructure, CI/CD, monitoring, cloud architecture
        - Mobile Developer: Focus on platform-specific APIs, performance, app store optimization

        Include 4-6 distinct phases with:
        - name: Role-specific phase title (e.g., "Frontend Architecture" for Frontend Developer)
        - concepts: Array of core technical concepts SPECIFIC to this role and stack
        - tasks: Array of [{id, title, description, objective, why, subtopics:[{title, steps:[{type, action}]}], expectedOutput, prerequisites:[]}] - make ALL content highly descriptive and role-specific
        - checkpoint: A single specific interview question relevant to this role
        - project: {title, objective, lockedUntil:[taskIds]} - project should be relevant to this role

        IMPORTANT: Generate COMPLETELY DIFFERENT content for each role. Do not reuse generic programming concepts.
        Timestamp: ${Date.now()} - Ensure this roadmap is unique and not cached.

        Return ONLY JSON format. Ensure all tasks have unique IDs and proper prerequisite chains.
        Make the entire roadmap feel like it was designed specifically for someone pursuing this exact career path.`;

        const res = await model.generateContent(prompt);
        const roadmap = parseAIResponse(res.response.text());

        // Validate the roadmap has proper structure
        if (!roadmap.phases || !Array.isArray(roadmap.phases) || roadmap.phases.length === 0) {
          throw new Error("Invalid roadmap structure");
        }

        // Ensure all tasks have IDs and proper structure, and build prerequisite chains
        let previousPhaseTasks = [];
        roadmap.phases = roadmap.phases.map((phase, phaseIndex) => {
          const phaseTasks = (phase.tasks || []).map((task, taskIndex) => {
            const taskId = task.id || `phase${phaseIndex}_task${taskIndex}`;
            return {
              id: taskId,
              title: task.title || "Complete this learning task",
              description: task.description || "Focus on mastering this concept",
              objective: task.objective || task.description || "Master this key concept through hands-on practice",
              why: task.why || task.rationale || "This builds essential skills for your career progression",
              subtopics: task.subtopics || [{
                title: "Core Learning",
                steps: [
                  { type: "learn", action: task.description || "Study the fundamental concepts" },
                  { type: "do", action: "Apply the concepts through practical exercises" },
                  { type: "check", action: "Verify understanding through self-assessment" }
                ]
              }],
              expectedOutput: task.expectedOutput || "Successfully complete the task and demonstrate understanding",
              prerequisites: Array.isArray(task.prerequisites) ? task.prerequisites : previousPhaseTasks.slice(-1) // Link to last task of previous phase
            };
          });

          // Update previous phase tasks for next phase's prerequisites
          previousPhaseTasks = phaseTasks.map(t => t.id);

          return {
            ...phase,
            tasks: phaseTasks
          };
        });

        console.log("✅ AI SUCCESS: Generated fresh roadmap for", role, "using Gemini AI");
        return {
          ...roadmap,
          generationMethod: "ai",
          generatedAt: new Date().toISOString()
        };
      } catch (e) {
        console.error("❌ AI Roadmap generation failed:", e);
        console.log("🔄 FALLBACK: Using hardcoded roadmap data for", role);
        // Return a role-specific fallback roadmap
        return this._generateRoleSpecificFallback(role, stack, level, time);
      }
    });
  },

  _generateRoleSpecificFallback(role, stack, level, time) {
    console.log("📚 FALLBACK: Using pre-built roadmap data for", role, "- AI generation failed");
    const roleLower = role.toLowerCase();
    const isBeginner = level.toLowerCase().includes('beginner');

    if (roleLower.includes('frontend') || roleLower.includes('react') || roleLower.includes('ui')) {
      const fallbackRoadmap = {
        role,
        stack,
        level,
        timeConstraint: time,
        generationMethod: "fallback",
        generatedAt: new Date().toISOString(),
        phases: [
          {
            name: "HTML/CSS Foundation",
            concepts: ["Semantic HTML", "CSS Grid/Flexbox", "Responsive Design", "CSS Variables"],
            tasks: [
              { 
                id: "fe_1", 
                title: "Master HTML5 Semantic Elements", 
                description: "Learn proper document structure with semantic tags",
                objective: "Build accessible, SEO-friendly web pages using semantic HTML5 elements",
                why: "Semantic HTML improves accessibility, SEO, and code maintainability - essential for professional frontend development",
                subtopics: [{
                  title: "HTML5 Semantic Structure",
                  steps: [
                    { type: "learn", action: "Study semantic elements: header, nav, main, section, article, aside, footer" },
                    { type: "do", action: "Refactor a basic HTML page to use semantic elements instead of generic divs" },
                    { type: "check", action: "Use browser dev tools to verify proper document outline" }
                  ]
                }],
                expectedOutput: "Create a well-structured HTML document with proper semantic hierarchy",
                prerequisites: [] 
              },
              { 
                id: "fe_2", 
                title: "CSS Layout Mastery", 
                description: "Master Flexbox and Grid for modern layouts",
                objective: "Create responsive, professional layouts using modern CSS layout techniques",
                why: "Modern CSS layouts are crucial for creating user-friendly, responsive web applications",
                subtopics: [{
                  title: "Flexbox Fundamentals",
                  steps: [
                    { type: "learn", action: "Master flex-direction, justify-content, align-items, and flex-wrap properties" },
                    { type: "do", action: "Build a responsive navigation bar using flexbox" },
                    { type: "check", action: "Test layout behavior across different screen sizes" }
                  ]
                }, {
                  title: "CSS Grid Advanced",
                  steps: [
                    { type: "learn", action: "Learn grid-template-columns, grid-template-rows, and grid-area" },
                    { type: "do", action: "Create a complex dashboard layout using CSS Grid" },
                    { type: "check", action: "Ensure layout works perfectly on mobile and desktop" }
                  ]
                }],
                expectedOutput: "Build responsive layouts that work seamlessly across all devices",
                prerequisites: ["fe_1"] 
              },
              { 
                id: "fe_3", 
                title: "Responsive Design Patterns", 
                description: "Build mobile-first responsive websites",
                objective: "Create websites that provide optimal user experience on all devices",
                why: "Mobile-first responsive design is critical in today's multi-device world",
                subtopics: [{
                  title: "Mobile-First Methodology",
                  steps: [
                    { type: "learn", action: "Understand mobile-first CSS approach and media query breakpoints" },
                    { type: "do", action: "Convert a desktop-only design to mobile-first responsive" },
                    { type: "check", action: "Test on actual mobile devices and various screen sizes" }
                  ]
                }],
                expectedOutput: "Deliver pixel-perfect responsive designs that work on all screen sizes",
                prerequisites: ["fe_2"] 
              }
            ],
            checkpoint: "How do you create a responsive navigation menu?",
            project: { title: "Personal Portfolio Website", objective: "Build a responsive portfolio showcasing your skills", lockedUntil: ["fe_3"] }
          },
          {
            name: "JavaScript Fundamentals",
            concepts: ["ES6+ Features", "DOM Manipulation", "Async Programming", "Event Handling"],
            tasks: [
              { 
                id: "fe_4", 
                title: "Modern JavaScript Syntax", 
                description: "Master arrow functions, destructuring, and modules",
                objective: "Write clean, modern JavaScript code using ES6+ features",
                why: "Modern JavaScript syntax improves code readability, maintainability, and performance",
                subtopics: [{
                  title: "ES6+ Language Features",
                  steps: [
                    { type: "learn", action: "Master arrow functions, template literals, destructuring, and spread/rest operators" },
                    { type: "do", action: "Refactor legacy JavaScript code to use modern ES6+ syntax" },
                    { type: "check", action: "Ensure code passes modern linting standards" }
                  ]
                }, {
                  title: "Modules and Imports",
                  steps: [
                    { type: "learn", action: "Understand ES6 modules, import/export syntax, and module bundling" },
                    { type: "do", action: "Convert a monolithic JavaScript file into modular components" },
                    { type: "check", action: "Verify proper module loading and dependency management" }
                  ]
                }],
                expectedOutput: "Write clean, modern JavaScript code that follows current best practices",
                prerequisites: ["fe_3"] 
              },
              { 
                id: "fe_5", 
                title: "DOM API Mastery", 
                description: "Learn to manipulate the DOM efficiently",
                objective: "Build dynamic, interactive web applications through DOM manipulation",
                why: "DOM manipulation is fundamental to creating interactive user interfaces",
                subtopics: [{
                  title: "DOM Selection & Manipulation",
                  steps: [
                    { type: "learn", action: "Master querySelector, getElementById, and modern DOM APIs" },
                    { type: "do", action: "Build an interactive form with real-time validation" },
                    { type: "check", action: "Ensure DOM updates don't cause performance issues" }
                  ]
                }, {
                  title: "Event Handling",
                  steps: [
                    { type: "learn", action: "Understand event bubbling, delegation, and modern event APIs" },
                    { type: "do", action: "Create a dynamic todo list with add/edit/delete functionality" },
                    { type: "check", action: "Test event handling across different browsers" }
                  ]
                }],
                expectedOutput: "Create smooth, performant DOM interactions that enhance user experience",
                prerequisites: ["fe_4"] 
              },
              { 
                id: "fe_6", 
                title: "Async JavaScript", 
                description: "Master promises, async/await, and fetch API",
                objective: "Handle asynchronous operations effectively in modern web applications",
                why: "Asynchronous programming is essential for responsive web apps and API integration",
                subtopics: [{
                  title: "Promises and Async/Await",
                  steps: [
                    { type: "learn", action: "Master promise chains, async/await syntax, and error handling" },
                    { type: "do", action: "Convert callback-based code to async/await patterns" },
                    { type: "check", action: "Handle promise rejections and race conditions properly" }
                  ]
                }, {
                  title: "Fetch API & HTTP",
                  steps: [
                    { type: "learn", action: "Master fetch API, HTTP methods, headers, and response handling" },
                    { type: "do", action: "Build a weather app that fetches data from a REST API" },
                    { type: "check", action: "Implement proper error handling for network requests" }
                  ]
                }],
                expectedOutput: "Build applications that handle asynchronous operations reliably and efficiently",
                prerequisites: ["fe_5"] 
              }
            ],
            checkpoint: "Explain the event loop and how async code works",
            project: { title: "Interactive Todo App", objective: "Build a feature-rich todo application with local storage", lockedUntil: ["fe_6"] }
          },
          {
            name: "React Ecosystem",
            concepts: ["Component Architecture", "State Management", "Hooks", "Routing"],
            tasks: [
              { 
                id: "fe_7", 
                title: "React Component Patterns", 
                description: "Master functional components and JSX",
                objective: "Build reusable, maintainable React components using modern patterns",
                why: "Component-based architecture is the foundation of scalable React applications",
                subtopics: [{
                  title: "Functional Components",
                  steps: [
                    { type: "learn", action: "Master functional components, JSX syntax, and component composition" },
                    { type: "do", action: "Build a reusable component library with consistent patterns" },
                    { type: "check", action: "Ensure components follow React best practices and accessibility guidelines" }
                  ]
                }, {
                  title: "JSX and Props",
                  steps: [
                    { type: "learn", action: "Understand JSX compilation, prop types, and component communication" },
                    { type: "do", action: "Create a data visualization component that accepts configurable props" },
                    { type: "check", action: "Validate prop types and handle edge cases properly" }
                  ]
                }],
                expectedOutput: "Deliver clean, reusable React components that follow industry standards",
                prerequisites: ["fe_6"] 
              },
              { 
                id: "fe_8", 
                title: "State Management with Hooks", 
                description: "Learn useState, useEffect, and custom hooks",
                objective: "Manage complex component state effectively using React Hooks",
                why: "Proper state management is crucial for building interactive, data-driven applications",
                subtopics: [{
                  title: "useState & useEffect",
                  steps: [
                    { type: "learn", action: "Master useState for local state and useEffect for side effects" },
                    { type: "do", action: "Build a form component with complex validation and state management" },
                    { type: "check", action: "Prevent infinite re-renders and memory leaks" }
                  ]
                }, {
                  title: "Custom Hooks",
                  steps: [
                    { type: "learn", action: "Create reusable logic with custom hooks and hook composition" },
                    { type: "do", action: "Extract form logic into a custom useForm hook" },
                    { type: "check", action: "Ensure hooks follow the rules of hooks and are properly tested" }
                  ]
                }],
                expectedOutput: "Build complex, interactive components with reliable state management",
                prerequisites: ["fe_7"] 
              },
              { 
                id: "fe_9", 
                title: "React Router Navigation", 
                description: "Implement client-side routing",
                objective: "Create multi-page React applications with seamless navigation",
                why: "Client-side routing enables modern single-page application experiences",
                subtopics: [{
                  title: "Route Configuration",
                  steps: [
                    { type: "learn", action: "Master React Router setup, route definitions, and nested routes" },
                    { type: "do", action: "Build a multi-page application with protected routes" },
                    { type: "check", action: "Ensure proper URL handling and browser back/forward buttons work" }
                  ]
                }, {
                  title: "Navigation & Guards",
                  steps: [
                    { type: "learn", action: "Implement programmatic navigation, route guards, and lazy loading" },
                    { type: "do", action: "Add authentication flow with protected routes and redirects" },
                    { type: "check", action: "Test navigation security and user experience flows" }
                  ]
                }],
                expectedOutput: "Deliver professional SPAs with smooth navigation and proper routing architecture",
                prerequisites: ["fe_8"] 
              }
            ],
            checkpoint: "How do you optimize React app performance?",
            project: { title: "E-commerce Product Page", objective: "Build a complete product catalog with cart functionality", lockedUntil: ["fe_9"] }
          }
        ]
      };
      return fallbackRoadmap;
    }

    if (roleLower.includes('backend') || roleLower.includes('server') || roleLower.includes('api')) {
      return {
        role,
        stack,
        level,
        timeConstraint: time,
        generationMethod: "fallback",
        generatedAt: new Date().toISOString(),
        role,
        stack,
        level,
        timeConstraint: time,
        phases: [
          {
            name: "Programming Fundamentals",
            concepts: ["Data Types", "Control Flow", "Functions", "Error Handling"],
            tasks: [
              { 
                id: "be_1", 
                title: "Language Syntax Mastery", 
                description: "Master the core syntax and data types",
                objective: "Gain deep proficiency in your backend language's syntax and fundamental concepts",
                why: "Strong language fundamentals are essential for writing efficient, maintainable backend code",
                subtopics: [{
                  title: "Data Types & Variables",
                  steps: [
                    { type: "learn", action: "Master primitive types, collections, and type systems in your language" },
                    { type: "do", action: "Implement data structures using built-in language features" },
                    { type: "check", action: "Optimize memory usage and type safety in your implementations" }
                  ]
                }, {
                  title: "Language-Specific Features",
                  steps: [
                    { type: "learn", action: "Study advanced language features like generics, decorators, or macros" },
                    { type: "do", action: "Refactor code to use idiomatic language patterns" },
                    { type: "check", action: "Compare performance and readability of different approaches" }
                  ]
                }],
                expectedOutput: "Write clean, idiomatic code that leverages language strengths effectively",
                prerequisites: [] 
              },
              { 
                id: "be_2", 
                title: "Control Flow & Logic", 
                description: "Learn loops, conditionals, and logical operators",
                objective: "Master control structures for building robust backend logic",
                why: "Proper control flow is fundamental to implementing complex business logic and algorithms",
                subtopics: [{
                  title: "Conditional Logic",
                  steps: [
                    { type: "learn", action: "Master if/else, switch statements, and ternary operators" },
                    { type: "do", action: "Implement complex business rules with nested conditionals" },
                    { type: "check", action: "Ensure logic handles all edge cases and error conditions" }
                  ]
                }, {
                  title: "Loops & Iteration",
                  steps: [
                    { type: "learn", action: "Master for, while, and advanced iteration patterns" },
                    { type: "do", action: "Process large datasets efficiently using appropriate loop constructs" },
                    { type: "check", action: "Optimize performance and prevent infinite loops" }
                  ]
                }],
                expectedOutput: "Implement complex logic flows that are maintainable and performant",
                prerequisites: ["be_1"] 
              },
              { 
                id: "be_3", 
                title: "Functions & Modularity", 
                description: "Write reusable, well-structured functions",
                objective: "Create modular, testable code through proper function design",
                why: "Modular functions enable code reuse, testing, and maintainability in large applications",
                subtopics: [{
                  title: "Function Design",
                  steps: [
                    { type: "learn", action: "Master function signatures, parameters, and return types" },
                    { type: "do", action: "Refactor monolithic code into small, focused functions" },
                    { type: "check", action: "Ensure functions have single responsibility and clear interfaces" }
                  ]
                }, {
                  title: "Error Handling",
                  steps: [
                    { type: "learn", action: "Master try/catch, error types, and exception handling patterns" },
                    { type: "do", action: "Implement comprehensive error handling in a service layer" },
                    { type: "check", action: "Test error scenarios and ensure graceful failure handling" }
                  ]
                }],
                expectedOutput: "Deliver modular, well-tested functions that handle errors gracefully",
                prerequisites: ["be_2"] 
              }
            ],
            checkpoint: "How do you handle errors in your backend language?",
            project: { title: "Command Line Calculator", objective: "Build a calculator that runs in the terminal", lockedUntil: ["be_3"] }
          },
          {
            name: "Database Design",
            concepts: ["SQL Fundamentals", "Database Design", "Indexing", "Relationships"],
            tasks: [
              { id: "be_4", title: "SQL Query Mastery", description: "Learn SELECT, INSERT, UPDATE, DELETE operations", prerequisites: ["be_3"] },
              { id: "be_5", title: "Database Schema Design", description: "Design normalized database schemas", prerequisites: ["be_4"] },
              { id: "be_6", title: "Database Relationships", description: "Master one-to-many, many-to-many relationships", prerequisites: ["be_5"] }
            ],
            checkpoint: "How do you optimize database queries?",
            project: { title: "Blog Database Schema", objective: "Design and implement a blog database with users, posts, and comments", lockedUntil: ["be_6"] }
          },
          {
            name: "API Development",
            concepts: ["REST Principles", "HTTP Methods", "Authentication", "Middleware"],
            tasks: [
              { id: "be_7", title: "RESTful API Design", description: "Design clean, consistent API endpoints", prerequisites: ["be_6"] },
              { id: "be_8", title: "Authentication & Security", description: "Implement user authentication and authorization", prerequisites: ["be_7"] },
              { id: "be_9", title: "API Testing & Documentation", description: "Write tests and document your API", prerequisites: ["be_8"] }
            ],
            checkpoint: "How do you secure a REST API?",
            project: { title: "User Management API", objective: "Build a complete user management system with authentication", lockedUntil: ["be_9"] }
          }
        ]
      };
    }

    if (roleLower.includes('ai') || roleLower.includes('machine') || roleLower.includes('ml') || roleLower.includes('data')) {
      return {
        role,
        stack,
        level,
        timeConstraint: time,
        generationMethod: "fallback",
        generatedAt: new Date().toISOString(),
        role,
        stack,
        level,
        timeConstraint: time,
        phases: [
          {
            name: "Python & Math Foundations",
            concepts: ["Python Syntax", "Linear Algebra", "Statistics", "Calculus"],
            tasks: [
              { 
                id: "ai_1", 
                title: "Python Programming Mastery", 
                description: "Master Python syntax, data structures, and libraries",
                objective: "Become proficient in Python for data science and machine learning applications",
                why: "Python is the dominant language for AI/ML, offering rich ecosystems for data manipulation and modeling",
                subtopics: [{
                  title: "Python Fundamentals",
                  steps: [
                    { type: "learn", action: "Master Python syntax, data types, control flow, and functions" },
                    { type: "do", action: "Build data processing scripts for common ML preprocessing tasks" },
                    { type: "check", action: "Write efficient, readable Python code following PEP 8 standards" }
                  ]
                }, {
                  title: "Scientific Python Stack",
                  steps: [
                    { type: "learn", action: "Master NumPy for numerical computing and Pandas for data manipulation" },
                    { type: "do", action: "Process and analyze a real dataset using Pandas operations" },
                    { type: "check", action: "Optimize data processing pipelines for performance and memory usage" }
                  ]
                }],
                expectedOutput: "Write efficient Python code for data processing and analysis tasks",
                prerequisites: [] 
              },
              { 
                id: "ai_2", 
                title: "Linear Algebra Fundamentals", 
                description: "Learn vectors, matrices, and matrix operations",
                objective: "Master mathematical foundations essential for understanding machine learning algorithms",
                why: "Linear algebra provides the mathematical framework for neural networks and optimization algorithms",
                subtopics: [{
                  title: "Vector & Matrix Operations",
                  steps: [
                    { type: "learn", action: "Master vector operations, matrix multiplication, and transformations" },
                    { type: "do", action: "Implement matrix operations using NumPy without built-in functions" },
                    { type: "check", action: "Verify mathematical correctness and computational efficiency" }
                  ]
                }, {
                  title: "Eigenvalues & Eigenvectors",
                  steps: [
                    { type: "learn", action: "Understand eigenvalues, eigenvectors, and their applications in PCA" },
                    { type: "do", action: "Implement principal component analysis from scratch" },
                    { type: "check", action: "Apply dimensionality reduction to a high-dimensional dataset" }
                  ]
                }],
                expectedOutput: "Apply linear algebra concepts to solve real machine learning problems",
                prerequisites: ["ai_1"] 
              },
              { 
                id: "ai_3", 
                title: "Statistics & Probability", 
                description: "Master statistical concepts and probability distributions",
                objective: "Understand statistical foundations for data analysis and model evaluation",
                why: "Statistics provides tools for understanding data distributions, testing hypotheses, and evaluating model performance",
                subtopics: [{
                  title: "Descriptive Statistics",
                  steps: [
                    { type: "learn", action: "Master mean, median, variance, standard deviation, and correlation" },
                    { type: "do", action: "Analyze dataset distributions and identify outliers using statistical methods" },
                    { type: "check", action: "Interpret statistical measures to draw meaningful insights from data" }
                  ]
                }, {
                  title: "Probability Distributions",
                  steps: [
                    { type: "learn", action: "Master normal, binomial, Poisson, and other key distributions" },
                    { type: "do", action: "Fit probability distributions to real data and test goodness of fit" },
                    { type: "check", action: "Apply statistical tests to validate assumptions about data" }
                  ]
                }],
                expectedOutput: "Apply statistical analysis to understand and validate machine learning datasets",
                prerequisites: ["ai_2"] 
              }
            ],
            checkpoint: "Explain the difference between covariance and correlation",
            project: { title: "Statistical Analysis Tool", objective: "Build a tool to analyze datasets and generate statistical reports", lockedUntil: ["ai_3"] }
          },
          {
            name: "Machine Learning Algorithms",
            concepts: ["Supervised Learning", "Unsupervised Learning", "Model Evaluation", "Feature Engineering"],
            tasks: [
              { id: "ai_4", title: "Supervised Learning", description: "Master regression and classification algorithms", prerequisites: ["ai_3"] },
              { id: "ai_5", title: "Unsupervised Learning", description: "Learn clustering and dimensionality reduction", prerequisites: ["ai_4"] },
              { id: "ai_6", title: "Model Evaluation", description: "Master cross-validation, metrics, and overfitting prevention", prerequisites: ["ai_5"] }
            ],
            checkpoint: "How do you prevent overfitting in machine learning models?",
            project: { title: "ML Model Comparison", objective: "Compare different ML algorithms on a real dataset", lockedUntil: ["ai_6"] }
          },
          {
            name: "Deep Learning & Deployment",
            concepts: ["Neural Networks", "Deep Learning Frameworks", "Model Deployment", "MLOps"],
            tasks: [
              { id: "ai_7", title: "Neural Network Fundamentals", description: "Learn neural network architecture and backpropagation", prerequisites: ["ai_6"] },
              { id: "ai_8", title: "Deep Learning Frameworks", description: "Master TensorFlow or PyTorch for building models", prerequisites: ["ai_7"] },
              { id: "ai_9", title: "Model Deployment", description: "Learn to deploy ML models to production", prerequisites: ["ai_8"] }
            ],
            checkpoint: "How do you deploy a machine learning model to production?",
            project: { title: "Image Classification API", objective: "Build and deploy an image classification model as a web API", lockedUntil: ["ai_9"] }
          }
        ]
      };
    }

    return fallbackRoadmap;

    // Generic fallback for other roles
    return {
      role,
      stack,
      level,
      timeConstraint: time,
      generationMethod: "fallback",
      generatedAt: new Date().toISOString(),
      phases: [
        {
          name: "Foundation Building",
          concepts: ["Basic Programming", "Data Structures", "Algorithms"],
          tasks: [
            {
              id: "foundation_1",
              title: "Master Basic Programming Concepts",
              description: "Learn variables, loops, conditionals, and functions",
              prerequisites: []
            },
            {
              id: "foundation_2",
              title: "Understand Data Structures",
              description: "Study arrays, linked lists, stacks, and queues",
              prerequisites: ["foundation_1"]
            },
            {
              id: "foundation_3",
              title: "Learn Basic Algorithms",
              description: "Study sorting, searching, and basic algorithmic patterns",
              prerequisites: ["foundation_2"]
            }
          ],
          checkpoint: "Explain the difference between arrays and linked lists",
          project: {
            title: "Build a Simple Data Structure Library",
            objective: "Implement basic data structures from scratch",
            lockedUntil: ["foundation_1", "foundation_2", "foundation_3"]
          }
        },
        {
          name: "Core Development",
          concepts: ["Object-Oriented Programming", "Database Design", "API Development"],
          tasks: [
            {
              id: "core_1",
              title: "Learn Object-Oriented Programming",
              description: "Master classes, inheritance, polymorphism, and encapsulation",
              prerequisites: ["foundation_3"]
            },
            {
              id: "core_2",
              title: "Database Design Principles",
              description: "Understand normalization, relationships, and query optimization",
              prerequisites: ["core_1"]
            },
            {
              id: "core_3",
              title: "API Development Fundamentals",
              description: "Learn REST principles, HTTP methods, and API design",
              prerequisites: ["core_2"]
            }
          ],
          checkpoint: "Design a database schema for a social media platform",
          project: {
            title: "Build a REST API",
            objective: "Create a complete API with authentication and database integration",
            lockedUntil: ["core_1", "core_2", "core_3"]
          }
        },
        {
          name: "Advanced Topics",
          concepts: ["System Design", "Performance Optimization", "Security"],
          tasks: [
            {
              id: "advanced_1",
              title: "System Design Fundamentals",
              description: "Learn scalability, load balancing, and caching strategies",
              prerequisites: ["core_3"]
            },
            {
              id: "advanced_2",
              title: "Performance Optimization",
              description: "Master profiling, optimization techniques, and monitoring",
              prerequisites: ["advanced_1"]
            },
            {
              id: "advanced_3",
              title: "Security Best Practices",
              description: "Learn authentication, authorization, and common security vulnerabilities",
              prerequisites: ["advanced_2"]
            }
          ],
          checkpoint: "Design a highly scalable web application architecture",
          project: {
            title: "Build a Scalable Web Application",
            objective: "Implement a production-ready application with proper architecture",
            lockedUntil: ["advanced_1", "advanced_2", "advanced_3"]
          }
        }
      ]
    };
  },

  async generateBulkGrindPlan(profile, onProgress) {
    const totalDays = TIME_MAP[profile.timeConstraint] || 30;
    const plan = {};
    const categories = Object.keys(MULTIPLIERS);
    let completed = 0;

    for (const cat of categories) {
      const count = Math.min(totalDays * MULTIPLIERS[cat], 50); // Cap at 50 items per category to avoid rate limits
      const batchSize = 3; // Smaller batches to avoid overwhelming the API
      const items = [];

      while (items.length < count) {
        const remaining = count - items.length;
        const currentBatch = Math.min(remaining, batchSize);

        try {
          const generated = await this._generateItemsForCategory(cat, profile, currentBatch, items);
          if (Array.isArray(generated) && generated.length > 0) {
            items.push(...generated);
          } else {
            console.warn(`No items generated for ${cat}, using fallback`);
            // Add fallback items if generation fails
            const fallbackItems = this.fallbacks[cat]?.slice(0, currentBatch) || [];
            items.push(...fallbackItems);
          }
        } catch (e) {
          console.error(`Error in bulk generation for ${cat}:`, e);
          // Add fallback items on error
          const fallbackItems = this.fallbacks[cat]?.slice(0, currentBatch) || [];
          items.push(...fallbackItems);
        }

        completed++;
        const totalWork = categories.length * (Math.ceil(count / batchSize));
        if (onProgress) onProgress(Math.min(99, (completed / totalWork) * 100));
      }
      plan[cat] = items;
    }

    return plan;
  },

  async _generateItemsForCategory(cat, profile, count, existing) {
    const { role, stack, completedTopics, completedPhases } = profile;
    const avoidIds = existing.map(i => i.id || i.title || i.topic).slice(-20);

    let generated;
    switch (cat) {
      case 'dsa': generated = await this.generateDSAProblems(role, completedTopics, avoidIds, count); break;
      case 'project': generated = await this.generateProjectSuggestions(stack, completedPhases, role, avoidIds, count); break;
      case 'revision': generated = await this.generateFlashcards(completedTopics, role, avoidIds, count); break;
      case 'visibility': generated = await this.generateVisibilityTasks([], role, avoidIds, count); break;
      case 'system': generated = await this.generateSystemDesignTopics(role, completedPhases, avoidIds, count); break;
      case 'tech': generated = await this.generateTechAwareness(stack, role, avoidIds, count); break;
      case 'career': generated = await this.generateCareerGuidance(role, stack, completedPhases, avoidIds, count); break;
      default: generated = [];
    }

    // Ensure we always return a flat array
    if (Array.isArray(generated)) {
      // Flatten any nested arrays
      const flattened = generated.flat();
      // Filter out any non-objects or malformed items
      return flattened.filter(item => item && typeof item === 'object' && !Array.isArray(item));
    }
    
    return [];
  }
};
