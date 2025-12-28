import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  try {
    const db = await connectDB();

    const users = db.collection("users");

    const exists = await users.findOne({ username: "admin" });

    if (!exists) {
      await users.insertOne({
        username: "admin",
        password: "admin123"
      });
    }

    res.status(200).json({
      message: "Database initialized successfully"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
}
