
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { isTokenBlacklisted } from "../services/redis.service.js";
dotenv.config()

async function authUser(req,res,next) {
     const token = req.cookies.token
     

     if(!token){
        return res.status(401).json({
            message:"Unauthorized",
            success:false,
            error:"No token provided"
        })
     }

     // Check if token is blacklisted
     const blacklisted = await isTokenBlacklisted(token);
     if(blacklisted){
        return res.status(401).json({
            message:"Unauthorized",
            success:false,
            error:"Token has been revoked"
        })
     }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({
                message:"Unauthorized",
                success:false,
                error:"Invalid token"
            })

}
}

export default authUser;