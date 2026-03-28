import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import{ChatMistralAI} from "@langchain/mistralai";
import {HumanMessage, SystemMessage,AIMessage,tool,createAgent} from "langchain"
import { z } from "zod";
import { searchWeb } from "./searchweb.service.js";



// const model = new ChatGoogleGenerativeAI({
//   model: "gemini-2.5-flash-lite",
//   apiKey: process.env.GOOGLE_GEMINI_KEY
// });

const model = new ChatMistralAI({
  model: "mistral-small-latest",
  apiKey: process.env.MISTRAL_API_KEY
});

const searchWebTool = tool(
  searchWeb,
  {
    name: "searchWeb",
    description: "use this tool to search the web for information",
    schema: z.object({  
      query: z.string().describe("The search query to find information on the web")
    })
  }
)

const agent = createAgent(
{
  model,
  tools:[searchWebTool],
}
  
)

// export async function generateResponse(messages) {
//   try {
//     const response = await agent.invoke({
//       messages: messages
//         .map((mes) => {
//           if (mes.role === "user") return new HumanMessage(mes.content)
//           else if (mes.role === "ai") return new AIMessage(mes.content)
//         })
//     })
    
//        const lastTextMessage = [...response.messages]
//   .reverse()
//   .find(msg => typeof msg.content === 'string' && msg.content.length > 0)

// return lastTextMessage?.content || "Sorry, I couldn't generate a response."
//   } catch (error) {
//     console.error("Error generating response:", error)
//     throw new Error("Failed to generate response")
//   }
// }


export async function generateResponse(messages, socket,getController,onChunk) {
  const controller = new AbortController();
  if(getController) getController(controller)

  try {
    const stream = agent.streamEvents(
      {
        messages: messages
          .filter(mes => mes.content && mes.content.trim() !== "") // ✅ filter empty
          .map((mes) => {
            if (mes.role === "user") return new HumanMessage(mes.content);
            else if (mes.role === "ai") return new AIMessage(mes.content);
          })
          .filter(Boolean), // ✅ filter any undefined from bad roles
      },
      { version: "v2" ,
        signal: controller.signal 
      }
    );

    let fullResponse = "";

    for await (const event of stream) {
        if (event.event === "on_chat_model_stream") {
        const content = event.data?.chunk?.content || "";
        if (content) {
          fullResponse += content;
          if(onChunk) onChunk(content)
          socket.emit("ai_chunk", { chunk:content  });
        }
      }
    }

    socket.emit("done", { status: "completed" });
    return fullResponse;

  } catch (error) {
       if (error.name === "AbortError") {
      socket.emit("done", { status: "stopped" });
       throw error;
    }
    socket.emit("ai_error", { message: "Sorry, I couldn't generate a response." });
  }
}

export async function generateTitleforChat(message) {
 
  const formattedPrompt = [new SystemMessage(
    `You are a helpful assistant that generates concise and relevant titles for chat conversations. Based on the following message, create a title that 
    captures the essence of the conversation in a few words.
     
    user will send you a message and you will generate a title for that message. The title should be concise, relevant, and capture the main topic of the conversation.
    and also title should only in 2 to 4 words.
    `
  ),

  new HumanMessage(message)];
  try {
    const response = await model.invoke(formattedPrompt);
    return response.text;
  }  catch (error) {    console.error("Error generating title:", error);
    throw new Error("Failed to generate title");
  }
}