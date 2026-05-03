const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const crypto = require("crypto");
const prisma = require("../db");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "website-32bb7",
  });
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "riselab-super-secret-key";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: "Registration failed", details: error.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    if (!user.passwordHash) {
      return res.status(401).json({ error: "Please sign in using your social account (Google/GitHub)." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// POST /api/auth/social
// Handles Google/GitHub login by verifying Firebase ID Token
router.post("/social", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Firebase ID Token is required" });
  }

  try {
    // 1. Verify the Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: "No email returned by social provider." });
    }

    // 2. Find or Create the user in our DB
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Keep passwordHash populated to satisfy current required schema for social-only accounts.
      const socialPasswordHash = await bcrypt.hash(`social:${uid}:${crypto.randomUUID()}`, 10);
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          passwordHash: socialPasswordHash,
        },
      });
    }

    // 3. Issue our own JWT for session management
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      message: "Social login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: picture,
      },
    });
  } catch (error) {
    console.error("Social Auth Error:", error);
    const code = typeof error?.code === "string" ? error.code : "";
    const status = code.startsWith("auth/") ? 401 : 500;
    res.status(status).json({
      error: "Social authentication failed",
      details: error.message,
    });
  }
});

module.exports = router;
