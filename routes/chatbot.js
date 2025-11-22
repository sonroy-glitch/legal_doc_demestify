"use strict";
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbot = chatbot;

const ioredis_1 = __importDefault(require("ioredis"));
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { tavily } = require("@tavily/core");


["AI_KEY", "TAVILY_KEY", "REDIS_KEY"].forEach(key => {
    if (!process.env[key]) {
        console.error(` Missing environment variable: ${key}`);
    }
});


const genAI = new GoogleGenerativeAI(process.env.AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const client = tavily({ apiKey: process.env.TAVILY_KEY });
const redis = new ioredis_1.default(process.env.REDIS_KEY);


const systemInstruction = {
    role: 'user',
    parts: [{
        text: `
{
  "role": "system",
  "instructions": {
    "purpose": "You are a financial tool chatbot that clarifies user questions based on initially provided data.",
    "audience": "Layman users seeking clarity on financial data or insights.",
    "behavior": [
      "Always provide precise and descriptive answers.",
      "Keep responses paragraph-based, detailed, but not overly lengthy.",
      "Focus only on the core content — no introductions or framing."
    ],
    "output_format": {
      "search_needed": {
        "description": "Use this format if real-time data or external context is required to answer the user query.",
        "structure": {
          "type": "search",
          "question": "The question you need to look up to answer the user's query",
          "end": true
        }
      },
      "final_output": {
        "description": "Use this format when the analysis is complete and sufficient data is available.",
        "structure": {
          "type": "final",
          "end": false,
          "data": "Your analyzed and clear financial explanation in paragraph format"
        }
      }
    },
    "input_format": {
      "description": "Input you will receive per user query.",
      "structure": {
        "userId": "reference_user_id",
        "question": "question queried by the user",
        "reference": "data block that you will refer to",
        "end": true
      }
    },
    "rules": [
      "Never include introductory or explanatory phrases.",
      "Focus strictly on delivering informative and relevant answers.",
      "Prioritize clarity and detail without overwhelming the user.",
      "JUST FUCKING MAINTAIN THE FORMAT AT ALL TIMES"
      "Answer Questions only related to the document or finance stuff."
    ]
  }
}
`
    }]
};


async function caller(query) {
    let end = true;
    let history = [];
    const chat = model.startChat({ systemInstruction, history });

    while (end) {
        try {
            const out = await chat.sendMessage([query]);
            const rawText = out.response.text();

            console.log("📨 RAW AI OUTPUT:", rawText);

            // Remove possible markdown fences
            const cleaned = rawText
                .replace(/^```json\s*/i, "")
                .replace(/```$/i, "")
                .trim();

            let data;
            try {
                data = JSON.parse(cleaned);
            } catch (err) {
                console.error("JSON Parse Error:", err);
                throw new Error("AI returned invalid JSON format");
            }

            console.log(" Parsed Data:", data);

            if (data.type === 'final') {
                end = data.end;
                return data.data;
            } else if (data.type === 'search') {
                const answer = await client.search(`${data.question}`, {
                    topic: "finance",
                    includeImages: true,
                    includeImageDescriptions: true
                });
                query = JSON.stringify({
                    question: data.question,
                    answer: answer.results
                });
            } else {
                throw new Error("Unknown response type from AI");
            }
        } catch (err) {
            console.error("🔥 Error inside caller():", err);
            throw err; // will be caught in chatbot()
        }
    }
}


function chatbot(req, res) {
    (async () => {
        try {
            const userId = req.header('userId');
            if (!userId) {
                return res.status(400).json({ error: "Missing userId header" });
            }

            const data = await redis.get(`${userId}`);
            if (!data) {
                return res.status(202).json({ data: 'ISSUE WITH YOUR FILE REUPLOAD' });
            }

            const question = req.body.question;
            if (!question) {
                return res.status(400).json({ error: "Missing question in request body" });
            }

            const obj = JSON.stringify({
                userId,
                reference: data,
                question,
                end: true
            });

            const out = await caller(obj);
            res.status(200).json({ data: out });

        } catch (err) {
            console.error("🔥 SERVER ERROR:", err);
            res.status(500).json({
                error: err.message,
                stack: err.stack
            });
        }
    })();
}
