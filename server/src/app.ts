import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./app/routes/routes";
import errorHandler from "./app/middlewares/errorHandler";

dotenv.config();

const app: Application = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

const corsOptions = {
  origin:         allowedOrigins,
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "authorization"],
};

// Apply CORS first — before anything else including error handlers
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "NBSC SAS Records Log API is running." });
});

app.use("/api", router);

// Error handler — must also send CORS headers so the frontend can read the error
app.use((err: any, req: Request, res: Response, next: any) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  errorHandler(err, req, res, next);
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, statusCode: 404, message: "Route not found." });
});

export default app;