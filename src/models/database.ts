import mongoose from "mongoose";

async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI!;
    const stage = process.env.STAGE!;

    await mongoose.connect(uri, {
      dbName: stage,
      autoIndex: stage === "dev",
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error);
  }
}

export default connectDatabase;
