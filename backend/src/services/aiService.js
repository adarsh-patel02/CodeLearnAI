const { GoogleGenAI } = require("@google/genai");
const { performance } = require("node:perf_hooks");

const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const MODEL = "gemini-3.8-flash";

const buildSystemInstruction = ({ taskTitle = "", taskDescription = "", code = "" }) => `
You are CodeLearn AI, an AI programming learning assistant.

Help learners understand programming concepts, debug code, and solve programming problems.

Rules:
1. Prefer hints when guidance is requested.
2. Provide complete executable code when explicitly requested.
3. Explain errors and their causes.
4. Explain concepts in simple language.
5. Keep responses educational and relevant.

Current task:
${taskTitle}

Task description:
${taskDescription}

Learner's current code:
${code}
`;

const generateAIResponse = async (message, context = {}) => {
    const startTime = performance.now();

    if (!apiKey || !ai) {
        throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env and restart the backend.");
    }

    if (!String(message || "").trim()) {
        throw new Error("AI message is empty.");
    }

    try {
        console.log(`[AI] Generating response with ${MODEL}...`);

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: String(message),
            config: {
                systemInstruction: buildSystemInstruction(context)
            }
        });

        const text = String(response.text || "").trim();

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        console.log(
            `[AI] Success in ${((performance.now() - startTime) / 1000).toFixed(2)}s`
        );

        return text;
    } catch (error) {
        console.error(
            `[AI] Generation failed after ${((performance.now() - startTime) / 1000).toFixed(2)}s:`,
            error?.message || error
        );
        throw error;
    }
};

const generateProgrammingTasks = async ({
    topic,
    difficulty,
    language,
    count
}) => {
    if (!apiKey || !ai) {
        throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env and restart the backend.");
    }

    const prompt = `
Generate exactly ${count} original programming tasks.

Task requirements:
- Topic: ${topic}
- Difficulty: ${difficulty}
- Language: ${language}

Return only a valid JSON array. Each task MUST use these exact fields:
{
  "title": "Task title",
  "description": "Complete problem statement",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "topic": "${topic}",
  "starterCode": "Starter code for the learner",
  "exampleInput": "Example input",
  "exampleOutput": "Expected output",
  "testCases": [
    { "input": "Test input", "expectedOutput": "Expected output" }
  ]
}

Rules:
1. Generate exactly ${count} different tasks.
2. Include at least 3 test cases per task.
3. Include normal and edge cases.
4. Ensure expected outputs are correct.
5. Starter code must match the selected language.
6. Do not include complete solutions in starterCode.
7. Do not include Markdown fences or text outside the JSON array.
`;

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    const tasks = JSON.parse(String(response.text || ""));

    if (!Array.isArray(tasks) || tasks.length !== Number(count)) {
        throw new Error("Gemini returned an invalid number of tasks.");
    }

    const requiredFields = [
        "title",
        "description",
        "difficulty",
        "language",
        "topic",
        "starterCode",
        "exampleInput",
        "exampleOutput",
        "testCases"
    ];

    for (const task of tasks) {
        for (const field of requiredFields) {
            if (!(field in task)) {
                throw new Error(`Generated task is missing field: ${field}`);
            }
        }

        if (
            !Array.isArray(task.testCases) ||
            task.testCases.length < 3 ||
            !task.testCases.every(
                testCase =>
                    typeof testCase.input === "string" &&
                    typeof testCase.expectedOutput === "string"
            )
        ) {
            throw new Error("Generated task has invalid test cases.");
        }

        task.difficulty = difficulty;
        task.language = language.toLowerCase();
        task.topic = topic.trim();
    }

    return tasks;
};

module.exports = {
    generateAIResponse,
    generateProgrammingTasks
};