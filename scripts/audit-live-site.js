"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SITE_URL = String(process.env.SITE_URL || "https://controlpointai.org").replace(/\/+$/, "");
const CHECK_WWW = String(process.env.CHECK_WWW_REDIRECT || "0") === "1";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(url, options = {}) {
  let last;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: options.redirect || "follow", headers: { "user-agent": "ControlPointAI deployment smoke test" } });
      if (response.status < 500) return response;
      last = new Error(`${response.status} ${url}`);
    } catch (error) { last = error; }
    await sleep(5000);
  }
  throw last;
}
function ok(value, message) { if (!value) throw new Error(message); }
function location(response) { return response.headers.get("location") || ""; }
function isRedirect(response) { return [301, 302, 307, 308].includes(response.status); }
function sitemapUrls(xml) { return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]); }
function legacyRoutes(html) {
  const match = html.match(/var m=(\{.*?\}),i=/s);
  return match ? JSON.parse(match[1]) : {};
}
(async () => {
  const expectedSitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const expectedUrls = sitemapUrls(expectedSitemap);
  const sitemapResponse = await request(`${SITE_URL}/sitemap.xml`);
  ok(sitemapResponse.ok, `Sitemap returned ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const urls = sitemapUrls(sitemap);
  ok(expectedUrls.length, "No expected URLs in the local sitemap");
  ok(urls.length === expectedUrls.length, `Live sitemap has ${urls.length} URLs; expected ${expectedUrls.length}`);
  for (const url of expectedUrls) {
    ok(urls.includes(url), `Live sitemap is missing ${url}`);
    const canonicalUrl = new URL(url);
    const deployedUrl = `${SITE_URL}${canonicalUrl.pathname}`;
    const response = await request(deployedUrl);
    ok(response.ok, `${deployedUrl} returned ${response.status}`);
    const html = await response.text();
    ok(html.includes(`<link rel="canonical" href="${url}">`), `${deployedUrl} has the wrong canonical`);
    if (/^\/insights\/[^/]+\/$/.test(canonicalUrl.pathname)) {
      ok(/<article\b/i.test(html), `${deployedUrl} is missing its article element`);
      ok(/<h1\b[^>]*>[^<]+<\/h1>/i.test(html), `${deployedUrl} is missing its H1`);
      const visibleText = html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      ok(visibleText.length >= 250, `${deployedUrl} returned unexpectedly sparse HTML`);
      const hero = html.match(/<img\b[^>]*class=["'][^"']*article-hero-image[^"']*["'][^>]*src=["']([^"']+)["']/i)
        || html.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*article-hero-image[^"']*["']/i);
      if (hero) {
        const imageUrl = new URL(hero[1], SITE_URL).href;
        const imageResponse = await request(imageUrl);
        ok(imageResponse.ok, `${imageUrl} returned ${imageResponse.status}`);
        ok((imageResponse.headers.get("content-type") || "").startsWith("image/"), `${imageUrl} did not return an image`);
      }
    }
  }
  const cases = [
    ["/index.html", "/"],
    ["/services", "/services/"],
    ["/services/index.html", "/services/"],
  ];
  for (const [from, to] of cases) {
    const response = await request(`${SITE_URL}${from}`, { redirect: "manual" });
    ok(isRedirect(response), `${from} should redirect, received ${response.status}`);
    ok(new URL(location(response), SITE_URL).pathname === to, `${from} redirects to ${location(response)}, expected ${to}`);
  }
  const statusResponse = await request(`${SITE_URL}/deployment-status.json`);
  ok(statusResponse.ok, `Deployment status returned ${statusResponse.status}`);
  const deploymentStatus = await statusResponse.json();
  ok(deploymentStatus.status === "ok", "Deployment status is not healthy");
  ok(deploymentStatus.insightCount > 0, "Deployment status has no Insights");
  if (process.env.GITHUB_SHA) {
    ok(
      deploymentStatus.revision === process.env.GITHUB_SHA,
      `Live revision is ${deploymentStatus.revision}; expected ${process.env.GITHUB_SHA}`,
    );
  }

  const expectedLegacyHtml = fs.readFileSync(path.join(ROOT, "insights", "post", "index.html"), "utf8");
  const expectedRoutes = legacyRoutes(expectedLegacyHtml);
  const legacyResponse = await request(`${SITE_URL}/insights/post/index.html?issue=deployment-smoke-test`);
  ok(legacyResponse.ok, `Legacy Insight route returned ${legacyResponse.status}`);
  const legacyHtml = await legacyResponse.text();
  const liveRoutes = legacyRoutes(legacyHtml);
  for (const [issue, target] of Object.entries(expectedRoutes)) {
    ok(liveRoutes[issue] === target, `Legacy Insight route ${issue} is missing or points to ${liveRoutes[issue] || "nothing"}`);
  }
  ok(legacyHtml.includes("INSIGHT_NOT_DEPLOYED"), "Legacy Insight route does not expose its diagnostic error code");

  if (deploymentStatus.latestInsight) {
    ok(
      liveRoutes[deploymentStatus.latestInsight.id] === deploymentStatus.latestInsight.url,
      `Latest Insight ${deploymentStatus.latestInsight.id} is missing from the legacy redirect map`,
    );
  }
  if (CHECK_WWW) {
    const host = new URL(SITE_URL).hostname;
    const response = await request(`https://www.${host}/`, { redirect: "manual" });
    ok(isRedirect(response) && location(response).startsWith(SITE_URL), "www hostname is not redirected");
  }
  console.log(`Live smoke test passed for revision ${deploymentStatus.revision}, ${urls.length} sitemap URLs, article media, and canonical redirect cases.`);
})().catch((error) => { console.error(error.stack || error); process.exit(1); });
