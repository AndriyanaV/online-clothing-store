import express, { Request } from "express";
import { config } from "dotenv";
import { createServer } from "http";
import userRouter from "./routes/user";
import authRouter from "./routes/auth";
import categoryRouter from "./routes/category";
import connectDB from "./config/connection";
import path from "path";
import { UPLOADS_FIELD } from "./constants/uploads";
import { AccessLevel } from "./types/uploadFiles";
import productRouter from "./routes/product";
import dotenv from "dotenv";

dotenv.config();

// config();

const server = express();
const httpServer = createServer(server);

// Dodaj JSON parser middleware
server.use(express.json());
// server.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const staticFolderPath = path.join(__dirname, "uploads");
// Koristi express.static za serviranje statičkih datoteka
// server.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'))); radi

server.use(
  `/api/${UPLOADS_FIELD}`,
  express.static(path.join(__dirname, "..", UPLOADS_FIELD))
);

connectDB();

// server.use('api/user', userRouter);
server.use("/api/auth", authRouter);
server.use("/api/user", userRouter);
server.use("/api/category", categoryRouter);
server.use("/api/product", productRouter);

server.get("/", (req, res) => {
  res.send("Server is running");
});

const port = process.env.PORT || 5004;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
