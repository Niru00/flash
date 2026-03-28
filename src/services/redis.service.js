import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config()

const redis = new Redis({
   host:process.env.REDIS_HOST,
   port:process.env.REDIS_PORT,
   password:process.env.REDIS_PASSWORD,
})

redis.on("connect",()=>{
    console.log("redis connected to server");
    
})

redis.on("error",(err)=>{
    console.log("Redis Error:", err);
    
})

export const addTokenToBlacklist = async (token, expiresIn) => {
  try {
    await redis.setex(`blacklist_${token}`, expiresIn, 'true');
  } catch (error) {
    console.error('Error adding token to blacklist:', error);
  }
};

export const isTokenBlacklisted = async (token) => {
  try {
    const result = await redis.get(`blacklist_${token}`);
    return result !== null;
  } catch (error) {
    console.error('Error checking blacklist:', error);
    return false;
  }
};

export default redis;