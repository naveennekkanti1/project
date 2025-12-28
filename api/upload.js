import formidable from "formidable";
import fs from "fs";
import path from "path";
import { connectDB } from "./_db.js";

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  const db = await connectDB();

  form.parse(req, async (err, fields, files) => {
    const file = files.file;
    const data = fs.readFileSync(file.filepath);

    await db.collection("files").insertOne({
      filename: file.originalFilename,
      data
    });

    res.json({ message: "Uploaded" });
  });
}
