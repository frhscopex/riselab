const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const crypto = require("crypto");
const prisma = require("../db");
const { getTrimmedString, sendError } = require("../utils/http");

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "website-32bb7",
  });
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "riselab-super-secret-key";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  return getTrimmedString(value).toLowerCase();
}

function buildAuthResponse(message, user, token) {
  return {
    message,
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

function signUserToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = getTrimmedString(req.body?.password);
  const name = getTrimmedString(req.body?.name) || null;

  if (!email || !password) {
    return sendError(res, {
      status: 400,
      error: "Email and password are required.",
      code: "AUTH_REQUIRED_FIELDS",
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return sendError(res, {
      status: 400,
      error: "Please provide a valid email address.",
      code: "AUTH_EMAIL_INVALID",
    });
  }

  if (password.length < 8) {
    return sendError(res, {
      status: 400,
      error: "Password must be at least 8 characters.",
      code: "AUTH_PASSWORD_WEAK",
      hint: "Use a longer password with letters, numbers, and symbols.",
    });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, {
        status: 409,
        error: "User already exists.",
        code: "AUTH_USER_EXISTS",
        hint: "Try logging in instead.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    const token = signUserToken(user.id);
    return res.status(201).json(buildAuthResponse("User registered successfully", user, token));
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Registration failed.",
      code: "AUTH_REGISTER_FAILED",
      details: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = getTrimmedString(req.body?.password);

  if (!email || !password) {
    return sendError(res, {
      status: 400,
      error: "Email and password are required.",
      code: "AUTH_REQUIRED_FIELDS",
    });
  }

  if (!EMAIL_REGEX.test(email)) {
    return sendError(res, {
      status: 400,
      error: "Please provide a valid email address.",
      code: "AUTH_EMAIL_INVALID",
    });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return sendError(res, {
        status: 401,
        error: "Invalid credentials.",
        code: "AUTH_INVALID_CREDENTIALS",
      });
    }

    if (!user.passwordHash) {
      return sendError(res, {
        status: 400,
        error: "Password login is unavailable for this account.",
        code: "AUTH_PASSWORD_LOGIN_UNAVAILABLE",
        hint: "Use your social sign-in provider.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return sendError(res, {
        status: 401,
        error: "Invalid credentials.",
        code: "AUTH_INVALID_CREDENTIALS",
      });
    }

    const token = signUserToken(user.id);
    return res.status(200).json(buildAuthResponse("Login successful", user, token));
  } catch (error) {
    return sendError(res, {
      status: 500,
      error: "Login failed.",
      code: "AUTH_LOGIN_FAILED",
      details: error.message,
    });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, {
      status: 401,
      error: "Bearer token is required.",
      code: "AUTH_REQUIRED",
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return sendError(res, {
      status: 401,
      error: "Bearer token is required.",
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
      return sendError(res, {
        status: 404,
        error: "User not found.",
        code: "AUTH_USER_NOT_FOUND",
      });
    }

    return res.status(200).json({ user });
  } catch (_error) {
    return sendError(res, {
      status: 401,
      error: "Invalid or expired token.",
      code: "AUTH_TOKEN_INVALID",
    });
  }
});

router.post("/social", async (req, res) => {
  const idToken = getTrimmedString(req.body?.idToken);

  if (!idToken) {
    return sendError(res, {
      status: 400,
      error: "Firebase ID token is required.",
      code: "AUTH_ID_TOKEN_REQUIRED",
    });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = normalizeEmail(decodedToken.email);
    const name = getTrimmedString(decodedToken.name);
    const uid = getTrimmedString(decodedToken.uid);

    if (!email) {
      return sendError(res, {
        status: 400,
        error: "No email returned by social provider.",
        code: "AUTH_SOCIAL_EMAIL_MISSING",
      });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const socialPasswordHash = await bcrypt.hash(
        `social:${uid}:${crypto.randomUUID()}`,
        10
      );

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          passwordHash: socialPasswordHash,
        },
      });
    }

    const token = signUserToken(user.id);

    return res.status(200).json({
      message: "Social login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: decodedToken.picture,
      },
    });
  } catch (error) {
    console.error("Social Auth Error:", error);
    const code = typeof error?.code === "string" ? error.code : "";
    const status = code.startsWith("auth/") ? 401 : 500;

    return sendError(res, {
      status,
      error:
        status === 401
          ? "Invalid social authentication token."
          : "Social authentication failed.",
      code: status === 401 ? "AUTH_SOCIAL_TOKEN_INVALID" : "AUTH_SOCIAL_FAILED",
      details: error.message,
    });
  }
});

router.use((_req, res) =>
  sendError(res, {
    status: 404,
    error: "Auth endpoint not found.",
    code: "AUTH_ROUTE_NOT_FOUND",
  })
);

module.exports = router;
