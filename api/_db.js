import { MongoClient } from "mongodb";

const uri = "mongodb+srv://durganaveen:nekkanti@cluster0.8nibi9x.mongodb.net/fileapp?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

export async function connectDB() {
  if (!client.topology?.isConnected()) {
    await client.connect();
  }
  return client.db("fileApp");
}
