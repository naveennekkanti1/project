import { connectDB } from "./_db.js";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const db = await connectDB();
  const { id } = req.query;

  const file = await db.collection("files").findOne({ _id: new ObjectId(id) });

  res.setHeader("Content-Disposition", `attachment; filename=${file.filename}`);
  res.send(file.data.buffer);
}
