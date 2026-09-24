const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "content", "insights");
const archivePath = path.join(root, "insights", "index.html");
const dataPath = path.join(root, "assets", "scripts", "insights-data.js");
const legacyPath = path.join(root, "insights", "post", "index.html");
const manifestPath = path.join(root, "tmp", "insights-manifest.json");
const redirectPath = path.join(root, "cloudfront", "functions", "legacy-insight-redirect.js");
const SITE_URL = String(process.env.SITE_URL || "https://controlpointai.org").replace(/\/+$/, "");
const DEFAULT_AUTHOR = "Wayne Couch";
const DEFAULT_IMAGE = "/assets/images/uploads/newsletter-authority-engineering.jpg";

const INITIAL_SLUGS = {
  ai1: "why-faster-ai-needs-valid-authority",
  ai2: "when-ai-moves-faster",
  ai3: "technology-is-moving-faster-than-authority",
  ai4: "from-algorithms-to-authority",
  ai5: "when-authority-breaks-at-machine-speed",
  ai6: "authority-gap-at-execution",
  ai7: "closing-the-authority-gap-at-execution",
  ai8: "the-control-point",
  ai9: "the-execution-authority-gap",
  ai10: "six-months-of-watching-ai",
  ai11: "foundation-of-controlpointai",
  ai12: "data-flow-mapping-foundation-of-ai-governance",
  ai13: "ai-governance-as-built-baseline",
  aics1: "unauthorized-concept-drift-during-ai-analysis",
  "dfm-standard-v01": "data-flow-mapping-standard-v01",
  monthly01: "observation-to-demonstration-ai-control"
};
const TOPICS = { runtime: "Runtime authority", operations: "Operations", analysis: "Analysis", interface: "Interface governance" };
const SERVICES = {
  "ai-data-flow-mapping": ["AI Data Flow Mapping", "/services/#data-flow-mapping"],
  "control-point-placement": ["Control Point Placement", "/services/#control-point-design"],
  "authority-advisory": ["Executive & Technical Authority Advisory", "/services/#leadership-advisory"]
};
const CTAS = {
  "request-data-flow-mapping": ["Request Data Flow Mapping", "/contact/"],
  "explore-services": ["Explore Services", "/services/"],
  "review-case-studies": ["Review Case Studies", "/case-studies/"],
  "contact-controlpointai": ["Contact ControlPointAI", "/contact/"],
  none: null
};

const strip = (v) => String(v || "").trim().replace(/^["']|["']$/g, "");
function parseValue(v) {
  const value = strip(v);
  if (/^\[.*\]$/.test(value)) return value.slice(1, -1).split(",").map(strip).filter(Boolean);
  return value;
}
function frontMatter(raw, file) {
  if (!raw.startsWith("---")) throw new Error(`${file} is missing front matter`);
  const end = raw.indexOf("\n---", 3);
  if (end < 0) throw new Error(`${file} has malformed front matter`);
  const data = {};
  let key = "";
  raw.slice(3, end).trim().split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) {
      key = match[1];
      data[key] = match[2].trim() ? parseValue(match[2]) : "";
      return;
    }
    if (!key || !/^\s+/.test(line) || !line.trim()) return;
    const value = line.trim();
    if (value.startsWith("- ")) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(parseValue(value.slice(2)));
    } else if (!Array.isArray(data[key])) {
      data[key] = `${data[key] || ""} ${strip(value)}`.trim();
    }
  });
  return { data, body: raw.slice(end + 4).trim() };
}
const list = (v) => Array.isArray(v) ? v.map(String).map(x => x.trim()).filter(Boolean) : (v ? String(v).split(",").map(x => x.trim()).filter(Boolean) : []);
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const safeHref = (v) => /^(https?:\/\/|mailto:|\/|#)/i.test(String(v || "").trim()) ? String(v).trim() : "#";
function inline(v) {
  return esc(v)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${esc(safeHref(url.replace(/&amp;/g, "&")))}" alt="${alt}">`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => `<a href="${esc(safeHref(url.replace(/&amp;/g, "&")))}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}
function markdown(md, title) {
  const out = [];
  let para = [], items = [], listTag = "", table = [], code = [], inCode = false;
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (items.length) { out.push(`<${listTag}>${items.map(x => `<li>${inline(x)}</li>`).join("")}</${listTag}>`); items = []; listTag = ""; } };
  const flushTable = () => {
    if (!table.length) return;
    if (table.length === 1) para.push(table[0].join(" | "));
    else {
      const [head, ...rows] = table;
      out.push(`<table class="article-table"><thead><tr>${head.map(x => `<th>${inline(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((x, i) => `<td data-label="${esc(head[i] || "")}">${inline(x)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    }
    table = [];
  };
  const flush = () => { flushPara(); flushList(); flushTable(); };
  const row = (line) => {
    if (!line.includes("|")) return null;
    const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(x => x.trim());
    if (cells.length < 2) return null;
    if (cells.every(x => /^:?-{3,}:?$/.test(x))) return [];
    return cells;
  };
  String(md || "").split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (t.startsWith("```")) {
      if (inCode) { out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`); code = []; inCode = false; }
      else { flush(); inCode = true; }
      return;
    }
    if (inCode) { code.push(line); return; }
    if (!t) { flush(); return; }
    const h = t.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      flush();
      const text = h[2].trim();
      if (out.length === 0 && text.replace(/[*_`]/g, "").toLowerCase() === String(title).toLowerCase()) return;
      const level = h[1].length <= 2 ? 2 : Math.min(h[1].length, 4);
      out.push(`<h${level}>${inline(text)}</h${level}>`); return;
    }
    const tr = row(t);
    if (Array.isArray(tr)) { flushPara(); flushList(); if (tr.length) table.push(tr); return; }
    const ul = t.match(/^[-*•]\s+(.+)$/), ol = t.match(/^\d+[.)]\s+(.+)$/);
    if (ul || ol) {
      flushPara(); flushTable();
      const wanted = ul ? "ul" : "ol";
      if (listTag && listTag !== wanted) flushList();
      listTag = wanted; items.push((ul || ol)[1]); return;
    }
    if (t.startsWith("> ")) { flush(); out.push(`<blockquote>${inline(t.slice(2))}</blockquote>`); return; }
    para.push(t);
  });
  if (inCode) out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
  flush();
  return out.join("\n");
}
function slugify(v) {
  return String(v || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}
function iso(v) { if (!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : d.toISOString(); }
function published(data) { if (!data.publish_date) return true; const d = new Date(data.publish_date); return Number.isNaN(d.getTime()) || d.getTime() <= Date.now(); }
function changed(file) {
  if (!fs.existsSync(path.join(root, ".git"))) return "";
  try { return iso(execFileSync("git", ["log", "-1", "--format=%cI", "--", path.relative(root, file).replace(/\\/g, "/")], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()); }
  catch (_e) { return ""; }
}
function shorten(v, max) {
  const s = String(v || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const part = s.slice(0, max + 1), boundary = part.lastIndexOf(" ");
  return `${part.slice(0, boundary > Math.floor(max * .65) ? boundary : max).replace(/[.,;:!?-]+$/, "")}…`;
}
function resolvedSlug(data, file) {
  const id = String(data.id || path.basename(file, ".md")).trim();
  if (String(data.slug_mode || "automatic") === "custom") {
    const custom = slugify(data.slug); if (!custom) throw new Error(`${file}: custom URL mode requires a slug`); return custom;
  }
  return INITIAL_SLUGS[id] || slugify(data.title || id);
}
function oldSlugs(post) {
  const aliases = new Set(list(post.data.redirect_from).map(slugify).filter(Boolean));
  if (!fs.existsSync(path.join(root, ".git"))) return [...aliases];
  const rel = path.relative(root, post.filePath).replace(/\\/g, "/");
  try {
    const commits = execFileSync("git", ["log", "--format=%H", "--all", "--", rel], { cwd: root, encoding: "utf8", maxBuffer: 10e6, stdio: ["ignore", "pipe", "ignore"] }).trim().split(/\r?\n/).filter(Boolean);
    commits.forEach(commit => {
      try {
        const prior = frontMatter(execFileSync("git", ["show", `${commit}:${rel}`], { cwd: root, encoding: "utf8", maxBuffer: 20e6, stdio: ["ignore", "pipe", "ignore"] }), rel);
        const priorId = String(prior.data.id || path.basename(post.file, ".md"));
        if (priorId === post.id) aliases.add(resolvedSlug(prior.data, post.file));
      } catch (_e) {}
    });
  } catch (_e) {}
  aliases.delete(post.slug); return [...aliases].sort();
}
function sourcesHtml(sources) {
  if (!sources.length) return "";
  const items = sources.map(value => {
    const text = String(value), split = text.lastIndexOf("|");
    if (split > 0 && /^https?:\/\//i.test(text.slice(split + 1).trim())) {
      const label = text.slice(0, split).trim(), url = text.slice(split + 1).trim();
      return `<li><a href="${esc(url)}" rel="noopener noreferrer">${esc(label)}</a></li>`;
    }
    if (/^https?:\/\//i.test(text.trim())) return `<li><a href="${esc(text.trim())}" rel="noopener noreferrer">${esc(text.trim())}</a></li>`;
    return `<li>${inline(text)}</li>`;
  }).join("");
  return `<section><h2>Sources and further reading</h2><ul>${items}</ul></section>`;
}
function related(post, posts) {
  const manual = list(post.data.related_insight_ids).map(id => posts.find(p => p.id === id)).filter(Boolean);
  if (manual.length) return manual.slice(0, 3);
  const result = posts.filter(p => p.id !== post.id && p.topic === post.topic).sort((a,b) => b.sort - a.sort).slice(0,3);
  for (const item of posts.slice().sort((a,b) => b.sort - a.sort)) {
    if (result.length >= 3) break;
    if (item.id !== post.id && !result.some(x => x.id === item.id)) result.push(item);
  }
  return result;
}
function articlePage(post, relatedPosts) {
  const service = SERVICES[post.service] || SERVICES["ai-data-flow-mapping"];
  const cta = Object.prototype.hasOwnProperty.call(CTAS, post.cta) ? CTAS[post.cta] : CTAS["request-data-flow-mapping"];
  const dateText = post.publishDate ? new Intl.DateTimeFormat("en-US", { year:"numeric", month:"long", day:"numeric", timeZone:"America/New_York" }).format(new Date(post.publishDate)) : "";
  const image = post.image ? `<img class="article-hero-image" src="${esc(post.image)}" alt="">` : "";
  const relatedHtml = relatedPosts.length ? `<h2>Related insights</h2><ul class="credential-list">${relatedPosts.map(x => `<li><a href="/insights/${esc(x.slug)}/">${esc(x.title)}</a></li>`).join("")}</ul>` : "";
  const graph = {
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"Article","@id":`${post.canonical}#article`,headline:post.title,description:post.description,url:post.canonical,mainEntityOfPage:post.canonical,datePublished:post.publishDate || undefined,dateModified:post.updatedDate || undefined,articleSection:TOPICS[post.topic] || post.topic,author:{"@type":"Person",name:post.author},publisher:{"@type":"Organization",name:"ControlPointAI",url:SITE_URL},image:post.image ? [`${SITE_URL}/${post.image.replace(/^\//, "")}`] : undefined},
      {"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"Home",item:`${SITE_URL}/`},{"@type":"ListItem",position:2,name:"Insights",item:`${SITE_URL}/insights/`},{"@type":"ListItem",position:3,name:post.title,item:post.canonical}]}
    ]
  };
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" href="../../assets/images/favicon.png"><title>${esc(post.metaTitle)}</title>
<meta name="description" content="${esc(post.description)}"><meta name="author" content="${esc(post.author)}"><link rel="canonical" href="${esc(post.canonical)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="ControlPointAI"><meta property="og:title" content="${esc(post.metaTitle)}"><meta property="og:description" content="${esc(post.description)}"><meta property="og:url" content="${esc(post.canonical)}">
<meta name="twitter:card" content="${post.image ? "summary_large_image" : "summary"}"><script type="application/ld+json">${JSON.stringify(graph).replace(/</g,"\\u003c")}</script>
<link rel="stylesheet" href="../../assets/styles/site.css"><script async src="https://www.googletagmanager.com/gtag/js?id=G-61G7BKXNT6"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","G-61G7BKXNT6");</script></head>
<body data-depth="2"><header class="site-header"><div class="nav-shell"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true"><span class="mark-c">C</span><span class="mark-p">P</span></span><span>ControlPointAI</span></a><nav class="site-nav" aria-label="Primary navigation"><a href="/services/">Services</a><a href="/mission/">Method</a><a href="/case-studies/">Case Studies</a><a href="/insights/">Insights</a><a href="/contact/">Contact</a></nav></div></header>
<main class="article-wrap"><article class="article"><nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/insights/">Insights</a></nav><p class="eyebrow">${esc(post.label)}</p><h1>${esc(post.title)}</h1><p class="lead">${esc(post.summary)}</p><p>By ${esc(post.author)}${dateText ? ` · <time datetime="${esc(post.publishDate)}">${esc(dateText)}</time>` : ""}</p>${image}${post.bodyHtml}${sourcesHtml(post.sources)}<div class="quote-callout">ControlPointAI principle: map where AI-generated work moves, then place Control Points before operational effects propagate.</div><nav class="case-nav" aria-label="Insight navigation"><a href="/insights/">Back to Insights</a>${cta ? `<a href="${cta[1]}">${esc(cta[0])}</a>` : "<span></span>"}</nav></article>
<aside class="sidebar"><h2>Article Context</h2><ul class="credential-list"><li><strong>Publication:</strong> ${esc(post.label)}</li><li><strong>Theme:</strong> ${esc(TOPICS[post.topic] || post.topic)}</li><li><strong>Author:</strong> ${esc(post.author)}</li><li><strong>Related service:</strong> <a href="${service[1]}">${esc(service[0])}</a></li></ul>${relatedHtml}${cta ? `<a class="button ghost" href="${cta[1]}">${esc(cta[0])}</a>` : ""}</aside></main>
<footer class="footer"><div class="container footer-grid"><div class="footer-brand"><strong>ControlPointAI&trade;</strong><p>AI data flow mapping and Control Point placement for high-consequence teams.</p><p class="copyright">&copy; 2026 ControlPointAI. All Rights Reserved.</p></div><nav class="footer-links"><a href="/services/">Services</a><a href="/mission/">Method</a><a href="/case-studies/">Case Studies</a><a href="/insights/">Insights</a></nav><div class="footer-cta"><span>Need to see where AI-generated work moves before it becomes action?</span><a href="/contact/">Start the conversation</a></div></div></footer><script src="../../assets/scripts/site.js"></script></body></html>`;
}
function redirectPage(post) {
  const target = `/insights/${post.slug}/`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${post.canonical}"><meta http-equiv="refresh" content="0;url=${target}"><title>Insight moved | ControlPointAI</title><script>location.replace(${JSON.stringify(target)})</script></head><body><p><a href="${target}">Continue to ${esc(post.title)}</a></p></body></html>`;
}
function loadPosts() {
  const posts = fs.readdirSync(postsDir).filter(f => f.endsWith(".md") && !f.startsWith("_")).map(file => {
    const filePath = path.join(postsDir, file), parsed = frontMatter(fs.readFileSync(filePath,"utf8"), file), data = parsed.data;
    const id = String(data.id || path.basename(file,".md")).trim(), title = String(data.title || id).trim(), slug = resolvedSlug(data,file);
    const publishDate = iso(data.publish_date), updatedDate = data.updated_date ? iso(data.updated_date) : ([publishDate, changed(filePath)].filter(Boolean).sort().at(-1) || publishDate);
    const summary = String(data.summary || "").replace(/\s+/g," ").trim();
    const metaTitle = String(data.meta_title_mode) === "custom" && data.meta_title ? String(data.meta_title).trim() : (title.length + 17 <= 65 ? `${title} | ControlPointAI` : shorten(title,65));
    const description = String(data.meta_description_mode) === "custom" && data.meta_description ? String(data.meta_description).replace(/\s+/g," ").trim() : shorten(summary,160);
    return { file,filePath,data,id,title,slug,label:String(data.label || `Issue ${data.order || ""}`).trim(),topic:String(data.topic || "analysis"),image:data.image === "" ? "" : String(data.image || DEFAULT_IMAGE),publishDate,updatedDate,summary,metaTitle,description,author:String(data.author || DEFAULT_AUTHOR),service:String(data.related_service || "ai-data-flow-mapping"),cta:String(data.cta || "request-data-flow-mapping"),sources:list(data.sources),bodyHtml:markdown(parsed.body,title),sort:publishDate ? new Date(publishDate).getTime() : Number(data.order || 0),canonical:`${SITE_URL}/insights/${slug}/`,isPublished:published(data) };
  }).filter(p => p.isPublished).sort((a,b) => a.sort-b.sort);
  const ids = new Set(), slugs = new Set();
  posts.forEach(p => { if (!p.slug || ids.has(p.id) || slugs.has(p.slug)) throw new Error(`Duplicate or missing Insight ID/slug: ${p.id}/${p.slug}`); if (!p.summary || !p.description) throw new Error(`${p.file} needs a summary`); ids.add(p.id); slugs.add(p.slug); p.oldSlugs = oldSlugs(p); });
  posts.forEach(p => p.oldSlugs.forEach(s => { if (slugs.has(s)) throw new Error(`Historical slug conflicts with current URL: ${s}`); }));
  return posts;
}
function archiveCards(posts) {
  return posts.slice().sort((a,b)=>b.sort-a.sort).map(p => `<article class="card"><img class="card-media" src="${esc(p.image)}" alt=""><span class="badge">${esc(p.label)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="actions"><a class="button ghost" href="/insights/${esc(p.slug)}/">Read ${esc(p.title)}</a></div></article>`).join("\n");
}
function updateArchive(posts) {
  let html = fs.readFileSync(archivePath,"utf8");
  html = html.replace(/href=(["'])\/\/insights\//gi, "href=$1/insights/");
  if (!/<link rel="canonical"/i.test(html)) html = html.replace(/<\/title>/i, `</title>\n    <link rel="canonical" href="${SITE_URL}/insights/">`);
  posts.forEach(p => {
    const variants = [ `/insights/post/index.html?issue=${p.id}`, `/insights/post/?issue=${p.id}`, `insights/post/index.html?issue=${p.id}`, `post/index.html?issue=${p.id}`, `post/?issue=${p.id}` ];
    variants.forEach(v => { html = html.split(v).join(`/insights/${p.slug}/`); });
  });
  const start = "<!-- generated-insight-archive:start -->", end = "<!-- generated-insight-archive:end -->", cards = archiveCards(posts);
  if (html.includes(start) && html.includes(end)) html = html.slice(0,html.indexOf(start)) + start + "\n" + cards + "\n" + html.slice(html.indexOf(end));
  else if (html.includes('<div class="grid" data-newsletter-archive></div>')) html = html.replace('<div class="grid" data-newsletter-archive></div>', `<div class="grid" data-newsletter-archive>\n${start}\n${cards}\n${end}\n</div>`);
  else throw new Error("Insights archive needs an empty data-newsletter-archive element or generated markers");
  fs.writeFileSync(archivePath,html);
}
function writeOutputs(posts) {
  updateArchive(posts);
  posts.forEach(p => {
    const page = path.join(root,"insights",p.slug,"index.html"); fs.mkdirSync(path.dirname(page),{recursive:true}); fs.writeFileSync(page,articlePage(p,related(p,posts)));
    p.oldSlugs.forEach(slug => { const old = path.join(root,"insights",slug,"index.html"); fs.mkdirSync(path.dirname(old),{recursive:true}); fs.writeFileSync(old,redirectPage(p)); });
  });
  const tracks = posts.map(p => ({id:p.id,order:p.sort,label:p.label,title:p.title,topic:p.topic,url:`insights/${p.slug}/`,image:p.image,publishDate:p.publishDate,summary:p.summary,sections:[{heading:"Core Argument",body:p.summary}]}));
  fs.mkdirSync(path.dirname(dataPath),{recursive:true}); fs.writeFileSync(dataPath,`// Generated from content/insights/*.md\nwindow.insightTracks=${JSON.stringify(tracks,null,2)};\nvar newsletterBodies={};\n`);
  fs.mkdirSync(path.dirname(manifestPath),{recursive:true}); fs.writeFileSync(manifestPath,JSON.stringify(posts.map(p => ({id:p.id,slug:p.slug,url:`/insights/${p.slug}/`,canonical:p.canonical,title:p.title,metaTitle:p.metaTitle,publishDate:p.publishDate,updatedDate:p.updatedDate,redirectSlugs:p.oldSlugs})),null,2)+"\n");
  const issueRoutes = Object.fromEntries(posts.map(p => [p.id,`/insights/${p.slug}/`])), pathRoutes = {};
  posts.forEach(p => p.oldSlugs.forEach(s => { pathRoutes[`/insights/${s}`]=`/insights/${p.slug}/`; pathRoutes[`/insights/${s}/index.html`]=`/insights/${p.slug}/`; }));
  const fn = `// Generated.\nfunction handler(event){var r=event.request,u=String(r.uri||"").replace(/\\/+$/,"");var q=${JSON.stringify(issueRoutes)},p=${JSON.stringify(pathRoutes)};if(u==="/insights/post"||u==="/insights/post/index.html"){var x=r.querystring&&r.querystring.issue,i=x&&x.value?x.value:"";if(q[i])return{statusCode:301,statusDescription:"Moved Permanently",headers:{location:{value:q[i]},"cache-control":{value:"public, max-age=86400"}}};return r}if(p[u])return{statusCode:301,statusDescription:"Moved Permanently",headers:{location:{value:p[u]},"cache-control":{value:"public, max-age=86400"}}};return r}`;
  fs.mkdirSync(path.dirname(redirectPath),{recursive:true}); fs.writeFileSync(redirectPath,fn);
  fs.mkdirSync(path.dirname(legacyPath),{recursive:true}); fs.writeFileSync(legacyPath,`<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${SITE_URL}/insights/"><title>Insight moved | ControlPointAI</title><script>var m=${JSON.stringify(issueRoutes)},i=new URLSearchParams(location.search).get("issue");if(m[i])location.replace(m[i])</script></head><body><p><a href="/insights/">Browse Insights</a></p></body></html>`);
}
const posts = loadPosts(); writeOutputs(posts); console.log(`Generated ${posts.length} static Insight pages and redirect routes.`);
