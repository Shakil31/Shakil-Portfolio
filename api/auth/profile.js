const { json, readJson } = require("../../lib/http");
const { getCurrentUser, publicUser, readUsers, writeUsers } = require("../../lib/auth");

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
    const displayName = String(body.displayName || "").trim();

    if (!displayName) {
      json(res, 400, { message: "Display name is required." });
      return;
    }

    const users = await readUsers();
    const user = users.users.find((item) => item.id === currentUser.id);
    user.displayName = displayName;
    user.updatedAt = new Date().toISOString();
    await writeUsers(users);

    json(res, 200, { message: "Profile updated.", user: publicUser(user) });
  } catch (error) {
    json(res, 400, { message: error.message || "Invalid profile request." });
  }
};
