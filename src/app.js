import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import Authrouter from "./routes/auth.routes.js";
import { chatRouter } from './routes/chat.routes.js';
import cors from "cors"
import morgan from 'morgan';
import path from "path"
import { fileURLToPath } from "url"


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(cors({
    origin:"https://flash-zzqe.onrender.com",
    credentials:true,
    methods:["GET","POST","PUT","DELETE"]
}))




// Routes
app.use('/api/auth', Authrouter);
app.use('/api/chats', chatRouter);

app.use(express.static(path.join(__dirname, "../public")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});




//

export default app;