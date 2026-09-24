"use strict";
const crypto = require("crypto");
const { fs, path, root, walk } = require("./site-utils");

const imageRoot = path.join(root, "assets", "images");
const warningThreshold = Number(process.env.ASSET_WARN_BYTES || 500 * 1024);
const extensions = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"]);
const files = walk(imageRoot, (file) => extensions.has(path.extname(file).toLowerCase()));
const assets = files.map((file) => {
  const bytes = fs.statSync(file).size;
  const hash = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  return {
    path: path.relative(root, file).split(path.sep).join("/"),
    bytes,
    kilobytes: Math.round(bytes / 102.4) / 10,
    sha256: hash,
  };
}).sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));

const byHash = new Map();
for (const asset of assets) {
  if (!byHash.has(asset.sha256)) byHash.set(asset.sha256, []);
  byHash.get(asset.sha256).push(asset.path);
}
const duplicateGroups = [...byHash.entries()]
  .filter(([, paths]) => paths.length > 1)
  .map(([sha256, paths]) => ({ sha256, paths }))
  .sort((a, b) => b.paths.length - a.paths.length || a.paths[0].localeCompare(b.paths[0]));
const largeAssets = assets.filter((asset) => asset.bytes >= warningThreshold);
const report = {
  generatedAt: new Date().toISOString(),
  warningThresholdBytes: warningThreshold,
  assetCount: assets.length,
  totalBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
  largeAssets,
  duplicateGroups,
};

const output = path.join(root, "tmp", "asset-audit.json");
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Asset audit: ${assets.length} images; ${largeAssets.length} at or above ${Math.round(warningThreshold / 1024)} KB; ${duplicateGroups.length} exact duplicate group(s).`);
for (const asset of largeAssets.slice(0, 12)) console.warn(`  Large image: ${asset.path} (${asset.kilobytes} KB)`);
if (largeAssets.length > 12) console.warn(`  ...and ${largeAssets.length - 12} more large images. See tmp/asset-audit.json.`);
for (const group of duplicateGroups.slice(0, 8)) console.warn(`  Exact duplicates: ${group.paths.join(" | ")}`);
if (duplicateGroups.length > 8) console.warn(`  ...and ${duplicateGroups.length - 8} more duplicate groups. See tmp/asset-audit.json.`);
