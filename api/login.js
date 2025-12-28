import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { username, password } = JSON.parse(req.body);
    const db = await connectDB();

    const user = await db.collection("users").findOne({
      username,
      password
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
