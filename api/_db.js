import { MongoClient } from "mongodb";

let client;
let db;

export async function connectDB() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not defined");
  }

  if (!client) {
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    db = client.db("fileApp");
  }

  return db;
}
