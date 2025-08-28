import mongoose from 'mongoose';

//function to connect to the database
export const connectDB = async () => {
  try {
    //connect to the database using the URI from environment variables
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    console.error("Make sure MONGODB_URI is set in your .env file");
    process.exit(1); // Exit the process with failure
  }
}