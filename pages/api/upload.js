import fs from "fs";
import path from "path";
import { IncomingForm } from "formidable";

export const config = {
  api: { bodyParser: false },
};

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  const form = new IncomingForm({
    uploadDir: UPLOAD_DIR,
    keepExtensions: true,
    filename: (name, ext) => `${Date.now()}-${name}${ext}`,
  });

  return new Promise((resolve) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: "Upload failed" });
        return resolve();
      }

      const file = files.file;
      if (!file) {
        res.status(400).json({ error: "No file provided" });
        return resolve();
      }

      const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;
      const fileName = path.basename(filePath);
      const url = `/uploads/${fileName}`;

      res.status(200).json({ url });
      resolve();
    });
  });
}
