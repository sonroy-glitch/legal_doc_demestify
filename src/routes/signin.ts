import {Request,Response} from 'express'
import { PrismaClient } from '@prisma/client';
import {z} from 'zod'
import jwt,{JwtPayload} from 'jsonwebtoken'
const jwtSecret= process.env.JWT_KEY
const prisma=new PrismaClient()
export async function signin(req:Request,res:Response){
    const body =req.body
    const schema=z.object({
        email:z.string().email(),
        password:z.string().min(8).optional(),
        name:z.string(),
        image:z.string()
    })
    const search = await prisma.user.findFirst({
        where:{email:body.email}
    })
    const zodValid=schema.safeParse(body)
    if(zodValid.success){
    if (!search){
        const data = await prisma.user.create({
            data:body
        })
        const token=jwt.sign(JSON.stringify({email:body.email}),jwtSecret)
        const signedIn=jwt.sign(JSON.stringify({state:true}),jwtSecret)
        res.cookie('status',signedIn)
         res.cookie('token',token)
         res.status(200).send('Login Success')

    }
    else{
        
        const token=jwt.sign(JSON.stringify({email:search.email}),jwtSecret)
        const signedIn=jwt.sign(JSON.stringify({state:true}),jwtSecret)
        res.cookie('status',signedIn)
         res.cookie('token',token)
         res.status(200).send('Login Success')
    }
    }
    else{
        res.status(202).send('Fomatting of either of the credentials failed.')
    }
    
   

}