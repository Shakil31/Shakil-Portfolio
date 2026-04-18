const { json, readJson } = require("../../lib/http");
const { getCurrentUser, hashPassword, readUsers, verifyPassword, writeUsers } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "PUT") {
    json(res, 405, { message: "Method not allowed." }, { Allow: "PUT" });
    return;
  }

  const currentUser = await getCurrentUser(req);
  if (!currentUser) {
    json(res, 401, { message: "Please log in first." });
    return;
  }

  try {
    const body = await readJson(req);
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (newPassword.length < 8) {
      json(res, 400, { message: "New password must be at least 8 characters." });
      return;
    }

    if (!verifyPassword(currentPassword, currentUser.passwordHash)) {
      json(res, 401, { message: "Current password is incorrect." });
      return;
    }

    const users = await readUsers();
    const user = users.users.find((item) => item.id === currentUser.id);
    user.passwordHash = hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();
    await writeUsers(users);

    json(res, 200, { message: "Password changed." });
  } catch (error) {
    json(res, 400, { message: error.message || "Invalid password request." });
  }
};
