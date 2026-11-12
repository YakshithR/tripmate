require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const studentRoutes = require("./routes/students");
const tripRoutes = require("./routes/trips");

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3000);

if (!process.env.SESSION_SECRET || !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  throw new Error("SESSION_SECRET, ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env");
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "tripmate.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 2 * 60 * 60 * 1000
  }
}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (_error) {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid username or password." });
  }
  req.session.isAdmin = true;
  return res.json({ message: "Login successful." });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("tripmate.sid");
    res.json({ message: "Logged out." });
  });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ authenticated: req.session.isAdmin === true });
});

app.use("/api/students", studentRoutes);
app.use("/api/trips", tripRoutes);

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`TripMate running on port ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
