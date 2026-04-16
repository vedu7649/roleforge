import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
      [
        { id: 1, title: "Two Sum", platform: "leetcode", difficulty: "easy", link: "https://leetcode.com/problems/two-sum/" },
        { id: 2, title: "Valid Palindrome", platform: "leetcode", difficulty: "easy", link: "https://leetcode.com/problems/valid-palindrome/" }
      ],
      [
        { id: 1, title: "Longest Substring Without Repeating Characters", platform: "leetcode", difficulty: "medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
        { id: 2, title: "Container With Most Water", platform: "leetcode", difficulty: "medium", link: "https://leetcode.com/problems/container-with-most-water/" }
      ]
    ],
    project: [
      { type: "advanced", title: "Real-time Collaboration Engine", description: "Build a distributed whiteboard with CRDT synchronization.", expectedOutcome: "Master conflict-free data types and WebSockets" },
      { type: "intermediate", title: "Custom Metric Aggregator", description: "Design a system to collect and visualize high-resolution server metrics.", expectedOutcome: "Understand timeseries data storage and visualization." }
    ],
    visibility: [
      [
        { id: 1, title: "Open Source Contribution", problemStatement: "Find a 'good first issue' in a major React library.", solution: "Submitted a PR for documentation clarity.", difficulty: "medium" },
        { id: 2, title: "Tech Blog Post", problemStatement: "Explain 'Hydration' in modern frameworks.", solution: "Published a 500-word deep dive on Dev.to.", difficulty: "easy" }
      ],
      [
        { id: 1, title: "Build a CLI Tool", problemStatement: "Automate a tedious part of your daily workflow.", solution: "Released a Node.js CLI tool for project scaffolding.", difficulty: "medium" },
        { id: 2, title: "Interactive Tutorial", problemStatement: "Create a guide for an advanced CSS concept.", solution: "Built a CodePen collection demonstrating Grid wizardry.", difficulty: "medium" }
      ]
    ],
    tech: [
       [{ week: "Micro-Frontend Architecture", items: [{ name: "Module Federation", type: "tool", description: "Sharing code between isolated builds." }] }],
       [{ week: "Serverless State Management", items: [{ name: "Durable Objects", type: "tool", description: "Strongly consistent state at the edge." }] }]
    ],
    career: [
      { role: "Senior Engineer", description: "Focus on cross-team leadership and system reliability.", skills: ["System Design", "Mentorship", "Budgeting"], workflow: ["Design review", "1-on-1s"] },
      { role: "Staff Architect", description: "Strategic tech decisions and long-term roadmap planning.", skills: ["Domain Driven Design", "Executive Presence"], workflow: ["Architecture council", "RFC review"] }
    ],
    flashcards: [
      [{ id: 1, question: "What is Event Sourcing?", answer: "Storing state changes as a sequence of events.", importance: "high" }],
      [{ id: 1, question: "Define Sharding?", answer: "Partitioning data across multiple database instances.", importance: "high" }]
    ],
    system: [
      { topic: "Global Load Balancing", flowSteps: ["User request", "DNS resolution", "Anycast routing", "PoP selection"], explanation: "Redirecting traffic to the nearest edge location." },
      { topic: "Database Replication Pools", flowSteps: ["Master write", "Binlog update", "Slave pull", "Async commit"], explanation: "Using secondary nodes for read-only scaling." }
    ]
  },

  async generateVisibilityTasks(completedDocs = [], role = "Developer", avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.visibility);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Role: ${role}. Done: ${completedDocs.join(",")}. Unique Scenario: ${scenario}. 
          Generate 4 UNIQUE visibility/portfolio tasks. JSON array [{id, title, problemStatement, solution, difficulty}]. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.visibility); }
      });
    });
  },

  async generateDSAProblems(role = "Developer", completedTopics = [], avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.dsa);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Role: ${role}. Topics: ${completedTopics.join(",")}. Unique Context: ${scenario}.
          Generate 2 UNIQUE DSA problems. JSON array [{id, title, platform, difficulty, link}]. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.dsa); }
      });
    });
  },

  async generateProjectSuggestions(stack = "", completedPhases = 0, role = "Developer", avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.project);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Role: ${role}. Stack: ${stack}. Context: ${scenario}.
          Generate 1 UNIQUE project idea. JSON {type, title, description, expectedOutcome}. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.project); }
      });
    });
  },

  async generateFlashcards(completedTopics = [], role = "Developer", avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.flashcards);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Role: ${role}. Questions for context: ${scenario}.
          Generate 3 UNIQUE flashcards. JSON array [{id, question, answer, importance}]. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.flashcards); }
      });
    });
  },

  async generateSystemDesignTopics(role = "Developer", completedPhases = 0, avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.system);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Role: ${role}. System Constraints: ${scenario}.
          Generate 1 UNIQUE system design topic. JSON {topic, flowSteps, explanation}. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.system); }
      });
    });
  },

  async generateTechAwareness(stack = "", role = "Developer", avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.tech);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Role: ${role}. Tech Trends for ${scenario}.
          Generate 2 UNIQUE trends. JSON array [{week, items:[{name, type, description}]}]. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.tech); }
      });
    });
  },

  async generateCareerGuidance(role = "Developer", stack = "", completedPhases = 0, avoidList = []) {
    return await requestQueue.add(async () => {
      return await retryWithBackoff(async () => {
        try {
          if (!API_KEY) return getRandom(this.fallbacks.career);
          const entropy = `${Date.now()}-${Math.random()}`;
          const scenario = getRandom(SCENARIOS);
          const prompt = `Career Advice for ${role} in ${scenario}.
          Generate 1 UNIQUE advice block. JSON {role, description, skills, workflow}. 
          STRICTLY AVOID: ${avoidList.join(",")}. Session: ${entropy}`;
          const res = await model.generateContent({ contents: [{role: "user", parts: [{text: prompt}]}], generationConfig: {temperature: 1.0} });
          return parseAIResponse(res.response.text());
        } catch (e) { return getRandom(this.fallbacks.career); }
      });
    });
  },

  async getStackSuggestions(role) {
    try {
      const res = await model.generateContent(`Suggest 3 tech stacks for ${role}. JSON array of strings.`);
      return parseAIResponse(res.response.text());
    } catch (e) { return ["MERN", "PERN", "JAMStack"]; }
  },
  async generateRoadmap(role, stack, level, time) {
    try {
      const res = await model.generateContent(`Generate roadmap for ${role} using ${stack}. JSON format.`);
      return parseAIResponse(res.response.text());
    } catch (e) { return { phases: [] }; }
  }
};
