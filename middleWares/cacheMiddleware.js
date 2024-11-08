// import { redisClient } from "../server.js";

// const cacheMiddleware = async(req,res,next) =>{
//     const key = req.originalUrl;
//     try {
//         const cacheData = await redisClient.get(key);
//         if(cacheData){
//             return res.status(200).json(JSON.parse(cacheData));
//         }
//         next();  // If no cache, proceed to handler
//     } catch (error) {
//         console.error('Redis error : ',error);
//         next();
//     }
// }

// export default cacheMiddleware;