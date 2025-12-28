import { MongoClient } from "mongodb";

const uri = "mongodb+srv://durganaveen:nekkanti@cluster0.8nibi9x.mongodb.net/fileApp?retryWrites=true&w=majority&appName=Cluster0";

let client;
let db;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("fileApp");
  }
  return db;
}
