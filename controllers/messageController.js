import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import {io, userSocketMap} from "../server.js";



//Get all users except the logged-in user

export const getUserForSideBar = async (req, res) => {
    try{
        const userId = req.user._id;
        console.log("Fetching users for user:", userId);

        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password ");
        console.log("Found users:", filteredUsers.length);
        console.log("First user sample:", filteredUsers[0]);
        
        //Count number of messages not seen 
       const unseenMessages = {};
       const promises = filteredUsers.map(async (user) => {

        const messages = await Message.find({senderId: user._id, receiverId: userId, seen: false});
        if(messages.length > 0) {
            unseenMessages[user._id] = messages.length;
        }
       });
         await Promise.all(promises);
         
        console.log("Sending response with users:", filteredUsers.length);
        // Send response back to frontend
        res.json({ 
            success: true, 
            users: filteredUsers,
            unseenMessages: unseenMessages,
            message: "Users fetched successfully" 
        });
        
        }catch (error) {
        console.error("Error fetching users for sidebar:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

//get all messages for selected user
export const getMessages = async (req, res) => {
    try{
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        console.log("Fetching messages between:", myId, "and", selectedUserId);

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })
        console.log("Found messages:", messages.length);

        await Message.updateMany(
            { senderId: selectedUserId, receiverId: myId} , {seen: false} 
            
        );
        res.json({ success: true, messages, message: "Messages fetched successfully" });

    } catch (error) {
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

//api  to mark messages as seen using messageId
export const markMessagesAsSeen = async (req, res) => {
    try {
        
       const {id} = req.params;

      await Message.findByIdAndUpdate(id , { seen: true }, { new: true });

        res.json({ success: true, message: "Message marked as seen" });
    } catch (error) {
        console.error("Error marking message as seen:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}

//send msg to the selected user
export const sendMessage = async (req, res) => {
    try{
        const {text , image} = req.body;
        const senderId = req.user._id;
        const receiverId = req.params.id;

        let imageUrl = "";
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
           io.to(receiverSocketId).emit("newMessage", newMessage);            
        }

        res.json({ success: true, message: newMessage, message: "Message sent successfully" });

    }catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}