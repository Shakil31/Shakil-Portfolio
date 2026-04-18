const { json } = require("../../lib/http");
const { clearSessionCookie } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { message: "Method not allowed." }, { Allow: "POST" });
    return;
  }

  json(res, 200, { message: "Logged out." }, {
    "Set-Cookie": clearSessionCookie(),
  });
};
