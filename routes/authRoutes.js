import express from "express";
import { signup, login, checkAuth, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const authRouter = express.Router();
authRouter.use(express.json());

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.get("/check", protectRoute, checkAuth);
authRouter.put("/update-profile", protectRoute, updateProfile);

export default authRouter;