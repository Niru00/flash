import chatModel from "../models/chat.model.js"
import { generateTitleforChat } from "../services/ai.service.js"
import messageModel from "../models/message.model.js"


async function sentMessage(req, res) {
  const { message, chatID } = req.body;

  let title = null, chat = null;

  if (!chatID) {
    title = await generateTitleforChat(message);
    chat = await chatModel.create({
      user: req.user.id,
      title: title,
    });
  }

  const userMessage = await messageModel.create({
    content: message,
    role: "user",
    chat: chatID || chat._id
  });

  // ✅ No generateResponse here — socket handles AI
  res.status(200).json({
    success: true,
    message: "Message sent successfully",
    title: title,
    chat: chat,
  });
}

async function getChats(req,res) {

    const user = req.user.id;

    const chats = await chatModel.find({
        user:user  
    })
    
    res.status(200).json({
        message:"chats retreived successfully",
        success:true,
        chats
    })
}

async function getMessages(req,res) {
    const {chatID} = req.params;

    const chat = await chatModel.findOne({
        _id:chatID,
        user:req.user.id
    })

    if(!chat){
        return res.status(404).json({
            success:false,
            message:"No messages found for this chat"
        })
    }

    const messages = await messageModel.find({
        chat:chatID
    })

    res.status(200).json({
        success:true,
        message:"Messages retreived successfully",
        messages,
        title:chat.title
    })

}

async function deleteChat(req,res) {
    const {chatID} = req.params;

    const chat = await chatModel.findOneAndDelete({
        _id:chatID,
        user:req.user.id
    })

    if(!chat){
        return res.status(404).json({
            success:false,
            message:"Chat not found"
        })
      }

    await messageModel.deleteMany({
        chat:chatID
    })

    res.status(200).json({
        success:true,
        message:"Chat deleted successfully"
    })
}


export {
    sentMessage,
    getChats,
    getMessages,
    deleteChat
}