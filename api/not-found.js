const { text } = require("../lib/http");

module.exports = function handler(req, res) {
  text(res, 403, "Forbidden");
};
