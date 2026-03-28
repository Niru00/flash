import app from "./src/app.js";
import connectDB from "./src/config/database.js";
// import { generateResponse } from "./src/services/ai.service.js";
import http from "http"
import { initSocketServer } from "./src/sockets/server.socket.js";

import dotenv from "dotenv"
dotenv.config()

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

 initSocketServer(server)

// generateResponse()

// Connect to database
connectDB();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});