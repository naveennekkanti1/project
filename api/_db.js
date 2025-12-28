import { MongoClient } from "mongodb";

const uri = "mongodb+srv://durganaveen:nekkanti@cluster0.8nibi9x.mongodb.net/fileAPP";

let client;
let db;

export async function connectDB() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db("fileApp");

    // 🔹 Auto-create default user if not exists
    const users = db.collection("users");

    const adminExists = await users.findOne({ username: "admin" });

    if (!adminExists) {
      await users.insertOne({
        username: "admin",
        password: "admin123"
      });
      console.log("✅ Default admin user created");
    }
  }
  return db;
}
