import { app } from './app.js';
import { connectDB } from './data/database.js';
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay';
import cluster from 'cluster';
import os from 'os';
import Redis from 'ioredis';


const totalCPUs = os.cpus().length;
console.log("Number of CPUs:", totalCPUs);

// Cluster setup to handle multiple processes for better CPU utilization
if (cluster.isPrimary) {              // peimary process also called as master 
    console.log(`Primary process ${process.pid} is running`);

    // Fork workers for each CPU core
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();         // Creates a new worker, from a master
    }

    // Listen for worker exits and restart them
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} exited with code ${code}. Restarting...`);
        cluster.fork();
    });
} else {
    const port = process.env.PORT || 3000;
    const server = app.listen(port, () => {
        console.log(`Worker ${process.pid} is listening on port ${port} in ${process.env.NODE_ENV} mode`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.error(`Unhandled rejection: ${err.message}`);
        console.log("Shutting down server due to unhandled promise rejection");

        server.close(() => {
            process.exit(1);
        });
    });
}

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error(`Uncaught exception: ${err.message}`);
    console.log("Shutting down the server due to uncaught exception");
    process.exit(1);
});

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Redis client
// export const redisClient = new Redis({
//     host:process.env.REDIS_HOTS || '127.0.0.1',
//     port:process.env.REDIS_PORT || 6379,
//     password:process.env.REDIS_PASSWORD || null,
// })

// Initialize Razorpay
export const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
});

// Connect to the database
connectDB();
