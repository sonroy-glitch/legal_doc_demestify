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
exports.chatbot = chatbot;
const ioredis_1 = __importDefault(require("ioredis"));
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const core_1 = require("@tavily/core");
const client = (0, core_1.tavily)({ apiKey: process.env.TAVILY_KEY });
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
        },
        "note": "The returned answer will be appended to the conversation history for continued reasoning."
      },
      "final_output": {
        "description": "Use this format when the analysis is complete and sufficient data is available.",
        "structure": {
          "type": "final",
          "end": false,
          "data": "Your analyzed and clear financial explanation in paragraph format"
        },
        "notes": [
          "The entire structured output must be wrapped in quotes to ensure parsing.",
          "Ensure the 'data' field contains a well-written paragraph(s) with relevant financial insights."
        ]
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
      "Prioritize clarity and detail without overwhelming the user."
    ]
  }
}

        `
        }]
};
function caller(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let end = true;
        var history = [];
        const chat = model.startChat({
            systemInstruction,
            history
        });
        while (end) {
            const out = yield chat.sendMessage([query]);
            // console.log(out.response.text())
            const result = (out.response.text().slice(7, out.response.text().length - 3));
            console.log(result);
            // console.log(JSON.parse(result))
            var data = JSON.parse(result);
            console.log(data);
            if (data) {
                if (data.type == 'final') {
                    end = data.end;
                    return data.data;
                }
                else if (data.type == 'search') {
                    let answer = yield client.search(query = `${data.question}`, {
                        topic: "finance",
                        includeImages: true,
                        includeImageDescriptions: true
                    });
                    query = JSON.stringify({ question: data.question, answer: answer.results });
                }
            }
        }
    });
}
function chatbot(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        //fetching the data from redis
        const userId = req.header('userId');
        console.log(userId);
        const data = yield redis.get(`${userId}`);
        if (data) {
            const question = req.body.question;
            const end = true;
            const obj = JSON.stringify({ userId, reference: data, question, end });
            const out = yield caller(obj);
            res.status(200).json({ data: out });
        }
        else {
            res.status(202).json({ data: 'ISSUE WITH YOUR FILE REUPLOAD' });
        }
    });
}
