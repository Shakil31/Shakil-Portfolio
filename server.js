const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const ROOT_WITH_SEPARATOR = ROOT.endsWith(path.sep) ? ROOT : `${ROOT}${path.sep}`;
const DATA_FILE = path.join(ROOT, "data", "portfolio.json");
const USERS_FILE = path.join(ROOT, "data", "users.json");
const SESSION_COOKIE = "portfolio_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const sessions = new Map();
const PUBLIC_EXTENSIONS = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".pdf", "application/pdf"],
  [".ico", "image/x-icon"],
]);

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

function send(res, status, body, type = "application/json; charset=utf-8", headers = {}) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data, null, 2), "application/json; charset=utf-8", headers);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function readPortfolio() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writePortfolio(data) {
  const next = JSON.stringify(data, null, 2);
  const tmpFile = `${DATA_FILE}.${crypto.randomUUID()}.tmp`;

  fs.writeFileSync(tmpFile, `${next}\n`);
  fs.renameSync(tmpFile, DATA_FILE);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [method, iterations, salt, hash] = storedHash.split("$");
  if (method !== "pbkdf2" || !iterations || !salt || !hash) return false;

  const nextHash = crypto.pbkdf2Sync(password, salt, Number(iterations), 32, "sha256");
  const savedHash = Buffer.from(hash, "hex");

  return savedHash.length === nextHash.length && crypto.timingSafeEqual(savedHash, nextHash);
}

function writeUsers(data) {
  const next = JSON.stringify(data, null, 2);
  const tmpFile = `${USERS_FILE}.${crypto.randomUUID()}.tmp`;

  fs.writeFileSync(tmpFile, `${next}\n`);
  fs.renameSync(tmpFile, USERS_FILE);
}

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const now = new Date().toISOString();
    writeUsers({
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
    });
  }

  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
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

function sessionCookie(value, maxAge = SESSION_MAX_AGE_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return null;

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

function getCurrentUser(req) {
  const session = getSession(req);
  if (!session) return null;

  const users = readUsers();
  return users.users.find((user) => user.id === session.userId) || null;
}

function isAuthorized(req) {
  if (getCurrentUser(req)) return true;
  return Boolean(ADMIN_TOKEN && req.headers.authorization === `Bearer ${ADMIN_TOKEN}`);
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const requestedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const filePath = path.normalize(path.join(ROOT, requestedPath));

  if (requestedPath.startsWith("/data/")) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  if (requestedPath === "/admin.html" && !getCurrentUser(req)) {
    send(res, 302, "", "text/plain; charset=utf-8", { Location: "/login.html" });
    return;
  }

  if (requestedPath === "/login.html" && getCurrentUser(req)) {
    send(res, 302, "", "text/plain; charset=utf-8", { Location: "/admin.html" });
    return;
  }

  if (filePath !== ROOT && !filePath.startsWith(ROOT_WITH_SEPARATOR)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(res, 404, "Not found", "text/plain; charset=utf-8");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const type = PUBLIC_EXTENSIONS.get(extension) || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const user = getCurrentUser(req);
    if (!user) {
      sendJson(res, 401, { message: "Not logged in." });
      return;
    }

    sendJson(res, 200, { user: publicUser(user) });
    return;
  }

  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const users = readUsers();
      const user = users.users.find((item) => item.username.toLowerCase() === username.toLowerCase());

      if (!user || !verifyPassword(password, user.passwordHash)) {
        sendJson(res, 401, { message: "Invalid username or password." });
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, {
        userId: user.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      });

      sendJson(res, 200, { message: "Logged in.", user: publicUser(user) }, {
        "Set-Cookie": sessionCookie(token),
      });
    } catch (error) {
      sendJson(res, 400, { message: "Invalid login request." });
    }
    return;
  }

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (token) sessions.delete(token);
    sendJson(res, 200, { message: "Logged out." }, {
      "Set-Cookie": sessionCookie("", 0),
    });
    return;
  }

  if (url.pathname === "/api/auth/profile" && req.method === "PUT") {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      sendJson(res, 401, { message: "Please log in first." });
      return;
    }

    try {
      const body = JSON.parse(await readBody(req));
      const displayName = String(body.displayName || "").trim();

      if (!displayName) {
        sendJson(res, 400, { message: "Display name is required." });
        return;
      }

      const users = readUsers();
      const user = users.users.find((item) => item.id === currentUser.id);
      user.displayName = displayName;
      user.updatedAt = new Date().toISOString();
      writeUsers(users);

      sendJson(res, 200, { message: "Profile updated.", user: publicUser(user) });
    } catch (error) {
      sendJson(res, 400, { message: "Invalid profile request." });
    }
    return;
  }

  if (url.pathname === "/api/auth/password" && req.method === "PUT") {
    const currentUser = getCurrentUser(req);
    if (!currentUser) {
      sendJson(res, 401, { message: "Please log in first." });
      return;
    }

    try {
      const body = JSON.parse(await readBody(req));
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");

      if (newPassword.length < 8) {
        sendJson(res, 400, { message: "New password must be at least 8 characters." });
        return;
      }

      if (!verifyPassword(currentPassword, currentUser.passwordHash)) {
        sendJson(res, 401, { message: "Current password is incorrect." });
        return;
      }

      const users = readUsers();
      const user = users.users.find((item) => item.id === currentUser.id);
      user.passwordHash = hashPassword(newPassword);
      user.updatedAt = new Date().toISOString();
      writeUsers(users);

      sendJson(res, 200, { message: "Password changed." });
    } catch (error) {
      sendJson(res, 400, { message: "Invalid password request." });
    }
    return;
  }

  if (url.pathname === "/api/portfolio" && req.method === "GET") {
    sendJson(res, 200, readPortfolio());
    return;
  }

  if (url.pathname === "/api/portfolio" && req.method === "PUT") {
    if (!isAuthorized(req)) {
      sendJson(res, 401, { message: "Please log in to save changes." });
      return;
    }

    try {
      const body = await readBody(req);
      const data = JSON.parse(body);

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        sendJson(res, 400, { message: "Portfolio payload must be an object." });
        return;
      }

      writePortfolio(data);
      sendJson(res, 200, { message: "Portfolio saved.", data });
    } catch (error) {
      sendJson(res, 400, { message: error.message || "Invalid portfolio JSON." });
    }
    return;
  }

  sendJson(res, 404, { message: "API route not found." });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  const users = readUsers();
  const admin = users.users.find((user) => user.username === "admin");

  console.log(`Portfolio site: http://localhost:${PORT}`);
  console.log(`Admin panel:    http://localhost:${PORT}/admin.html`);
  if (admin && verifyPassword("admin12345", admin.passwordHash)) {
    console.log("Default login: admin / admin12345");
    console.log("Change the default password from the admin Profile section.");
  } else {
    console.log("Use your saved admin profile to log in.");
  }
});
