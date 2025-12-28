import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;

export default async function handler(req, res) {
  try {
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db("fileApp");
    const users = db.collection("users");

    const exists = await users.findOne({ username: "admin" });

    if (!exists) {
      await users.insertOne({
        username: "admin",
        password: "admin123"
      });
    }

    await client.close();

    res.status(200).json({
      message: "Database & user initialized successfully"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
