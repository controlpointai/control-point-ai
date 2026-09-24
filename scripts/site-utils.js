"use strict";
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const SITE_URL = String(process.env.SITE_URL || "https://controlpointai.org").replace(/\/+$/, "");
const SITE_ORIGIN = new URL(SITE_URL).origin;
const EXCLUDED_DIRS = new Set([".git", ".github", "admin", "build", "cloudflare", "content", "demo", "dist", "docs", "node_modules", "scripts", "tmp"]);

function walk(dir, predicate = () => true) {
  const entries = fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : [];
  return entries.flatMap((entry) => {
    if (EXCLUDED_DIRS.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, predicate);
    return entry.isFile() && predicate(full) ? [full] : [];
  });
}

function htmlFiles() {
  return walk(root, (file) => file.endsWith(".html"));
}

function canonicalPathForFile(file) {
  const rel = path.relative(root, file).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

function fileForCanonicalPath(canonicalPath) {
  if (canonicalPath === "/") return path.join(root, "index.html");
  if (canonicalPath.endsWith("/")) return path.join(root, canonicalPath.replace(/^\//, ""), "index.html");
  return path.join(root, canonicalPath.replace(/^\//, ""));
}

function stripQuotes(value) {
  return String(value || "").trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function parseFrontMatter(raw, file = "content file") {
  if (!String(raw).startsWith("---")) return { data: {}, body: String(raw || "") };
  const end = String(raw).indexOf("\n---", 3);
  if (end < 0) throw new Error(`${file} has malformed front matter`);
  const data = {};
  let currentKey = "";
  let currentMode = "scalar";
  String(raw).slice(3, end).trim().split(/\r?\n/).forEach((line) => {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      const [, key, rawValue] = keyMatch;
      const value = stripQuotes(rawValue);
      currentKey = key;
      currentMode = value ? "scalar" : "pending";
      data[key] = value;
      return;
    }
    if (!currentKey || !/^\s+/.test(line)) return;
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(stripQuotes(trimmed.slice(2)));
      currentMode = "list";
      return;
    }
    if (currentMode === "scalar" && !Array.isArray(data[currentKey])) {
      data[currentKey] = `${data[currentKey]} ${stripQuotes(trimmed)}`.trim();
    }
  });
  return { data, body: String(raw).slice(end + 4).trim() };
}

function listValue(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (!value) return [];
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function readJson(file, fallback = {}) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function changedDate(file) {
  if (!fs.existsSync(path.join(root, ".git")) || !fs.existsSync(file)) return "";
  try {
    const rel = path.relative(root, file).split(path.sep).join("/");
    const value = execFileSync("git", ["log", "-1", "--format=%cI", "--", rel], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  } catch (_error) {
    return "";
  }
}

function replaceGeneratedBlock(html, name, content, insertAt) {
  const start = `<!-- generated-${name}:start -->`;
  const end = `<!-- generated-${name}:end -->`;
  if (html.includes(start) && html.includes(end)) {
    const a = html.indexOf(start);
    const b = html.indexOf(end, a);
    if (b < a) throw new Error(`Malformed generated block: ${name}`);
    return `${html.slice(0, a)}${start}\n${content}\n${end}${html.slice(b + end.length)}`;
  }
  const index = insertAt(html);
  if (index < 0) throw new Error(`Could not insert generated block: ${name}`);
  return `${html.slice(0, index)}${start}\n${content}\n${end}\n${html.slice(index)}`;
}

function isNoindex(html) {
  const match = String(html).match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["'][^>]*>/i)
    || String(html).match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']robots["'][^>]*>/i);
  return Boolean(match && /\bnoindex\b/i.test(match[1]));
}

module.exports = {
  fs,
  path,
  root,
  SITE_URL,
  SITE_ORIGIN,
  walk,
  htmlFiles,
  canonicalPathForFile,
  fileForCanonicalPath,
  parseFrontMatter,
  listValue,
  escapeHtml,
  stripHtml,
  readJson,
  changedDate,
  replaceGeneratedBlock,
  isNoindex,
};
