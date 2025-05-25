import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import {analyzer} from './routes/analyzer'
import {chatbot} from './routes/chatbot'
import {charts} from './routes/charts'
import {signin} from './routes/signin'
import {auth} from './middlewares/auth'
import {signout} from './routes/signout'
const app =express()
app.use(cookieParser());
app.use(cors({origin:'http://localhost:5173', credentials: true }))


app.use(express.json({ limit: '10mb' }))


//agent endpoints
app.post('/signin',signin)
app.post("/analyzer",auth,analyzer)
app.post("/chatbot",auth,chatbot)
app.get("/graphs",auth,charts)
app.get('/signout',signout)
app.listen(4000)