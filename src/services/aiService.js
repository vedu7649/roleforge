import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export const aiService = {
  async getStackSuggestions(role) {
    try {
      if (!API_KEY) {
        console.warn("No Gemini API key found, returning fallbacks.");
        return ["React.js / Node.js", "Vue.js / Python", "SvelteKit / Go"];
      }

      const prompt = `You are a stack intelligence AI. The user wants to learn to be a ${role}. 
      Suggest 3 valid technology stacks. 
      Return the output STRICTLY as a JSON array of strings. Example: ["React/Node", "Vue/Python", "Angular/Java"]. Do NOT include markdown backticks.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (e) {
      console.error("AI Error (Stack Suggestions): ", e);
      return ["MERN Stack", "PERN Stack", "JAMStack"];
    }
  },

  async generateRoadmap(role, stack, level, timeConstraint) {
    try {
      if (!API_KEY) throw new Error("No Gemini API Key");

      const prompt = `You are a System Architect AI. Generate a "Guided Learning Execution Engine" roadmap for a ${level} level acting as a ${role} using the ${stack} stack. 
      The timeline is ${timeConstraint}. 

      CRITICAL: You must generate a self-correcting blueprint. 
      Every Phase must follow this sequence:
      1. Concepts (Overview)
      2. Comprehensive Tasks (Detailed Guidance)
      3. Checkpoint (Assessment Trigger)
      4. Capstone Project (Mastery Validation)

      Output strictly as JSON (NO markdown/backticks) into this structure:
      {
        "phases": [
          {
            "name": "Phase name",
            "concepts": ["Concept 1", "Concept 2"],
            "tasks": [
              {
                "id": "unique_id",
                "title": "Task title",
                "objective": "Deep objective of the task",
                "why": "Business/System logic for learning this",
                "expectedOutput": "Specific result of completion",
                "estimatedTime": "e.g. 3-5 hours",
                "difficulty": {
                  "level": "easy | medium | hard",
                  "reason": "Why is it this level"
                },
                "prerequisites": ["Task IDs or Concept names"],
                "subtopics": [
                  {
                    "title": "Subtopic title",
                    "steps": [
                      { "type": "learn", "action": "Step instruction" },
                      { "type": "do", "action": "Practice instruction" },
                      { "type": "check", "action": "Validation instruction" }
                    ]
                  }
                ],
                "evaluationCriteria": ["Point 1", "Point 2"]
              }
            ],
            "checkpoint": "Title of the milestone assessment",
            "project": {
              "title": "Phase project title",
              "objective": "Project goal",
              "lockedUntil": ["Required task IDs"]
            }
          }
        ]
      }
      
      Requirements:
      - Minimum 4 Phases.
      - Every task must have at least 2 subtopics with 3-4 micro-steps each.
      - Ensure 'prerequisites' and 'lockedUntil' create a logical mastery gate.
      - Adapt depth to the ${timeConstraint} constraint.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (e) {
      console.error("AI Error (Roadmap): ", e);
      return { phases: [] };
    }
  },

  async generateInterviewQuestion(milestone) {
    try {
      if (!API_KEY) {
        return {
          question: `Explain how you would handle state management in a basic ${milestone} app?`,
          expectedAnswer: "I would use Context API or Redux depending on component depth...",
          difficulty: "medium"
        };
      }

      const prompt = `You are an Interviewer AI. The developer has just completed the milestone: "${milestone}".
      Generate a conceptual question, scenario problem, or debugging challenge to validate their progress.
      
      Output exactly this JSON format:
      {
        "question": "The question here",
        "expectedAnswer": "The ideal answer points",
        "difficulty": "medium or hard or easy"
      }
      Do NOT include markdown backticks.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (e) {
      console.error("AI Error (Interview Question): ", e);
      return { question: "Error generating question.", expectedAnswer: "", difficulty: "easy" };
    }
  },

  async evaluateAnswer(question, expectedAnswer, userAnswer) {
     try {
       if (!API_KEY) {
         return { result: "fail", weakAreas: ["API integration missing"] };
       }
       
       const prompt = `You are the Validation Layer.
       Question: ${question}
       Expected Answer: ${expectedAnswer}
       User Answer: ${userAnswer}

       Evaluate if the user passed. Identify specific weak areas (at most 2-3).
       Output strictly as JSON:
       {
         "result": "pass" | "fail",
         "weakAreas": ["area 1", "area 2"]
       }
       Do NOT include markdown backticks.`;

       const result = await model.generateContent(prompt);
       const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
       return JSON.parse(text);
     } catch (e) {
       console.error("AI Error (Evaluate Answer): ", e);
       return { result: "fail", weakAreas: ["error evaluating answer"] };
     }
  }
};
