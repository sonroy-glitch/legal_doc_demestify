import {Request,Response} from 'express'

export async function signout(req:Request,res:Response){
    res.clearCookie('token', { path: 'http://localhost:5173' });
    res.clearCookie('status', { path: 'http://localhost:5173' });
    res.status(200).send("Signout Successful")

}