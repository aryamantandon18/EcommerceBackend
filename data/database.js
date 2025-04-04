    import mongoose from "mongoose";

    export const connectDB =()=>{
        mongoose.connect(process.env.MONGO_URI,{
        dbName:"Ecommerce",
    })
    .then((c)=> console.log(`Database Connect with ${c.connection.host}`))
    .catch((e)=> console.error(`Error connecting to the database: ${e.message}`));
    }