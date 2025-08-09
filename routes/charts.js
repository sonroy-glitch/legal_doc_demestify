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
exports.charts = charts;
const ioredis_1 = __importDefault(require("ioredis"));
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI('AIzaSyCyRk4a7w7iJ5Iz2RjHYCDEAPu40_-iYQQ');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
const core_1 = require("@tavily/core");
const client = (0, core_1.tavily)({ apiKey: process.env.TAVILY_KEY });
const redis = new ioredis_1.default('rediss://default:Abp_AAIjcDE0MjQ5YjBiM2NkMzA0OWM4OWVlNTAyYTQ0YzA2YmQzZXAxMA@delicate-grub-47743.upstash.io:6379');
const systemInstruction = {
    role: 'user',
    parts: [{
            text: `
        {
  "role": "system",
  "instructions": {
    "purpose": "You are a financial tool that analyzes financial information and outputs helpful charts to assist users in understanding financial data quickly and clearly.",
    "audience": "Layman users needing visual clarity on financial insights.",
    "behavior": [
      "Always generate relevant charts to visualize key financial patterns.",
      "Only return the core output in the defined JSON format.",
      "Avoid any explanatory or introductory text outside the structured output."
    ],
    "output_format": {
      "description": "Use this format for your response after analyzing the data.",
      "structure": {
        "type": "final",
        "charts": [
          {
            "chart_type": "scatter",
            "x": "[Array of x-axis points (numbers or strings)]",
            "y": "[Array of y-axis points (numbers or strings)]",
            "title": "Title of the chart"
          }
        ]
      },
      "notes": [
        "The entire output JSON must be enclosed within double quotes to ensure parsability.",
        "You may return multiple charts inside the 'charts' array — all should follow the same structure.",
        "Do not include commentary or narrative — output only the structured JSON."
      ]
    },
    "input_format": {
      "description": "Input structure received for processing financial data.",
      "structure": {
        "userId": "reference_user_id",
        "reference": "data block that you will refer to"
      }
    },
    "rules": [
      "Focus only on chart generation.",
      "Use appropriate chart types to best represent the data (bar or scatter).",
      "Ensure all chart fields are accurately populated with relevant values.",
      "Maximum 3 to 4 charts. No more"
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
        var answer = yield chat.sendMessage([query]);
        console.log(answer.response.text());
        const out = yield chat.sendMessage([query]);
        console.log(out.response.text());
        const result = (out.response.text().slice(7, out.response.text().length - 3));
        // console.log( result)
        // console.log(JSON.parse(result))
        var data = JSON.parse(result);
        console.log(data);
        if (data) {
            if (data.type == 'final') {
                return data.charts;
            }
        }
    });
}
function charts(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        //fetching the data from redis
        const userId = req.header('userId');
        console.log(userId);
        const data = yield redis.get(`${userId}`);
        if (data) {
            const obj = JSON.stringify({ userId, reference: data });
            const out = yield caller(obj);
            console.log(out);
            res.status(200).json({ data: out });
        }
        else {
            res.status(202).json({ data: 'ISSUE WITH YOUR FILE REUPLOAD' });
        }
    });
}
