const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const STORE_PREFIX = "portfolio-site";

function dataPath(fileName) {
  return path.join(DATA_DIR, fileName);
}

async function blobSdk() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  return import("@vercel/blob");
}

async function readBlobJson(name) {
  const sdk = await blobSdk();
  if (!sdk) return null;

  const pathname = `${STORE_PREFIX}/${name}.json`;
  const result = await sdk.list({
    prefix: pathname,
    limit: 1,
  });
  const blob = result.blobs.find((item) => item.pathname === pathname);

  if (!blob) return null;

  const response = await fetch(blob.url);
  if (!response.ok) return null;

  const text = await response.text();
  return JSON.parse(text);
}

async function writeBlobJson(name, data) {
  const sdk = await blobSdk();
  if (!sdk) return false;

  await sdk.put(`${STORE_PREFIX}/${name}.json`, JSON.stringify(data, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
  });
  return true;
}

function readLocalJson(fileName, fallback = null) {
  const filePath = dataPath(fileName);
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeLocalJson(fileName, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const filePath = dataPath(fileName);
  const tmpFile = `${filePath}.${crypto.randomUUID()}.tmp`;

  fs.writeFileSync(tmpFile, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(tmpFile, filePath);
}

async function readJson(name, fileName, fallback = null) {
  try {
    const blobData = await readBlobJson(name);
    if (blobData) return blobData;
  } catch (error) {
    console.error(`Could not read ${name} from Vercel Blob:`, error);
  }

  return readLocalJson(fileName, fallback);
}

async function writeJson(name, fileName, data) {
  if (await writeBlobJson(name, data)) return;

  try {
    writeLocalJson(fileName, data);
  } catch (error) {
    throw new Error("Persistent storage is not configured. Add Vercel Blob and set BLOB_READ_WRITE_TOKEN.");
  }
}

async function readPortfolio() {
  return readJson("portfolio", "portfolio.json", {});
}

async function writePortfolio(data) {
  return writeJson("portfolio", "portfolio.json", data);
}

module.exports = {
  dataPath,
  readJson,
  readPortfolio,
  writeJson,
  writePortfolio,
};
