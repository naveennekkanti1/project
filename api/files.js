import { connectDB } from "./_db.js";

export default async function handler(req, res) {
  const db = await connectDB();
  const files = await db.collection("files").find().toArray();
  res.json(files.map(f => f.filename));
}
