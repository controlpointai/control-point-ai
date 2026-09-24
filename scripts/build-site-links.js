"use strict";
const {
  fs, path, root, escapeHtml, stripHtml, readJson, parseFrontMatter,
  listValue, replaceGeneratedBlock,
} = require("./site-utils");

const manifestPath = path.join(root, "tmp", "insights-manifest.json");
if (!fs.existsSync(manifestPath)) throw new Error("Run the Phase 1 Insight build before sitewide links");
const manifest = readJson(manifestPath, []);
const contentDir = path.join(root, "content", "insights");

const sourceById = {};
for (const file of fs.readdirSync(contentDir).filter((name) => name.endsWith(".md") && !name.startsWith("_"))) {
  const parsed = parseFrontMatter(fs.readFileSync(path.join(contentDir, file), "utf8"), file);
  const id = String(parsed.data.id || path.basename(file, ".md"));
  sourceById[id] = {
    summary: String(parsed.data.summary || "").replace(/\s+/g, " ").trim(),
    topic: String(parsed.data.topic || "analysis"),
    service: String(parsed.data.related_service || "ai-data-flow-mapping"),
    body: parsed.body,
  };
}

const posts = manifest.map((item) => ({ ...item, ...(sourceById[item.id] || {}) }));
const byId = Object.fromEntries(posts.map((post) => [post.id, post]));

function tokens(value) {
  const stop = new Set(["about", "after", "again", "against", "also", "among", "and", "are", "before", "being", "between", "can", "controlpointai", "data", "does", "for", "from", "has", "have", "into", "its", "more", "must", "not", "only", "our", "page", "point", "should", "that", "the", "their", "these", "this", "through", "using", "when", "where", "which", "while", "with", "work"]);
  return new Set(String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((word) => word.length > 2 && !stop.has(word)));
}

function similarity(text, post) {
  const a = tokens(text);
  const b = tokens(`${post.title} ${post.summary} ${post.topic} ${post.service}`);
  let score = 0;
  for (const word of a) if (b.has(word)) score += word.length > 8 ? 3 : 1;
  return score;
}

function selectPosts({ text = "", manual = [], preferredTopics = [], preferredService = "", limit = 3 } = {}) {
  const selected = listValue(manual).map((id) => byId[id]).filter(Boolean);
  if (selected.length) return selected.slice(0, limit);
  return posts.slice().sort((a, b) => {
    const serviceBoostA = preferredService && a.service === preferredService ? 12 : 0;
    const serviceBoostB = preferredService && b.service === preferredService ? 12 : 0;
    const topicBoostA = preferredTopics.includes(a.topic) ? 7 : 0;
    const topicBoostB = preferredTopics.includes(b.topic) ? 7 : 0;
    const scoreA = serviceBoostA + topicBoostA + similarity(text, a);
    const scoreB = serviceBoostB + topicBoostB + similarity(text, b);
    return scoreB - scoreA || new Date(b.publishDate || 0) - new Date(a.publishDate || 0) || b.title.localeCompare(a.title);
  }).slice(0, limit);
}

function pageSettings(name) {
  return readJson(path.join(root, "content", "site-seo", `${name}.json`), {});
}

function cardsSection(postsForPage, eyebrow, heading, intro) {
  const cards = postsForPage.map((post) => [
    '<article class="card compact-card">',
    `  <span class="badge">${escapeHtml(post.label || "Insight")}</span>`,
    `  <h3>${escapeHtml(post.title)}</h3>`,
    post.summary ? `  <p>${escapeHtml(post.summary)}</p>` : "",
    `  <a href="${escapeHtml(post.url)}">Read insight</a>`,
    "</article>",
  ].filter(Boolean).join("\n")).join("\n");
  return [
    '<section class="section section-tight related-insights-section">',
    '  <div class="container">',
    '    <div class="section-heading">',
    `      <p class="eyebrow">${escapeHtml(eyebrow)}</p>`,
    `      <h2>${escapeHtml(heading)}</h2>`,
    intro ? `      <p>${escapeHtml(intro)}</p>` : "",
    "    </div>",
    '    <div class="grid">',
    cards.split("\n").map((line) => `      ${line}`).join("\n"),
    "    </div>",
    "  </div>",
    "</section>",
  ].filter(Boolean).join("\n");
}

function insertBeforeLastSection(html) {
  const index = html.lastIndexOf('<section class="section');
  return index >= 0 ? index : html.lastIndexOf("</main>");
}

const fixedPages = [
  {
    file: "index.html", key: "homepage", block: "homepage-related-insights",
    eyebrow: "Latest Insights", heading: "Continue with the latest ControlPointAI analysis.",
    intro: "Read the newest work on AI data flows, execution authority, evidence, and accountable human review.",
    preferredTopics: [], preferredService: "ai-data-flow-mapping",
  },
  {
    file: "services/index.html", key: "services", block: "services-related-insights",
    eyebrow: "Related Insights", heading: "The thinking behind the mapping work.",
    intro: "These articles explain the execution-flow and authority problems the services are designed to address.",
    preferredTopics: ["operations", "runtime"], preferredService: "ai-data-flow-mapping",
  },
  {
    file: "mission/index.html", key: "method", block: "method-related-insights",
    eyebrow: "Explore the Method", heading: "Read the method in greater depth.",
    intro: "Follow the development of execution-bound authority, Control Points, and traceable operating baselines.",
    preferredTopics: ["runtime", "analysis"], preferredService: "",
  },
];

for (const page of fixedPages) {
  const file = path.join(root, page.file);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const settings = pageSettings(page.key);
  const chosen = selectPosts({
    text: stripHtml(html),
    manual: settings.related_insight_ids,
    preferredTopics: page.preferredTopics,
    preferredService: page.preferredService,
  });
  const section = cardsSection(chosen, page.eyebrow, page.heading, page.intro);
  html = replaceGeneratedBlock(html, page.block, section, insertBeforeLastSection);
  fs.writeFileSync(file, html);
}

const caseContentDir = path.join(root, "content", "case-studies");
if (fs.existsSync(caseContentDir)) {
  for (const sourceName of fs.readdirSync(caseContentDir).filter((name) => name.endsWith(".md") && !name.startsWith("_"))) {
    const sourceFile = path.join(caseContentDir, sourceName);
    const parsed = parseFrontMatter(fs.readFileSync(sourceFile, "utf8"), sourceName);
    const livePath = String(parsed.data.live_path || "").replace(/^\/+|\/+$/g, "");
    if (!livePath) continue;
    const pageFile = path.join(root, "case-studies", livePath, "index.html");
    if (!fs.existsSync(pageFile)) continue;
    let html = fs.readFileSync(pageFile, "utf8");
    const chosen = selectPosts({ text: `${parsed.data.title || ""} ${parsed.data.summary || ""} ${parsed.body}`, manual: parsed.data.related_insight_ids });
    const list = [
      '<div class="generated-related-insights-sidebar">',
      "  <h2>Related insights</h2>",
      '  <ul class="credential-list">',
      ...chosen.map((post) => `    <li><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></li>`),
      "  </ul>",
      "</div>",
    ].join("\n");
    html = replaceGeneratedBlock(html, "case-related-insights", list, (value) => value.lastIndexOf("</aside>"));
    fs.writeFileSync(pageFile, html);
  }
}

console.log(`Generated related-content links for ${fixedPages.length} core pages and content-driven case studies.`);
