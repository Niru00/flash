import express from "express";
import authUser from "../middlewares/authuser.middleware.js";
import { sentMessage,getChats,getMessages,deleteChat } from "../controllers/chat.controller.js";

export const chatRouter = express.Router();

chatRouter.post("/",authUser,sentMessage)
chatRouter.get("/getchats",authUser,getChats)
chatRouter.get("/getmessages/:chatID",authUser,getMessages)
chatRouter.delete("/deletechat/:chatID",authUser,deleteChat)

