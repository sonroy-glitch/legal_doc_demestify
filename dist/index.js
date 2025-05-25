"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const analyzer_1 = require("./routes/analyzer");
const chatbot_1 = require("./routes/chatbot");
const charts_1 = require("./routes/charts");
const signin_1 = require("./routes/signin");
const auth_1 = require("./middlewares/auth");
const signout_1 = require("./routes/signout");
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ origin: 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
//agent endpoints
app.post('/signin', signin_1.signin);
app.post("/analyzer", auth_1.auth, analyzer_1.analyzer);
app.post("/chatbot", auth_1.auth, chatbot_1.chatbot);
app.get("/graphs", auth_1.auth, charts_1.charts);
app.get('/signout', signout_1.signout);
app.listen(4000);
