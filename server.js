import express from 'express';
import http from 'http';
import cors from 'cors';
import "dotenv/config"; // to load environment variables
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import authRouter from './routes/authRoutes.js';
import { Server } from 'socket.io';

//create express app
const app = express();
const server = http.createServer(app);

//initialize socket.io server with proper configuration
export const io = new Server(server, {
    cors: {
        origin: "https://chat-frontend-latest-cqvh.vercel.app", // your frontend
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], // allow all common methods
        credentials: true, // required if you're sending cookies/tokens
        allowedHeaders: ["Content-Type", "Authorization"] // allow necessary headers
    },
    transports: ["websocket", "polling"],
    allowEIO3: true, // Allow Engine.IO v3 clients
    pingTimeout: 60000,
    pingInterval: 25000
});


//stores online users
export const userSocketMap = {}; //{userId: socketId}

//socket.io connection with proper error handling
io.on("connection", (socket) => {
    console.log("Socket.io server is ready and listening for connections");

    const userId = socket.handshake.query.userId; // Get userId from query params
    console.log("User connected:", userId ? userId : "Anonymous");

    if (userId) {
        userSocketMap[userId] = socket.id; // Store the socket ID with userId
        console.log(`User ${userId} mapped to socket ${socket.id}`);
    }

    //emit online users to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", (reason) => {
        console.log("User disconnected:", userId, "Reason:", reason);
        if (userId && userSocketMap[userId]) {
            delete userSocketMap[userId]; // Remove the socket ID when user disconnects
            io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Emit updated online users
        }
    });

    // Handle manual refresh request
    socket.on("requestOnlineUsers", () => {
        console.log("Manual refresh requested, sending online users:", Object.keys(userSocketMap));
        socket.emit("getOnlineUsers", Object.keys(userSocketMap));
    });

});
//middleware
app.use(express.json({ limit: "4mb" })); // to handle large data
app.use(cors({
  origin: "*",  // allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// Serve socket.io client files (fixes 404 error)
app.use('/socket.io/socket.io.js', express.static(process.cwd() + '/node_modules/socket.io-client/dist/socket.io.js'));

// Serve socket.io client files (fixes 404 error)
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(process.cwd() + '/node_modules/socket.io-client/dist/socket.io.js');
});

// API routes
app.use("/api/status", (req, res) => res.send("Server is Live"));
app.use("/api/auth", authRouter); // auth routes
app.use("/api/users", userRouter); // user routes
app.use("/api/messages", messageRouter); // message routes

//connect to the database
await connectDB();

if (process.env.NODE_ENV !== "Production") {
    const PORT = process.env.PORT || 5000;
    //start server with proper error handling
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Socket.io server is ready for connections`);
    });
}



// Handle server errors
server.on('error', (error) => {
    console.error('Server error:', error);
});

process.on('SIGINT', () => {
    console.log('Server shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

//Export server for vercel deployment
export default server;