"use strict";
const {
  fs, path, root, SITE_URL, SITE_ORIGIN, htmlFiles, canonicalPathForFile,
  fileForCanonicalPath, isNoindex, stripHtml,
} = require("./site-utils");
function ok(condition, message) { if (!condition) throw new Error(message); }
function attr(html, tag, attribute, key) {
  const first = new RegExp(`<${tag}\\s+[^>]*${attribute}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["'][^>]*>`, "i");
  const second = new RegExp(`<${tag}\\s+[^>]*content=["']([^"']*)["'][^>]*${attribute}=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "i");
  return (html.match(first) || html.match(second) || [])[1] || "";
}
function canonical(html) {
  return (html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i) || [])[1] || "";
}
function title(html) { return stripHtml((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ""); }
function hrefs(html) { return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map((match) => match[1]); }
function internalPath(href, base) {
  if (!href || /^(#|mailto:|tel:|sms:|javascript:|data:)/i.test(href)) return null;
  try {
    const url = new URL(href, `${SITE_URL}${base}`);
    if (url.origin !== SITE_ORIGIN) return null;
    return url.pathname;
  } catch (_error) { return null; }
}
function existsForPath(pathname) {
  if (pathname === "/") return fs.existsSync(path.join(root, "index.html"));
  const clean = decodeURIComponent(pathname).replace(/^\//, "");
  if (pathname.endsWith("/")) return fs.existsSync(path.join(root, clean, "index.html"));
  return fs.existsSync(path.join(root, clean));
}
const pages = [];
for (const file of htmlFiles()) {
  const html = fs.readFileSync(file, "utf8");
  if (isNoindex(html)) continue;
  const pathname = canonicalPathForFile(file);
  pages.push({ file, html, pathname, canonical: `${SITE_URL}${pathname}` });
}
const titles = new Map(), canonicals = new Map(), inbound = new Map(pages.map((page) => [page.pathname, 0]));
for (const page of pages) {
  const pageTitle = title(page.html);
  const description = attr(page.html, "meta", "name", "description");
  ok(pageTitle, `Missing title: ${page.pathname}`);
  ok(description, `Missing description: ${page.pathname}`);
  ok((page.html.match(/<h1(?:\s|>)/gi) || []).length === 1, `Expected one H1: ${page.pathname}`);
  ok(canonical(page.html) === page.canonical, `Wrong canonical: ${page.pathname}`);
  ok(attr(page.html, "meta", "property", "og:title"), `Missing og:title: ${page.pathname}`);
  ok(attr(page.html, "meta", "property", "og:description"), `Missing og:description: ${page.pathname}`);
  ok(attr(page.html, "meta", "property", "og:url") === page.canonical, `Wrong og:url: ${page.pathname}`);
  ok(attr(page.html, "meta", "name", "twitter:card"), `Missing Twitter card: ${page.pathname}`);
  if (/^\/insights\/[^/]+\/$/.test(page.pathname)) {
    ok(attr(page.html, "meta", "property", "og:type") === "article", `Insight must use og:type=article: ${page.pathname}`);
    ok(/"@type":"Article"/.test(page.html), `Insight Article schema missing: ${page.pathname}`);
  }
  ok(/class=["'][^"']*skip-link/i.test(page.html), `Missing skip link: ${page.pathname}`);
  ok(/<main\b[^>]*id=["']main-content["']/i.test(page.html), `Missing main landmark ID: ${page.pathname}`);
  const jsonScripts = [...page.html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  ok(jsonScripts.length > 0, `Missing JSON-LD: ${page.pathname}`);
  for (const match of jsonScripts) JSON.parse(match[1]);
  ok(!titles.has(pageTitle), `Duplicate title: ${pageTitle} (${titles.get(pageTitle)} and ${page.pathname})`);
  ok(!canonicals.has(page.canonical), `Duplicate canonical: ${page.canonical}`);
  titles.set(pageTitle, page.pathname); canonicals.set(page.canonical, page.pathname);

  for (const image of page.html.match(/<img\b[^>]*>/gi) || []) {
    ok(/\balt=["'][^"']*["']/i.test(image), `Image missing alt attribute: ${page.pathname}`);
    ok(/\bdecoding=["']async["']/i.test(image), `Image missing async decoding: ${page.pathname}`);
    ok(/\bloading=["'](?:lazy|eager)["']/i.test(image), `Image missing loading mode: ${page.pathname}`);
  }
  for (const script of page.html.match(/<script\b[^>]*src=["'][^"']+["'][^>]*>/gi) || []) {
    const src = (script.match(/src=["']([^"']+)["']/i) || [])[1] || "";
    if (/^(https?:)?\/\//i.test(src)) continue;
    ok(/\b(?:defer|async)\b/i.test(script), `Local script blocks parsing: ${src} on ${page.pathname}`);
  }
  for (const href of hrefs(page.html)) {
    ok(!/^\/\//.test(href), `Protocol-relative link remains on ${page.pathname}: ${href}`);
    ok(!/\/index\.html(?:[?#]|$)/i.test(href), `Internal /index.html link remains on ${page.pathname}: ${href}`);
    ok(!/^https?:\/\/www\.controlpointai\.org/i.test(href), `www internal link remains on ${page.pathname}: ${href}`);
    ok(!/\/insights\/post\/?(?:index\.html)?\?issue=/i.test(href), `Legacy Insight link remains on ${page.pathname}: ${href}`);
    const target = internalPath(href, page.pathname);
    if (!target) continue;
    ok(existsForPath(target), `Broken internal link on ${page.pathname}: ${href}`);
    const canonicalTarget = target.endsWith("/") ? target : (fs.existsSync(fileForCanonicalPath(`${target}/`)) ? `${target}/` : target);
    if (inbound.has(canonicalTarget) && canonicalTarget !== page.pathname) inbound.set(canonicalTarget, inbound.get(canonicalTarget) + 1);
  }
}
const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
ok(new Set(sitemapUrls).size === sitemapUrls.length, "Sitemap contains duplicate URLs");
ok(sitemapUrls.length === pages.length, `Sitemap/page count mismatch: ${sitemapUrls.length} vs ${pages.length}`);
for (const page of pages) ok(sitemapUrls.includes(page.canonical), `Sitemap missing ${page.canonical}`);
for (const url of sitemapUrls) ok(canonicals.has(url), `Sitemap includes noncanonical or noindex URL: ${url}`);
for (const [pathname, count] of inbound) if (pathname !== "/") ok(count > 0, `Orphan canonical page: ${pathname}`);
console.log(`Validated ${pages.length} canonical pages, metadata, JSON-LD, internal links, sitemap coverage, and accessibility basics.`);
