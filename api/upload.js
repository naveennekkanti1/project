import formidable from "formidable";
import fs from "fs";
import { connectDB } from "./_db.js";

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const buffer = fs.readFileSync(file[0].filepath);

      const db = await connectDB();
      await db.collection("files").insertOne({
        filename: file[0].originalFilename,
        data: buffer,
        uploadedAt: new Date()
      });

      return res.status(200).json({ message: "File uploaded successfully" });
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
