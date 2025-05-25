import { Response, Request, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const jwtSecret = process.env.JWT_KEY;

export async function auth(req: Request, res: Response, next: NextFunction) :Promise<any>{
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Token missing. Unauthorized' });
    }

    const verify1 = jwt.verify(token, jwtSecret) as JwtPayload;
    
    if (verify1?.email) {
    
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }

  } catch (err) {
    res.status(401).json({ error: 'Authentication failed', details: err });
  }
}
