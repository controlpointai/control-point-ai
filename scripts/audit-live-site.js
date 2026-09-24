"use strict";
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
(async () => {
  const sitemapResponse = await request(`${SITE_URL}/sitemap.xml`);
  ok(sitemapResponse.ok, `Sitemap returned ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  ok(urls.length, "No URLs in sitemap");
  for (const url of urls) {
    const canonicalUrl = new URL(url);
    const deployedUrl = `${SITE_URL}${canonicalUrl.pathname}`;
    const response = await request(deployedUrl);
    ok(response.ok, `${deployedUrl} returned ${response.status}`);
    const html = await response.text();
    ok(html.includes(`<link rel="canonical" href="${url}">`), `${deployedUrl} has the wrong canonical`);
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
  const manifestResponse = await request(`${SITE_URL}/assets/scripts/insights-data.js`);
  if (manifestResponse.ok && urls.some((url) => url.includes("/insights/"))) {
    const firstInsight = urls.find((url) => /\/insights\/[^/]+\/$/.test(new URL(url).pathname));
    if (firstInsight) {
      // Query-string routes are validated in the build; one representative live route is enough here.
      const issue = process.env.LEGACY_INSIGHT_ID || "ai9";
      const response = await request(`${SITE_URL}/insights/post/index.html?issue=${encodeURIComponent(issue)}`, { redirect: "manual" });
      ok(isRedirect(response) || response.ok, `Legacy Insight route returned ${response.status}`);
      if (response.ok) {
        const html = await response.text();
        ok(html.includes(`"${issue}"`), `Legacy Insight fallback does not contain ${issue}`);
      }
    }
  }
  if (CHECK_WWW) {
    const host = new URL(SITE_URL).hostname;
    const response = await request(`https://www.${host}/`, { redirect: "manual" });
    ok(isRedirect(response) && location(response).startsWith(SITE_URL), "www hostname is not redirected");
  }
  console.log(`Live smoke test passed for ${urls.length} sitemap URLs and canonical redirect cases.`);
})().catch((error) => { console.error(error.stack || error); process.exit(1); });
