import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const body = JSON.parse(req.body);
  const { username, password } = body;

  const db = await connectDB();

  const user = await db.collection("users").findOne({
    username: username,
    password: password
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.status(200).json({ message: "Login success" });
}
