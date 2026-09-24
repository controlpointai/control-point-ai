# ControlPointAI SEO Phase 2

Phase 2 extends the Phase 1 static-Insights work across the whole website without replacing Decap CMS or redesigning the public pages.

## Automated on every build

- Canonical production URLs and clean internal links
- Clean Firebase Hosting routes plus compatibility pages for old Insight query URLs and previous Insight slugs
- Unique page metadata with optional Decap overrides
- Open Graph and Twitter sharing metadata
- Organization, WebSite, WebPage, Service, Article/Report, and breadcrumb JSON-LD where visible content supports it
- Complete sitemap generation from canonical, indexable HTML
- Related Insight links on the homepage, Services, Method, and content-driven case studies
- Migration of the remaining hand-coded interface-governance case study into Decap-managed content
- Basic accessibility improvements: skip links, focus visibility, main landmarks, image alt presence
- Basic performance improvements: lazy/eager image loading, async image decoding, local image dimensions where detectable, deferred local scripts
- A non-blocking asset audit that identifies large images and exact duplicate files in `tmp/asset-audit.json`
- Build-time checks for broken internal links, orphan canonical pages, duplicate titles/canonicals, sitemap mismatches, malformed JSON-LD, and legacy URLs
- Post-deploy production smoke testing

## Decap CMS

The **Site SEO** section lets Wayne choose automatic or custom search/social titles and descriptions for the main pages. It also provides optional planning notes and automatic-or-manual related Insight selection. Canonicals, robots directives, schema code, sitemap entries, and redirects remain protected and automatic.

## Sitemap

Continue using `https://controlpointai.org/sitemap.xml`. It is regenerated from the built pages during every deployment. It does not need to be resubmitted after normal edits or new posts.

## Preview deployments

Pull requests receive temporary Firebase Hosting preview channels through the repository's existing GitHub Actions workflow.

## Remaining data-dependent work

Google Search Console and Ahrefs exports are intentionally deferred until the site changes are live. Those sources are required to verify indexing, impressions, backlinks, broken external targets, and realistic DR/UR recovery opportunities.
