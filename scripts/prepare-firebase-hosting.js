"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "dist");
const expectedOutput = path.resolve(root, "dist");

if (path.resolve(output) !== expectedOutput || path.dirname(output) !== root) {
  throw new Error(`Refusing to prepare unexpected output directory: ${output}`);
}

const publicFiles = ["index.html", "robots.txt", "sitemap.xml"];
const publicDirectories = [
  "admin",
  "assets",
  "case-studies",
  "contact",
  "demo",
  "insights",
  "mission",
  "services",
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const file of publicFiles) {
  const source = path.join(root, file);
  if (!fs.existsSync(source)) throw new Error(`Missing public file: ${file}`);
  fs.copyFileSync(source, path.join(output, file));
}

for (const directory of publicDirectories) {
  const source = path.join(root, directory);
  if (!fs.existsSync(source)) throw new Error(`Missing public directory: ${directory}`);
  fs.cpSync(source, path.join(output, directory), { recursive: true });
}

function countFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce(
    (count, entry) => count + (entry.isDirectory()
      ? countFiles(path.join(directory, entry.name))
      : 1),
    0,
  );
}

console.log(`Prepared ${countFiles(output)} public files in ${path.relative(root, output)}.`);
