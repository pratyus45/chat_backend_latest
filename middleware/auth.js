//Middleware to protect routes
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const protectRoute = async(req, res , next)=>{
    try{
        // Check for token in multiple possible locations
        let token = req.headers.token || req.headers.authorization;
        
        // Handle Bearer token format
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7); // Remove 'Bearer ' prefix
        }

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if(!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
       
        req.user = user; // Attach user to request object
        next(); // Proceed to the next middleware or route handler

    }catch(error){
        console.error("Error in protectRoute middleware:", error.message);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token expired" });
        }
        
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}