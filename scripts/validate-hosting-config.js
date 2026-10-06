"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8"));
const rules = config.hosting && Array.isArray(config.hosting.headers) ? config.hosting.headers : [];
const immediate = "public, max-age=0, must-revalidate";

function cacheValue(rule) {
  const header = (rule.headers || []).find(({ key }) => String(key).toLowerCase() === "cache-control");
  return header ? header.value : "";
}

function requireRule(field, pattern) {
  const rule = rules.find((candidate) => candidate[field] === pattern);
  if (!rule) throw new Error(`firebase.json is missing the ${field} cache rule for ${pattern}`);
  if (cacheValue(rule) !== immediate) {
    throw new Error(`${pattern} must use ${immediate}`);
  }
}

requireRule("source", "/");
requireRule("regex", "^/.*/$");
requireRule("source", "**/*.html");
requireRule("source", "**/*.@(css|js|json|xml|txt|yml|pdf)");

console.log("Firebase cache rules cover clean HTML routes and mutable site assets.");
