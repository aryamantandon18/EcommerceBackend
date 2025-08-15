import jwt from 'jsonwebtoken';

export const sendCookie=(res,user,message)=>{
    const token = jwt.sign({_id:user._id},process.env.JWT_SECRET);

    res.status(200).cookie("Token" ,token ,{
        httpOnly:true, //so that cookies can be modified in the server only not from the user end
        maxAge:7*24*60*60*1000,    //7 days this is always in miliSecond
        sameSite: process.env.node_env ==="Development"?"lax": "none",               
        secure:process.env.node_env ==="Development"? false: true,        //Ensures that the cookie is only sent over HTTPS (not HTTP).    
    }).json({
        sucess:true,
        message,    
        user,
        token,
    })
};


//sameSite :"none" requires secure:true