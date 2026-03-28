    import { Server } from "socket.io";
    import { generateResponse } from "../services/ai.service.js";
    import messageModel from "../models/message.model.js";

    let io;
  

    export const initSocketServer = (httpserver) => {
    io = new Server(httpserver, {
        cors: {
        origin: "https://flash-zzqe.onrender.com",
        credentials: true,
        },
    });

    console.log("Socket server initialized");

 io.on("connection", (socket) => {
  let pendingChatId = null;
  let currentController = null;

  socket.on("updateChatId", (data) => {
    pendingChatId = data.chatId;
  });

  socket.on("stopAI",()=>{
     if (currentController) {
      currentController.abort();
      currentController = null;
      socket.emit("done", { status: "stopped" });
    }
  })

  socket.on("askAI", async (data) => {
       currentController = null
         let acculumatedResponse = "";
          let chatId;

    try {
      const fullResponse = await generateResponse(
        data.messages, 
        socket,
          (controller) => { currentController = controller },
        (chunk) =>{acculumatedResponse += chunk}  
      );

    
     chatId = data.chatId;
      if (!chatId) {
        chatId = await new Promise((resolve) => {
          if (pendingChatId) return resolve(pendingChatId); // already arrived
          
          const timeout = setTimeout(() => resolve(null), 5000); // give up after 5s
          
          socket.once("updateChatId", (data) => {
            clearTimeout(timeout);
            resolve(data.chatId);
          });
        });
      }

      pendingChatId = null;

      if (chatId &&acculumatedResponse) {
        await messageModel.create({
          content: acculumatedResponse,
          role: "ai",
          chat: chatId
        });
      }

    } catch (err) {
          if (err.name === "AbortError") {
    console.log("Stopped by user");

    if (chatId && acculumatedResponse) {
      await messageModel.create({
        content: acculumatedResponse,
        role: "ai",
        chat: chatId
      });
    }

    return;
  }
      socket.emit("ai_error", { message: "Something went wrong" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
    };

    export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io server not initialized");
    }
    return io;
    };