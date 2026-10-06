"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const config = fs.readFileSync(path.join(root, "admin", "config.yml"), "utf8");
const admin = fs.readFileSync(path.join(root, "admin", "index.html"), "utf8");

function ok(value, message) {
  if (!value) throw new Error(message);
}

function collectionBlock(name) {
  const start = config.indexOf(`  - name: "${name}"`);
  ok(start !== -1, `CMS collection is missing: ${name}`);
  const next = config.indexOf("\n  - name: ", start + 1);
  return config.slice(start, next === -1 ? config.length : next);
}

function unquote(value) {
  return String(value || "").trim().replace(/^(["'])(.*)\1$/, "$2");
}

function validateMediaReferences(directory, fields) {
  const contentDirectory = path.join(root, directory);
  for (const file of fs.readdirSync(contentDirectory).filter((name) => name.endsWith(".md"))) {
    const contents = fs.readFileSync(path.join(contentDirectory, file), "utf8");
    for (const field of fields) {
      const match = contents.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
      const value = match ? unquote(match[1]) : "";
      if (!value || !value.startsWith("/")) continue;
      const mediaPath = path.join(root, ...value.split("/").filter(Boolean).map(decodeURIComponent));
      ok(fs.existsSync(mediaPath), `CMS media reference is missing: ${directory}/${file} -> ${value}`);
      ok(fs.statSync(mediaPath).size > 0, `CMS media reference is empty: ${directory}/${file} -> ${value}`);
    }
  }
}

const insights = collectionBlock("insights");
const caseStudies = collectionBlock("case_studies");

ok(/media_folder:\s*["']assets\/images\/uploads["']/.test(config), "CMS media folder changed unexpectedly");
ok(/public_folder:\s*["']\/assets\/images\/uploads["']/.test(config), "CMS public media folder changed unexpectedly");
ok(/site_url:\s*["']https:\/\/controlpointai\.org["']/.test(config), "CMS site URL must use the production domain");
ok(/\n\s+delete:\s+false\b/.test(insights), "Insight deletion must stay disabled in the CMS");
ok(/name:\s*["']insights_tab_visibility["']/.test(insights), "Insight tab visibility control is missing from the CMS");
ok(/\n\s+delete:\s+false\b/.test(caseStudies), "Case-study deletion must stay disabled in the CMS");
ok(admin.includes('CMS.registerPreviewTemplate("insights", insightPreview)'), "Insight preview template is not registered");
ok(admin.includes("props.getAsset(imagePath)"), "Insight preview must use Decap's in-memory uploaded asset");

validateMediaReferences(path.join("content", "insights"), ["image"]);
validateMediaReferences(path.join("content", "case-studies"), ["card_image"]);

console.log("Validated CMS upload paths, in-editor image preview, protected collections, and content media references.");
