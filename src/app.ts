require("dotenv").config();
import express from "express";
import cookieParser from "cookie-parser";
import serverless from "serverless-http";
import auth from "./routes/auth";
import { verifyToken } from "./middleware";
import connectDatabase from "./models/database";

const app = express();
void connectDatabase();

app.use(express.json());
app.use(cookieParser());

app.use("/auth", auth);
app.get("/protected", verifyToken, (req, res) => {
  return res.json({ message: "This is a protected route", user: req.user });
});

if (process.env.STAGE === "dev") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

export const handler = serverless(app);
