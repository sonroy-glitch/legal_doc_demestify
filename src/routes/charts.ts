import {Request,Response} from 'express'
import Redis from "ioredis"
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.AI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
import {tavily} from '@tavily/core'
const client =tavily({apiKey: process.env.TAVILY_KEY})
const redis = new Redis(process.env.REDIS_KEY)
const systemInstruction={
    role:'user',
    parts:[{
        text:`
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
}
async function caller(query:any){
    let end=true;
    var history:any=[]
    const chat =model.startChat({
        systemInstruction,
        history
    })

        var answer=await chat.sendMessage([query])
        console.log(answer.response.text())
       
            const out=await chat.sendMessage([query])
            console.log(out.response.text())
            const result= (out.response.text().slice(7,out.response.text().length-3))
            // console.log( result)
            // console.log(JSON.parse(result))
            var data=JSON.parse(result)
            console.log(data)
            if(data){
                if(data.type=='final'){
                    return data.charts
                }
            }
            
          
    
}
export async function charts(req:Request,res:Response){
    //fetching the data from redis
    const userId=req.header('userId')
    console.log(userId)
    const data= await redis.get(`${userId}`)
    if(data){
        const obj=JSON.stringify({userId,reference:data})
        const out=await caller(obj)
        console.log(out)
        res.status(200).json({data:out})
    }
    else{
        res.status(202).json({data:'ISSUE WITH YOUR FILE REUPLOAD'})

    }
   
}