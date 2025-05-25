import {Request,Response } from 'express'
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI('AIzaSyCyRk4a7w7iJ5Iz2RjHYCDEAPu40_-iYQQ');
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
import {tavily} from '@tavily/core'
const client =tavily({apiKey: "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"})
import Redis from "ioredis"

const redis = new Redis("rediss://default:AT0iAAIjcDEwYzQ1YzNjNjA0NDI0ZGExOGVjNGVlZjBlOTU5OWMwM3AxMA@smashing-gelding-15650.upstash.io:6379");
const systemInstruction={
    role:'user',
    parts:[{
        text:`
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
}
async function caller(query:any){
    console.log('hi')
    let end=true;
    var history:any=[]
    const chat =model.startChat({
        systemInstruction,
        history
    })
     while(end){
        const out=await chat.sendMessage([query])
        console.log(out.response.text())
        const result= (out.response.text().slice(7,out.response.text().length-3))
       
        // console.log(JSON.parse(result))
        var data=JSON.parse(result)
      
        if(data){
          console.log('hi from data')
          if(data.type=='final'){
            end=data.end
            history=[...history,data]
            return data.data
            
          }
          else if(data.type=='search'){
            let answer=await client.search(query=`${data.question}`,{
              topic: "finance",
              includeImages: true,
              includeImageDescriptions: true
          })
          history=[...history,answer]
          
          }
        }
        else {
          // console.log("no fucking data ")
            return true
          // const data =JSON.parse()
        }
      }
        
}
export async function analyzer(req:Request,res:Response){
     const data= (req.body);
     const userId=req.header('userId')
     try {
        console.log('hi from try')
       
          const out= await caller(JSON.stringify(data))
          console.log('data thrown')
           redis.set(`${userId}`,JSON.stringify(data.data),'EX',86400);
          res.json({data:out})
     } catch (error:any) {
        console.error(JSON.stringify(error))

     }
     
}
