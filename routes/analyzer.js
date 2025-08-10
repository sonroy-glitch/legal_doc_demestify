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

function caller(query) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('hi');
        let end = true;
        var history = [];
        const chat = model.startChat({
            systemInstruction,
            history
        });
        while (end) {
            const out = yield chat.sendMessage([query]);
            console.log(out.response.text());
            const result = (out.response.text().slice(7, out.response.text().length - 3));
            console.log(result);
            // console.log(JSON.parse(result))
            var data = JSON.parse(result);
            console.log(data);
            if (data) {
                console.log('hi from data');
                if (data.type == 'final') {
                    end = data.end;
                    history = [...history, data];
                    return data.data;
                }
                else if (data.type == 'search') {
                    let answer = yield client.search(query = `${data.question}`, {
                        topic: "finance",
                        includeImages: true,
                        includeImageDescriptions: true
                    });
                    history = [...history, answer];
                }
            }
            else {
                // console.log("no fucking data ")
                return true;
                // const data =JSON.parse()
            }
        }
    });
}
function analyzer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = (req.body);
        const userId = req.header('userId');
        try {
            console.log('hi from try');
            console.log(userId);
            const out = yield caller(JSON.stringify(data));
            console.log('data thrown');
            redis.set(`${userId}`, JSON.stringify(data.data), 'EX', 86400);
            res.json({ data: out });
        }
        catch (error) {
            console.error(JSON.stringify(error));
        }
    });
}
