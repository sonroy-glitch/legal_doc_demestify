"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzer = analyzer;

const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const core_1 = require("@tavily/core");
const client = (0, core_1.tavily)({ apiKey: process.env.TAVILY_KEY });

const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_KEY);

const systemInstruction = {
    role: 'user',
    parts: [{
        text: `
        {
          "role": "system",
          "instructions": {
            "purpose": "You are a financial tool tasked with simplifying complex financial data for laymen.",
            "behavior": [
              "You analyze company reports or personal financial insights.",
              "You generate a story-based narrative (approx. 1000 words) to explain financial data in simple terms.",
              "Ensure clarity, logical flow, and relevance — avoid technical jargon or unnecessary complexity."
            ],
            "response_format": {
              "search_needed": {
                "description": "Used when more real-time data or context is required before analysis can proceed.",
                "example": {
                  "type": "search",
                  "question": "What is the latest quarterly revenue for Apple Inc.?",
                  "end": true
                }
              },
              "final_output": {
                "description": "Used when the analysis is complete and ready to be shown to the user.",
                "example": {
                  "type": "final",
                  "end": false,
                  "data": "Once upon a time, a small tech company called XYZ Inc. reported record-breaking revenue..."
                }
              },
              "note": "Always wrap the entire output string — including JSON structure — within quotes for parsing reliability."
            },
            "input_format": {
              "description": "Incoming user request structure you will receive.",
              "example": {
                "userId": "reference_user_id",
                "data": "Raw financial data or statements to summarize",
                "end": true
              }
            },
            "rules": [
              "Do not provide introductions, framing, or filler text.",
              "Focus only on the core financial summary in a story-driven format.",
              "If additional info is needed, use 'search' format.",
              "If enough data is present, return the story in the 'final' format."
            ]
          }
        }
        `
    }]
};

function caller(query) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Caller started...");
        let end = true;
        let history = [];

        const chat = model.startChat({
            systemInstruction,
            history
        });

        while (end) {
            const out = yield chat.sendMessage([query]);
            const rawResponse = out.response.text();
            console.log("Raw AI Response:", rawResponse);

            const trimmed = rawResponse.slice(7, rawResponse.length - 3);
            let data;
            try {
                data = JSON.parse(trimmed);
            } catch (err) {
                console.error("JSON parse error:", err, "AI returned:", trimmed);
                throw new Error("Invalid AI response format");
            }

            if (data) {
                if (data.type === 'final') {
                    end = data.end;
                    history.push(data);
                    return data.data;
                } else if (data.type === 'search') {
                    const answer = yield client.search(`${data.question}`, {
                        topic: "finance",
                        includeImages: true,
                        includeImageDescriptions: true
                    });
                    history.push(answer);
                }
            } else {
                console.warn("No data returned from AI");
                return true;
            }
        }
    });
}

function analyzer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const userId = req.header('userId');

        if (!userId) {
            return res.status(400).json({ error: "Missing userId header" });
        }
        if (!body || !body.data) {
            return res.status(400).json({ error: "Missing 'data' field in request body" });
        }

        try {
            console.log("Analyzer started for user:", userId);
            const out = yield caller(JSON.stringify(body));
            console.log("Caller output:", out);

            yield redis.set(userId, JSON.stringify(body.data), 'EX', 86400);
            console.log(`Data stored in Redis for user ${userId}`);

            return res.json({ data: out });
        } catch (error) {
            console.error("Analyzer error:", error);
            return res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    });
}
