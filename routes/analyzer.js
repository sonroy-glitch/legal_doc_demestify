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

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Use env var for safety
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const { tavily } = require("@tavily/core");
const client = tavily({ apiKey: process.env.TAVILY_API_KEY }); // Use env var

const Redis = __importDefault(require("ioredis"));
const redis = new Redis.default(process.env.UPSTASH_REDIS_URL); // Use env var

// ---- SYSTEM INSTRUCTION ----
const systemInstruction = {
  role: 'user',
  parts: [{
    text: `
{
  "role": "system",
  "instructions": {
    "purpose": "You are FinDocGPT — an always-on financial analyst designed to parse, analyze, and summarize complex financial documents to inform smarter investment strategies for both professionals and non-experts.",
    "behavior": [
      "You analyze company filings, earnings reports, analyst notes, and other financial documents.",
      "You extract key quantitative metrics, qualitative signals, and risk factors, ensuring accuracy and citing sources when possible.",
      "You transform the extracted insights into a clear, story-driven narrative (approx. 1000 words) that connects financial data to real-world investment implications.",
      "Avoid unnecessary technical jargon — use plain language where possible, but retain important financial terminology when needed for accuracy.",
      "Provide both narrative insight and a high-level actionable investment view (e.g., Buy/Hold/Sell sentiment with reasoning) without giving explicit financial advice."
    ],
    "response_format": {
      "search_needed": {
        "description": "Use when more real-time data, missing metrics, or additional market context is required before producing an accurate analysis.",
        "example": {
          "type": "search",
          "question": "What is the latest quarterly EPS and revenue for Tesla, and how did it compare to analyst expectations?",
          "end": true
        }
      },
      "final_output": {
        "description": "Use when the analysis is complete and ready for the user — include the narrative story, extracted key points, and suggested strategic considerations.",
        "example": {
          "type": "final",
          "end": false,
          "data": {
            "narrative": "Once upon a fiscal quarter, a pioneering EV maker named Tesla delivered results that electrified some investors but worried others...",
            "key_metrics": {
              "revenue": "$25.17B",
              "eps": "$1.05",
              "guidance_change": "Raised FY2025 delivery target by 10%"
            },
            "investment_view": "Neutral with cautious optimism due to margin pressure despite volume growth."
          }
        }
      },
      "note": "Always wrap the entire output string — including JSON structure — within quotes for parsing reliability."
    },
    "input_format": {
      "description": "Incoming user request structure you will receive.",
      "example": {
        "userId": "reference_user_id",
        "data": "Raw financial statements, analyst reports, or market commentary to be analyzed",
        "end": true
      }
    },
    "rules": [
      "Do not provide introductions or generic disclaimers unless compliance requires it.",
      "Focus on extracting verifiable facts from the document(s) and weaving them into a logical, engaging narrative.",
      "If additional info is needed, use 'search' format.",
      "If enough data is present, return the story, key points, and investment view in the 'final' format.",
      "Ensure all quantitative claims are backed by the source document or reliable data."
    ]
  }
}
    `
  }]
};

// ---- CALLER FUNCTION ----
function caller(query) {
  return __awaiter(this, void 0, void 0, function* () {
    let end = false;
    let history = [];
    const chat = model.startChat({
      systemInstruction,
      history
    });

    while (true) {
      const out = yield chat.sendMessage([query]);
      const rawText = out.response.text();

      let parsed;
      try {
        // Remove wrapping quotes if present
        const clean = rawText.trim().replace(/^"+|"+$/g, '');
        parsed = JSON.parse(clean);
      } catch (err) {
        console.error("JSON parse error:", err, "Raw output:", rawText);
        throw new Error("Invalid model output format");
      }

      if (!parsed || !parsed.type) {
        throw new Error("No valid type in model response");
      }

      if (parsed.type === 'final') {
        return parsed.data;
      } else if (parsed.type === 'search') {
        const searchResults = yield client.search(parsed.question, {
          topic: "finance",
          includeImages: true,
          includeImageDescriptions: true
        });
        // Feed search results back into model
        query = JSON.stringify({
          search_context: searchResults,
          original_question: parsed.question
        });
      }
    }
  });
}

// ---- ANALYZER FUNCTION ----
function analyzer(req, res) {
  return __awaiter(this, void 0, void 0, function* () {
    const data = req.body;
    const userId = req.header('userId');

    try {
      const out = yield caller(JSON.stringify(data));
      yield redis.set(`${userId}`, JSON.stringify(out), 'EX', 86400);
      res.json({ data: out });
    } catch (error) {
      console.error("Analyzer error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
