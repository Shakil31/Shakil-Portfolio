const { json, readJson } = require("../lib/http");
const { isAuthorized } = require("../lib/auth");
const { readPortfolio, writePortfolio } = require("../lib/store");

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    json(res, 200, await readPortfolio());
    return;
  }

  if (req.method === "PUT") {
    if (!(await isAuthorized(req))) {
      json(res, 401, { message: "Please log in to save changes." });
      return;
    }

    const body = await readJson(req);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      json(res, 400, { message: "Portfolio payload must be an object." });
      return;
    }

    await writePortfolio(body);
    json(res, 200, { message: "Portfolio saved.", data: body });
    return;
  }

  json(res, 405, { message: "Method not allowed." }, { Allow: "GET, PUT" });
};
