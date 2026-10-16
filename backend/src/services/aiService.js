const { GoogleGenerativeAI } = require("@google/generative-ai");
const { performance } = require("node:perf_hooks");

const apiKey = String(process.env.GEMINI_API_KEY || "").trim();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const generateAIResponse = async (message, context = {}) => {
    const startTime = performance.now();

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env and restart the backend.");
    }

    const {
        taskTitle = "",
        taskDescription = "",
        code = ""
    } = context;

    const systemInstruction = `
You are CodeLearn AI, an AI programming learning assistant.

Help learners understand programming concepts, debug code,
and solve programming problems.

1. Prefer hints when guidance is requested.
2. Provide complete, executable code when explicitly requested.
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

    const primaryModelName =
        process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

    const fallbackModelName =
        process.env.GEMINI_FALLBACK_MODEL || "gemini-3.6-flash";

    const sleep = (ms) =>
        new Promise(resolve => setTimeout(resolve, ms));

    const generateWithRetry = async (modelName) => {
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction
        });

        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                console.log(`[AI] ${modelName}: attempt ${attempt + 1}/3`);
                const result = await model.generateContent(message);
                return result.response.text();
            } catch (error) {
                const status = Number(error.status);

                if (![429, 503, 500, 504].includes(status) || attempt === 2) {
                    throw error;
                }

                const delay = 1000 * (2 ** attempt);
                console.warn(
                    `[AI] ${modelName} returned ${status}. Retrying in ${delay / 1000}s.`
                );
                await sleep(delay);
            }
        }
    };

    try {
        try {
            const response = await generateWithRetry(primaryModelName);
            console.log(
                `[AI] Success using primary model in ${((performance.now() - startTime) / 1000).toFixed(2)}s`
            );
            return response;
        } catch (error) {
            const status = Number(error.status);

            if (
                ![429, 503, 500, 504].includes(status) ||
                fallbackModelName === primaryModelName
            ) {
                throw error;
            }

            console.warn(`[AI] Primary model unavailable. Trying ${fallbackModelName}.`);
            const response = await generateWithRetry(fallbackModelName);

            console.log(
                `[AI] Success using fallback model in ${((performance.now() - startTime) / 1000).toFixed(2)}s`
            );
            return response;
        }
    } catch (error) {
        console.error(
            `[AI] All attempts failed after ${((performance.now() - startTime) / 1000).toFixed(2)}s. Status: ${error.status || "unknown"}. ${error.message || ""}`
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
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing. Add it to backend/.env and restart the backend.");
    }

    const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        generationConfig: {
            responseMimeType: "application/json"
        }
    });

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
    {
      "input": "Test input",
      "expectedOutput": "Expected output"
    }
  ]
}

Rules:
1. Use the exact field names above.
2. Generate exactly ${count} different tasks.
3. Include at least 3 test cases per task.
4. Include normal and edge cases.
5. Ensure expected outputs are correct.
6. Starter code must match the selected language.
7. Do not include complete solutions in starterCode.
8. Make descriptions clear and suitable for a coding practice page.
9. Do not include Markdown fences or text outside the JSON array.
`;

    const result = await model.generateContent(prompt);
    const tasks = JSON.parse(result.response.text());

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