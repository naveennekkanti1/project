import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  const db = await connectDB();
  const { username, password } = JSON.parse(req.body);

  const user = await db.collection("users").findOne({ username, password });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.status(200).json({ message: "success" });
}
