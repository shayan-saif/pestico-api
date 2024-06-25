require("dotenv").config();
import express from "express";
import cookieParser from "cookie-parser";
import { auth, user } from "@/routes";
import connectDatabase from "./models/database";

const app = express();
if (process.env.NODE_ENV !== "test") {
  void connectDatabase();
}

app.use(express.json());
app.use(cookieParser());

app.use("/auth", auth);
app.use("/user", user);

export default app;
