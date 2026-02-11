const express = require("express");
const { MongoClient, ObjectId, GridFSBucket } = require("mongodb");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// =======================
// Session setup
// =======================
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false
}));

// =======================
// MongoDB setup
// =======================
const uri = "mongodb+srv://durganaveen:nekkanti@cluster0.8nibi9x.mongodb.net/RAPACT?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const dbName = "fileDB";
const usersCollection = "users";

let gfsBucket;

// Connect once
async function connectDB() {
  await client.connect();
  const db = client.db(dbName);
  gfsBucket = new GridFSBucket(db, { bucketName: "uploads" });
  console.log("MongoDB connected + GridFS ready");
}

connectDB().catch(console.error);

// =======================
// Multer setup (500MB)
// =======================
const upload = multer({
  dest: "uploads_tmp/",
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
});

// =======================
// Auth middleware
// =======================
function isLoggedIn(req, res, next) {
  if (req.session.userId) return next();
  res.redirect("/login.html");
}

// =======================
// Signup
// =======================
app.post("/signup", async (req, res) => {
  try {
    const db = client.db(dbName);
    const users = db.collection(usersCollection);

    const { username, password } = req.body;
    const existing = await users.findOne({ username });
    if (existing) return res.send("Username already exists");

    const hashed = await bcrypt.hash(password, 10);
    await users.insertOne({ username, password: hashed });

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// =======================
// Login
// =======================
app.post("/login", async (req, res) => {
  try {
    const db = client.db(dbName);
    const users = db.collection(usersCollection);

    const { username, password } = req.body;
    const user = await users.findOne({ username });
    if (!user) return res.send("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid credentials");

    req.session.userId = user._id.toString();
    res.redirect("/dashboard.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});



app.post("/forgot-password", async (req, res) => {
  try {
    const { username, password } = req.body;

    const db = client.db(dbName);
    const users = db.collection(usersCollection);

    const user = await users.findOne({ username });
    if (!user) {
      return res.status(404).send("User not found");
    }

    const hashed = await bcrypt.hash(password, 10);

    await users.updateOne(
      { username },
      { $set: { password: hashed } }
    );

    res.send("Password reset successful");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});




// =======================
// Logout
// =======================
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// =======================
// Upload file (GridFS)
// =======================
app.post("/api/upload", isLoggedIn, upload.single("file"), async (req, res) => {
  try {
    const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
      metadata: {
        userId: req.session.userId,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      }
    });

    fs.createReadStream(req.file.path)
      .pipe(uploadStream)
      .on("error", err => {
        console.error(err);
        res.status(500).send("Upload failed");
      })
      .on("finish", () => {
        fs.unlinkSync(req.file.path); // cleanup temp file
        res.redirect("/dashboard.html");
      });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// =======================
// List user files
// =======================
app.get("/api/files", isLoggedIn, async (req, res) => {
  try {
    const files = await client
      .db(dbName)
      .collection("uploads.files")
      .find({ "metadata.userId": req.session.userId })
      .toArray();

    res.json(files.map(f => ({
      id: f._id,
      filename: f.filename,
      size: f.length,
      mimetype: f.metadata.mimetype,
      uploadedAt: f.metadata.uploadedAt
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Download file
// =======================
app.get("/api/files/download/:id", isLoggedIn, async (req, res) => {
  try {
    const file = await client
      .db(dbName)
      .collection("uploads.files")
      .findOne({
        _id: new ObjectId(req.params.id),
        "metadata.userId": req.session.userId
      });

    if (!file) return res.status(404).send("File not found");

    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("Content-Type", file.metadata.mimetype);

    gfsBucket.openDownloadStream(file._id).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// =======================
// Delete file
// =======================
app.delete("/api/files/delete/:id", isLoggedIn, async (req, res) => {
  try {
    const file = await client
      .db(dbName)
      .collection("uploads.files")
      .findOne({
        _id: new ObjectId(req.params.id),
        "metadata.userId": req.session.userId
      });

    if (!file) {
      return res.status(404).json({ error: "Not authorized or file not found" });
    }

    await gfsBucket.delete(file._id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =======================
// Multer error handler
// =======================
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).send("File size exceeds 500MB limit");
    }
  }
  res.status(500).send(err.message);
});

// =======================
// Start server
// =======================
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
