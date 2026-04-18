const crypto = require("crypto");
const { readJson, writeJson } = require("./store");

const SESSION_COOKIE = "portfolio_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN || "change-this-session-secret";

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [method, iterations, salt, hash] = String(storedHash || "").split("$");
  if (method !== "pbkdf2" || !iterations || !salt || !hash) return false;

  const nextHash = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256");
  const savedHash = Buffer.from(hash, "hex");
  return savedHash.length === nextHash.length && crypto.timingSafeEqual(savedHash, nextHash);
}

function defaultUsers() {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: crypto.randomUUID(),
        username: "admin",
        displayName: "Admin",
        passwordHash: hashPassword("admin12345"),
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

async function readUsers() {
  return readJson("users", "users.json", defaultUsers());
}

async function writeUsers(data) {
  return writeJson("users", "users.json", data);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
  };
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const index = cookie.indexOf("=");
        return [cookie.slice(0, index), decodeURIComponent(cookie.slice(index + 1))];
      })
  );
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function createSessionCookie(userId) {
  const payload = base64url(
    JSON.stringify({
      userId,
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    })
  );
  const token = `${payload}.${sign(payload)}`;
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

function readSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== sign(payload)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch (error) {
    return null;
  }
}

async function getCurrentUser(req) {
  const session = readSession(req);
  if (!session) return null;

  const users = await readUsers();
  return users.users.find((user) => user.id === session.userId) || null;
}

async function isAuthorized(req) {
  if (await getCurrentUser(req)) return true;
  return Boolean(process.env.ADMIN_TOKEN && req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN}`);
}

module.exports = {
  clearSessionCookie,
  createSessionCookie,
  getCurrentUser,
  hashPassword,
  isAuthorized,
  publicUser,
  readUsers,
  verifyPassword,
  writeUsers,
};
