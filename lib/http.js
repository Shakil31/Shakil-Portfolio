function json(res, status, data, headers = {}) {
  res.statusCode = status;
  Object.entries({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(data, null, 2));
}

function text(res, status, body, headers = {}) {
  res.statusCode = status;
  Object.entries({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  }).forEach(([key, value]) => res.setHeader(key, value));
  res.end(body);
}

function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(JSON.stringify(req.body));
  }

  if (typeof req.body === "string") {
    return Promise.resolve(req.body);
  }

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

async function readJson(req) {
  const body = await readBody(req);
  return body ? JSON.parse(body) : {};
}

module.exports = {
  json,
  readJson,
  text,
};
