"use strict";
const {
  fs, path, root, SITE_URL, htmlFiles, canonicalPathForFile, parseFrontMatter,
  readJson, changedDate, isNoindex,
} = require("./site-utils");

const manifest = readJson(path.join(root, "tmp", "insights-manifest.json"), []);
const insightDates = Object.fromEntries(manifest.map((item) => [item.url, item.updatedDate || item.publishDate || ""]));
const caseSources = {};
const caseDir = path.join(root, "content", "case-studies");
if (fs.existsSync(caseDir)) {
  for (const name of fs.readdirSync(caseDir).filter((file) => file.endsWith(".md") && !file.startsWith("_"))) {
    const file = path.join(caseDir, name);
    const parsed = parseFrontMatter(fs.readFileSync(file, "utf8"), name);
    const livePath = String(parsed.data.live_path || "").replace(/^\/+|\/+$/g, "");
    if (livePath) caseSources[`/case-studies/${livePath}/`] = { file, date: parsed.data.updated_date || parsed.data.publish_date || "" };
  }
}
function dateOnly(value) {
  const match = String(value || "").match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}
function canonicalFrom(html) {
  const match = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return match ? match[1] : "";
}
function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
const entries = [];
for (const file of htmlFiles()) {
  const html = fs.readFileSync(file, "utf8");
  if (isNoindex(html)) continue;
  const canonicalPath = canonicalPathForFile(file);
  const canonical = canonicalFrom(html);
  if (!canonical || canonical !== `${SITE_URL}${canonicalPath}`) continue;
  let date = insightDates[canonicalPath] || "";
  if (!date && caseSources[canonicalPath]) date = caseSources[canonicalPath].date || changedDate(caseSources[canonicalPath].file);
  if (!date) date = changedDate(file);
  entries.push({ canonical, path: canonicalPath, lastmod: dateOnly(date) });
}
entries.sort((a, b) => a.path === "/" ? -1 : b.path === "/" ? 1 : a.path.localeCompare(b.path));
const seen = new Set();
for (const entry of entries) {
  if (seen.has(entry.canonical)) throw new Error(`Duplicate sitemap canonical: ${entry.canonical}`);
  seen.add(entry.canonical);
}
const body = entries.map((entry) => [
  "  <url>",
  `    <loc>${escapeXml(entry.canonical)}</loc>`,
  entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : "",
  "  </url>",
].filter(Boolean).join("\n")).join("\n");
fs.writeFileSync(path.join(root, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
console.log(`Generated sitemap.xml from ${entries.length} canonical, indexable HTML pages.`);
