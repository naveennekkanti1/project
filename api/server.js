const express = require("express");
const { MongoClient, ObjectId, Binary } = require("mongodb");
const multer = require("multer");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session setup
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true
}));

// MongoDB setup
const uri = "mongodb+srv://durganaveen:nekkanti@cluster0.8nibi9x.mongodb.net/RAPACT?retryWrites=true&w=majority";
const client = new MongoClient(uri);
const dbName = "fileDB";
const usersCollection = "users";
const filesCollection = "files";

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to check login
function isLoggedIn(req, res, next) {
  if (req.session.userId) next();
  else res.redirect("/login.html");
}

// Signup
app.post("/signup", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(usersCollection);

    const { username, password } = req.body;
    const existing = await users.findOne({ username });
    if (existing) return res.send("Username already exists");

    const hashed = await bcrypt.hash(password, 10);
    await users.insertOne({ username, password: hashed });

    res.redirect("/login.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection(usersCollection);

    const { username, password } = req.body;
    const user = await users.findOne({ username });
    if (!user) return res.send("Invalid username or password");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send("Invalid username or password");

    req.session.userId = user._id.toString(); // store as string
    res.redirect("/dashboard.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login.html");
});

// Upload file
app.post("/api/upload", isLoggedIn, upload.single("file"), async (req, res) => {
  try {
    const db = client.db(dbName);
    const files = db.collection(filesCollection);

    const file = {
      filename: req.file.originalname,
      data: new Binary(req.file.buffer),
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      userId: req.session.userId
    };

    await files.insertOne(file);
    res.redirect("/dashboard.html");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Get all files of logged-in user
app.get("/api/files", isLoggedIn, async (req, res) => {
  try {
    const db = client.db(dbName);
    const files = db.collection(filesCollection);

    const userFiles = await files.find({ userId: req.session.userId }).toArray();
    res.json(userFiles.map(f => ({
      id: f._id,
      filename: f.filename,
      mimetype: f.mimetype.toLowerCase(), // ensure lowercase
      uploadedAt: f.uploadedAt
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Get text content of a file
app.get("/api/files/content/:id", isLoggedIn, async (req, res) => {
  try {
    const db = client.db(dbName);
    const files = db.collection(filesCollection);

    const file = await files.findOne({
      _id: new ObjectId(req.params.id),
      userId: req.session.userId
    });

    if (!file) return res.status(404).json({ error: "File not found" });

    // Support both Binary and Buffer
    let content;
    if (file.data instanceof Buffer) {
      content = file.data.toString('utf-8');
    } else if (file.data.buffer instanceof Buffer) {
      content = file.data.buffer.toString('utf-8');
    } else {
      content = Buffer.from(file.data).toString('utf-8');
    }

    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Update file
app.post("/api/files/update/:id", isLoggedIn, upload.single("file"), async (req, res) => {
  try {
    const db = client.db(dbName);
    const files = db.collection(filesCollection);

    const updatedFile = {
      filename: req.file.originalname,
      data: new Binary(req.file.buffer),
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };

    const result = await files.updateOne(
      { _id: new ObjectId(req.params.id), userId: req.session.userId },
      { $set: updatedFile }
    );

    if (result.matchedCount === 0) return res.status(404).send("File not found or not authorized");

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Download file
app.get("/api/files/download/:id", isLoggedIn, async (req, res) => {
  try {
    const db = client.db(dbName);
    const files = db.collection(filesCollection);

    const file = await files.findOne({
      _id: new ObjectId(req.params.id),
      userId: req.session.userId
    });
    if (!file) return res.status(404).send("File not found");

    res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.setHeader("Content-Type", file.mimetype);
    res.send(file.data.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
