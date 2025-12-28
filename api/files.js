import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

    const username = req.query.username; // pass ?username=admin

    if (!username) return res.status(400).json({ message: "Username missing" });

    const db = await connectDB();
    const files = await db.collection("files")
      .find({ username })
      .sort({ uploadedAt: -1 })
      .toArray();

    // Only return id, filename, date for frontend
    const response = files.map(f => ({
      id: f._id,
      filename: f.filename,
      uploadedAt: f.uploadedAt
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
