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
exports.signin = signin;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtSecret = process.env.JWT_KEY;
const prisma = new client_1.PrismaClient();
function signin(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const body = req.body;
        const schema = zod_1.z.object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8).optional(),
            name: zod_1.z.string(),
            image: zod_1.z.string()
        });
        const search = yield prisma.user.findFirst({
            where: { email: body.email }
        });
        const zodValid = schema.safeParse(body);
        if (zodValid.success) {
            if (!search) {
                const data = yield prisma.user.create({
                    data: body
                });
                const token = jsonwebtoken_1.default.sign(JSON.stringify({ email: body.email }), jwtSecret);
                const signedIn = jsonwebtoken_1.default.sign(JSON.stringify({ state: true }), jwtSecret);
                res.cookie('status', signedIn);
                res.cookie('token', token);
                res.status(200).send('Login Success');
            }
            else {
                console.log(search);
                const token = jsonwebtoken_1.default.sign(JSON.stringify({ email: search.email }), jwtSecret);
                const signedIn = jsonwebtoken_1.default.sign(JSON.stringify({ state: true }), jwtSecret);
                res.cookie('status', signedIn,{  secure: false, sameSite: 'None', path: '/' });
                res.cookie('token', token,{  secure: false, sameSite: 'None', path: '/' });
                res.status(200).send('Login Success');
            }
        }
        else {
            res.status(202).send('Fomatting of either of the credentials failed.');
        }
    });
}
