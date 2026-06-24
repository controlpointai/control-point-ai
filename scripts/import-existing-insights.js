const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const siteScript = fs.readFileSync(path.join(root, "assets", "scripts", "site.js"), "utf8");
const newsletterScript = fs.readFileSync(
  path.join(root, "assets", "scripts", "newsletter-content.js"),
  "utf8"
);

function extractArraySource(source, name) {
  const start = source.indexOf(`const ${name} = [`);
  if (start === -1) throw new Error(`Could not find ${name}`);

  let index = source.indexOf("[", start);
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return source.slice(source.indexOf("[", start), index + 1);
  }

  throw new Error(`Could not parse ${name}`);
}

function extractObjectSource(source, name) {
  const start = source.indexOf(`const ${name} = {`);
  if (start === -1) throw new Error(`Could not find ${name}`);
  const objectStart = source.indexOf("{", start);
  const end = source.lastIndexOf("};");
  return source.slice(objectStart, end + 1);
}

function yamlValue(value) {
  return `"${String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

const context = {};
vm.createContext(context);
vm.runInContext(`tracks = ${extractArraySource(siteScript, "insightTracks")};`, context);
vm.runInContext(`bodies = ${extractObjectSource(newsletterScript, "newsletterBodies")};`, context);

const postsDir = path.join(root, "content", "insights");
fs.mkdirSync(postsDir, { recursive: true });

context.tracks.forEach((item) => {
  const body = context.bodies[item.id] || item.sections.map((section) => {
    return `## ${section.heading}\n\n${section.body}`;
  }).join("\n\n");

  const frontMatter = [
    "---",
    `id: ${yamlValue(item.id)}`,
    `order: ${item.order}`,
    `label: ${yamlValue(item.label)}`,
    `title: ${yamlValue(item.title)}`,
    `topic: ${yamlValue(item.topic)}`,
    `image: ${yamlValue(item.image)}`,
    `summary: ${yamlValue(item.summary)}`,
    "---",
    "",
  ].join("\n");

  fs.writeFileSync(path.join(postsDir, `${item.id}.md`), `${frontMatter}${body.trim()}\n`);
});

console.log(`Imported ${context.tracks.length} posts to content/insights.`);
