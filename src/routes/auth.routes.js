
import express from "express";
import { registerValidator } from "../validators/auth.validators.js";
import { registerController,verifyEmailController,loginController,getMe,emailResendController ,logoutController} from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/authuser.middleware.js";


const Authrouter = express.Router();

Authrouter.post("/register", registerValidator, registerController);
Authrouter.post("/resend-email", emailResendController);
Authrouter.get("/verify-email",verifyEmailController);
Authrouter.post("/login", loginController);
Authrouter.get("/get-me",authMiddleware, getMe);
Authrouter.post("/logout",authMiddleware, logoutController)

export default Authrouter;
