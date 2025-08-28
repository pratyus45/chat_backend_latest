//signup user function
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.json({ success: false, message: "Account Already exist" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);
        res.json({ success: true, userData: newUser, message: "Account Created Successfully", token });
    } catch (error) {
        console.error(error.message);
        // You can log the error here if needed
        res.json({ success: false, message: "Error creating account", error: error.message });
    }
}


//controller to login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if fields are provided
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const userData = await User.findOne({ email });

    // check if user exists
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // check password
    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // generate token
    const token = generateToken(userData._id);

    // send response
    res.json({
      success: true,
      message: "Login Successful",
      token,
      userData: {
        _id: userData._id,
        fullName: userData.fullName,
        email: userData.email,
        bio: userData.bio,
        profilePic: userData.profilePic,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Error logging in", error: error.message });
  }
};


//controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({ success: true, user: req.user });
}


//controller to update users profile details
export const updateProfile = async (req, res) => {
    try{
        const {profilePic , bio , fullName} = req.body;
        const userId = req.user._id;
        let updatedUser;

        console.log("Updating profile for user:", userId);
        console.log("Update data:", { profilePic: profilePic ? "provided" : "not provided", bio, fullName });

        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName}, {new: true});
            console.log("Profile updated without image:", updatedUser);
        }
        else{
            console.log("Uploading image to cloudinary...");
            const upload = await cloudinary.uploader.upload(profilePic);
            updatedUser = await User.findByIdAndUpdate(userId, {
                profilePic: upload.secure_url,bio, fullName
            }, {new: true});
            console.log("Profile updated with image:", updatedUser);
        }

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.json({ success: true, user: updatedUser, message: "Profile Updated Successfully" });

    }catch (error) {
        console.error("Profile update error:", error.message);
        res.status(500).json({ success: false, message: "Error updating profile", error: error.message });
    }
}