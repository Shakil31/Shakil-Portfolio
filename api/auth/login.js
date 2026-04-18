const { json, readJson } = require("../../lib/http");
const { createSessionCookie, publicUser, readUsers, verifyPassword } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { message: "Method not allowed." }, { Allow: "POST" });
    return;
  }

  try {
    const body = await readJson(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const users = await readUsers();
    const user = users.users.find((item) => item.username.toLowerCase() === username.toLowerCase());

    if (!user || !verifyPassword(password, user.passwordHash)) {
      json(res, 401, { message: "Invalid username or password." });
      return;
    }

    json(res, 200, { message: "Logged in.", user: publicUser(user) }, {
      "Set-Cookie": createSessionCookie(user.id),
    });
  } catch (error) {
    json(res, 400, { message: "Invalid login request." });
  }
};
