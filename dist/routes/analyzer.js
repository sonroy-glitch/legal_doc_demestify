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
const genAI = new generative_ai_1.GoogleGenerativeAI('AIzaSyCyRk4a7w7iJ5Iz2RjHYCDEAPu40_-iYQQ');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const core_1 = require("@tavily/core");
const client = (0, core_1.tavily)({ apiKey: "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" });
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default("rediss://default:AT0iAAIjcDEwYzQ1YzNjNjA0NDI0ZGExOGVjNGVlZjBlOTU5OWMwM3AxMA@smashing-gelding-15650.upstash.io:6379");
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
