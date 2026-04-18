const { json } = require("../../lib/http");
const { getCurrentUser, publicUser } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    json(res, 405, { message: "Method not allowed." }, { Allow: "GET" });
    return;
  }

  const user = await getCurrentUser(req);
  if (!user) {
    json(res, 401, { message: "Not logged in." });
    return;
  }

  json(res, 200, { user: publicUser(user) });
};
