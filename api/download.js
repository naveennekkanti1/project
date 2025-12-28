import { connectDB } from "./_db.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ message: "File ID missing" });

    const db = await connectDB();
    const file = await db.collection("files").findOne({ _id: new ObjectId(id) });

    if (!file) return res.status(404).json({ message: "File not found" });

    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(file.data.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
