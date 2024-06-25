import app from "./app";
import serverless from "serverless-http";

if (process.env.STAGE === "dev") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}

export const handler = serverless(app);
