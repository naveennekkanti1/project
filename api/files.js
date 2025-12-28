import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  try {
    const db = await connectDB(); // MUST await and assign

    const username = req.query.username;
    if (!username) return res.status(400).json({ message: "Username missing" });

    const files = await db.collection("files")
      .find({ username })
      .sort({ uploadedAt: -1 })
      .toArray();

    res.status(200).json(files.map(f => ({
      id: f._id,
      filename: f.filename,
      uploadedAt: f.uploadedAt
    })));
  } catch (err) {
    console.error("FILES API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
}
