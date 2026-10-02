import mongoose from "mongoose";

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const cached = globalForMongoose.mongoose || {
  conn: null,
  promise: null,
};

globalForMongoose.mongoose = cached;

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Check .env.local at the project root");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.conn = await cached.promise;

    console.log("MongoDB connected successfully");

    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}