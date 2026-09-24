"use strict";
const {
  fs, path, root, SITE_URL, SITE_ORIGIN, htmlFiles, canonicalPathForFile,
  fileForCanonicalPath, parseFrontMatter, listValue, escapeHtml, stripHtml,
  readJson, isNoindex,
} = require("./site-utils");

const settingsDir = path.join(root, "content", "site-seo");
const organization = readJson(path.join(settingsDir, "organization.json"), {
  name: "ControlPointAI",
  url: SITE_URL,
  description: "AI data flow mapping and Control Point placement for high-consequence teams.",
  logo: "/assets/images/controlpointai-logo.svg",
  default_author: "Wayne Couch",
  same_as: [],
});
const manifest = readJson(path.join(root, "tmp", "insights-manifest.json"), []);
const issueRoutes = Object.fromEntries(manifest.map((item) => [item.id, item.url]));

const pageSettingsByPath = {
  "/": "homepage",
  "/services/": "services",
  "/mission/": "method",
  "/case-studies/": "case-studies",
  "/insights/": "insights",
  "/contact/": "contact",
};

const caseStatusByPath = {};
const caseDir = path.join(root, "content", "case-studies");
if (fs.existsSync(caseDir)) {
  for (const file of fs.readdirSync(caseDir).filter((name) => name.endsWith(".md") && !name.startsWith("_"))) {
    const parsed = parseFrontMatter(fs.readFileSync(path.join(caseDir, file), "utf8"), file);
    const livePath = String(parsed.data.live_path || "").replace(/^\/+|\/+$/g, "");
    if (livePath) caseStatusByPath[`/case-studies/${livePath}/`] = String(parsed.data.status || "featured");
  }
}

const files = htmlFiles();
const canonicalPaths = new Set(files.map(canonicalPathForFile));

function getTitle(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : "";
}
function getDescription(html) {
  const tag = (html.match(/<meta\b[^>]*>/gi) || []).find((value) => {
    const name = value.match(/\bname=(["'])(.*?)\1/i);
    return name && name[2].toLowerCase() === "description";
  });
  if (!tag) return "";
  const content = tag.match(/\bcontent=(["'])(.*?)\1/i);
  return content ? stripHtml(content[2]) : "";
}
function getH1(html) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripHtml(match[1]) : "";
}
function upsertTitle(html, value) {
  const tag = `<title>${escapeHtml(value)}</title>`;
  if (/<title>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title>[\s\S]*?<\/title>/i, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}
function removeMeta(html, attr, key) {
  const expression = new RegExp(`<meta\\s+[^>]*${attr}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>\\s*`, "gi");
  return html.replace(expression, "");
}
function upsertMeta(html, attr, key, value) {
  html = removeMeta(html, attr, key);
  const tag = `<meta ${attr}="${escapeHtml(key)}" content="${escapeHtml(value)}">`;
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}
function upsertCanonical(html, canonical) {
  html = html.replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>\s*/gi, "");
  return html.replace(/<\/head>/i, `  <link rel="canonical" href="${escapeHtml(canonical)}">\n</head>`);
}
function upsertJsonLd(html, graph) {
  html = html.replace(/\s*<script\s+id=["']sitewide-structured-data["'][^>]*>[\s\S]*?<\/script>/gi, "");
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  return html.replace(/<\/head>/i, `  <script id="sitewide-structured-data" type="application/ld+json">${json}</script>\n</head>`);
}
function settingFor(canonicalPath) {
  const name = pageSettingsByPath[canonicalPath];
  return name ? readJson(path.join(settingsDir, `${name}.json`), {}) : {};
}
function customOr(existing, settings, modeKey, valueKey) {
  return String(settings[modeKey] || "automatic") === "custom" && String(settings[valueKey] || "").trim()
    ? String(settings[valueKey]).replace(/\s+/g, " ").trim()
    : existing;
}
function breadcrumbName(canonicalPath, h1) {
  if (canonicalPath === "/services/") return "Services";
  if (canonicalPath === "/mission/") return "Method";
  if (canonicalPath === "/case-studies/") return "Case Studies";
  if (canonicalPath.startsWith("/case-studies/")) return h1 || "Case Study";
  if (canonicalPath === "/insights/") return "Insights";
  if (canonicalPath.startsWith("/insights/")) return h1 || "Insight";
  if (canonicalPath === "/contact/") return "Contact";
  return h1 || canonicalPath.split("/").filter(Boolean).at(-1) || organization.name;
}
function parentFor(canonicalPath) {
  if (canonicalPath.startsWith("/case-studies/") && canonicalPath !== "/case-studies/") return ["Case Studies", "/case-studies/"];
  if (canonicalPath.startsWith("/insights/") && canonicalPath !== "/insights/") return ["Insights", "/insights/"];
  return null;
}
function pageType(canonicalPath, html) {
  if (canonicalPath === "/contact/") return "ContactPage";
  if (["/case-studies/", "/insights/", "/services/"].includes(canonicalPath)) return "CollectionPage";
  if (canonicalPath.startsWith("/case-studies/") && canonicalPath !== "/case-studies/") return /case-report/i.test(html) ? "Report" : "Article";
  if (canonicalPath.startsWith("/insights/") && canonicalPath !== "/insights/") return "Article";
  return "WebPage";
}
function visibleServiceObjects(html, canonical) {
  if (!canonical.endsWith("/services/")) return [];
  const results = [];
  const cards = html.match(/<article\b[^>]*class=["'][^"']*service-card[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) || [];
  cards.forEach((card) => {
    const id = (card.match(/\bid=["']([^"']+)["']/i) || [])[1] || "";
    const name = stripHtml((card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i) || [])[1] || "");
    const description = stripHtml((card.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "");
    if (!name || !description) return;
    results.push({
      "@type": "Service",
      "@id": `${canonical}${id ? `#${id}` : `#${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}`,
      name,
      description,
      url: `${canonical}${id ? `#${id}` : ""}`,
      provider: { "@id": `${SITE_URL}/#organization` },
    });
  });
  return results;
}
function structuredGraph(canonicalPath, title, description, html) {
  const canonical = `${SITE_URL}${canonicalPath}`;
  const orgId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const webpageId = `${canonical}#webpage`;
  const graph = [];
  if (canonicalPath === "/") {
    const org = { "@type": "Organization", "@id": orgId, name: organization.name || "ControlPointAI", url: SITE_URL, description: organization.description || description };
    if (organization.logo) org.logo = { "@type": "ImageObject", url: new URL(organization.logo, SITE_URL).href };
    const sameAs = listValue(organization.same_as);
    if (sameAs.length) org.sameAs = sameAs;
    graph.push(org);
    graph.push({ "@type": "WebSite", "@id": websiteId, url: `${SITE_URL}/`, name: organization.name || "ControlPointAI", publisher: { "@id": orgId } });
  }
  const type = pageType(canonicalPath, html);
  const page = { "@type": type, "@id": webpageId, url: canonical, name: title, description, isPartOf: { "@id": websiteId }, publisher: { "@id": orgId } };
  if (type === "Article" || type === "Report") {
    page.headline = getH1(html) || title;
    page.mainEntityOfPage = { "@id": webpageId };
  }
  graph.push(page);
  if (canonicalPath !== "/") {
    const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }];
    const parent = parentFor(canonicalPath);
    if (parent) items.push({ "@type": "ListItem", position: 2, name: parent[0], item: `${SITE_URL}${parent[1]}` });
    items.push({ "@type": "ListItem", position: items.length + 1, name: breadcrumbName(canonicalPath, getH1(html)), item: canonical });
    graph.push({ "@type": "BreadcrumbList", itemListElement: items });
  }
  graph.push(...visibleServiceObjects(html, canonical));
  return graph;
}
function ensureSkipLink(html) {
  if (!/<main\b/i.test(html)) return html;
  if (!/<main\b[^>]*\bid=["']main-content["']/i.test(html)) html = html.replace(/<main\b([^>]*)>/i, '<main id="main-content"$1>');
  if (!/class=["'][^"']*skip-link/i.test(html)) html = html.replace(/<body\b([^>]*)>/i, '<body$1>\n    <a class="skip-link" href="#main-content">Skip to main content</a>');
  return html;
}
function normalizeFooterNav(html) {
  return html.replace(/<nav\b([^>]*class=["'][^"']*footer-links[^"']*["'][^>]*)>/gi, (tag, attrs) => /aria-label=/i.test(attrs) ? tag : `<nav${attrs} aria-label="Footer navigation">`);
}
function queryStringWithoutIssue(url) {
  if (!issueRoutes[url.searchParams.get("issue")]) return null;
  return issueRoutes[url.searchParams.get("issue")];
}
function normalizeHref(raw, currentPath) {
  const value = String(raw || "").trim().replace(/&amp;/gi, "&");
  if (!value || /^(#|mailto:|tel:|sms:|javascript:|data:)/i.test(value)) return value;
  let url;
  try { url = new URL(value, `${SITE_URL}${currentPath}`); } catch (_error) { return value; }
  const isPrimaryHost = url.origin === SITE_ORIGIN || url.hostname === `www.${new URL(SITE_URL).hostname}`;
  if (!isPrimaryHost) return value;
  const legacy = queryStringWithoutIssue(url);
  if (legacy && /^\/insights\/post(?:\/index\.html)?\/?$/i.test(url.pathname)) return legacy;
  let pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (pathname === "/index.html") pathname = "/";
  else if (/\/index\.html$/i.test(pathname)) pathname = pathname.slice(0, -"index.html".length);
  if (!pathname.endsWith("/") && canonicalPaths.has(`${pathname}/`)) pathname += "/";
  return `${pathname}${url.search}${url.hash}`;
}
function normalizeLinks(html, currentPath) {
  return html.replace(/(<a\b[^>]*\bhref=)(["'])([^"']*)(\2)/gi, (all, prefix, quote, href) => `${prefix}${quote}${escapeHtml(normalizeHref(href, currentPath))}${quote}`);
}
function ensureExternalRel(html) {
  return html.replace(/<a\b([^>]*\btarget=["']_blank["'][^>]*)>/gi, (tag, attrs) => {
    if (/\brel=["'][^"']*noopener/i.test(attrs)) return tag;
    if (/\brel=["']/i.test(attrs)) return tag.replace(/\brel=["']([^"']*)["']/i, (_m, rel) => `rel="${rel} noopener noreferrer"`);
    return `<a${attrs} rel="noopener noreferrer">`;
  });
}
function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return match ? match[1] : "";
}
function addAttribute(tag, name, value) {
  if (new RegExp(`\\b${name}=`, "i").test(tag)) return tag;
  return tag.replace(/\s*\/?\s*>$/, ` ${name}="${escapeHtml(value)}">`);
}
function localFileForAsset(src, pageFile) {
  if (!src || /^(https?:)?\/\//i.test(src) || /^(data:|blob:)/i.test(src)) return null;
  const clean = src.split(/[?#]/)[0];
  const file = clean.startsWith("/") ? path.join(root, clean.replace(/^\//, "")) : path.resolve(path.dirname(pageFile), clean);
  return file.startsWith(root) && fs.existsSync(file) ? file : null;
}
function imageDimensions(file) {
  try {
    const buffer = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    if (ext === ".png" && buffer.length >= 24 && buffer.toString("hex", 0, 8) === "89504e470d0a1a0a") return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
    if ((ext === ".gif") && buffer.length >= 10) return [buffer.readUInt16LE(6), buffer.readUInt16LE(8)];
    if (ext === ".jpg" || ext === ".jpeg") {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) { offset += 1; continue; }
        const marker = buffer[offset + 1];
        if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return [buffer.readUInt16BE(offset + 7), buffer.readUInt16BE(offset + 5)];
        const length = buffer.readUInt16BE(offset + 2);
        if (!length) break;
        offset += 2 + length;
      }
    }
    if (ext === ".svg") {
      const text = buffer.toString("utf8", 0, Math.min(buffer.length, 10000));
      const width = (text.match(/\bwidth=["']([0-9.]+)/i) || [])[1];
      const height = (text.match(/\bheight=["']([0-9.]+)/i) || [])[1];
      if (width && height) return [Math.round(Number(width)), Math.round(Number(height))];
      const viewBox = (text.match(/\bviewBox=["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)["']/i) || []);
      if (viewBox[1] && viewBox[2]) return [Math.round(Number(viewBox[1])), Math.round(Number(viewBox[2]))];
    }
  } catch (_error) {}
  return null;
}
function optimizeImages(html, pageFile) {
  let eagerUsed = false;
  return html.replace(/<img\b[^>]*>/gi, (original) => {
    let tag = original;
    if (!/\balt=/i.test(tag)) tag = addAttribute(tag, "alt", "");
    tag = addAttribute(tag, "decoding", "async");
    const hero = /\b(article-hero-image|hero-image|publication-feature)\b/i.test(tag);
    if (hero && !eagerUsed) {
      tag = addAttribute(tag, "loading", "eager");
      tag = addAttribute(tag, "fetchpriority", "high");
      eagerUsed = true;
    } else {
      tag = addAttribute(tag, "loading", "lazy");
    }
    if (!/\bwidth=/i.test(tag) || !/\bheight=/i.test(tag)) {
      const file = localFileForAsset(attribute(tag, "src"), pageFile);
      const size = file ? imageDimensions(file) : null;
      if (size && size[0] > 0 && size[1] > 0) {
        tag = addAttribute(tag, "width", String(size[0]));
        tag = addAttribute(tag, "height", String(size[1]));
      }
    }
    return tag;
  });
}
function deferLocalScripts(html) {
  return html.replace(/<script\b([^>]*\bsrc=["']([^"']+)["'][^>]*)>/gi, (tag, attrs, src) => {
    if (/\b(async|defer)\b/i.test(attrs) || /^(https?:)?\/\//i.test(src)) return tag;
    return `<script${attrs} defer>`;
  });
}
function articleImage(html, currentPath) {
  const match = html.match(/<img\b[^>]*class=["'][^"']*(?:article-hero-image|card-media)[^"']*["'][^>]*src=["']([^"']+)["']/i)
    || html.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*(?:article-hero-image|card-media)[^"']*["']/i);
  if (!match) return "";
  try { return new URL(match[1], `${SITE_URL}${currentPath}`).href; } catch (_error) { return ""; }
}

for (const file of files) {
  const canonicalPath = canonicalPathForFile(file);
  let html = fs.readFileSync(file, "utf8");
  const legacyOrAdmin = canonicalPath.startsWith("/admin/") || canonicalPath === "/insights/post/" || isNoindex(html);
  const caseStatus = caseStatusByPath[canonicalPath];
  if (caseStatus && caseStatus !== "featured") html = upsertMeta(html, "name", "robots", "noindex,follow");
  const noindex = legacyOrAdmin || (caseStatus && caseStatus !== "featured");

  html = normalizeLinks(html, canonicalPath);
  html = ensureExternalRel(html);
  html = ensureSkipLink(html);
  html = normalizeFooterNav(html);
  html = optimizeImages(html, file);
  html = deferLocalScripts(html);

  if (!noindex) {
    const settings = settingFor(canonicalPath);
    let title = customOr(getTitle(html) || `${getH1(html)} | ControlPointAI`, settings, "title_mode", "meta_title");
    let description = customOr(getDescription(html), settings, "description_mode", "meta_description");
    if (!title) title = `${getH1(html) || organization.name} | ControlPointAI`;
    if (!description) description = stripHtml((html.match(/<main\b[^>]*>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || organization.description || "").slice(0, 160);
    const socialTitle = customOr(title, settings, "social_title_mode", "social_title");
    const socialDescription = customOr(description, settings, "social_description_mode", "social_description");
    const canonical = `${SITE_URL}${canonicalPath}`;
    const type = pageType(canonicalPath, html);
    const configuredImage = String(settings.social_image || "").trim();
    const image = configuredImage ? new URL(configuredImage, SITE_URL).href : ((type === "Article" || type === "Report") ? articleImage(html, canonicalPath) : "");

    html = upsertTitle(html, title);
    html = upsertMeta(html, "name", "description", description);
    html = upsertCanonical(html, canonical);
    html = upsertMeta(html, "property", "og:type", (type === "Article" || type === "Report") ? "article" : "website");
    html = upsertMeta(html, "property", "og:site_name", organization.name || "ControlPointAI");
    html = upsertMeta(html, "property", "og:title", socialTitle);
    html = upsertMeta(html, "property", "og:description", socialDescription);
    html = upsertMeta(html, "property", "og:url", canonical);
    html = upsertMeta(html, "name", "twitter:card", image ? "summary_large_image" : "summary");
    html = upsertMeta(html, "name", "twitter:title", socialTitle);
    html = upsertMeta(html, "name", "twitter:description", socialDescription);
    if (image) {
      html = upsertMeta(html, "property", "og:image", image);
      html = upsertMeta(html, "name", "twitter:image", image);
    }
    html = upsertJsonLd(html, structuredGraph(canonicalPath, title, description, html));
  }
  fs.writeFileSync(file, html);
}

console.log(`Normalized links, metadata, structured data, accessibility, and image loading across ${files.length} HTML files.`);
