const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "case-studies");
const caseIndexPath = path.join(root, "case-studies", "index.html");

function stripQuotes(value) {
  return String(value || "")
    .trim()
    .replace(/^"(.*)"$/, "$1")
    .replace(/^'(.*)'$/, "$1");
}

function parseFrontMatter(raw, filePath) {
  if (!raw.startsWith("---")) {
    throw new Error(`${filePath} is missing front matter`);
  }

  const end = raw.indexOf("\n---", 3);
  if (end === -1) {
    throw new Error(`${filePath} has malformed front matter`);
  }

  const frontMatter = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trim();
  const data = {};
  let currentKey = "";
  let currentMode = "scalar";

  frontMatter.split(/\r?\n/).forEach((line) => {
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      const [, key, rawValue] = keyMatch;
      const value = stripQuotes(rawValue);
      currentKey = key;
      currentMode = value ? "scalar" : "pending";
      data[key] = value;
      return;
    }

    if (!currentKey || !/^\s+/.test(line)) return;

    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(stripQuotes(trimmed.slice(2)));
      currentMode = "list";
      return;
    }

    if (currentMode === "scalar") {
      data[currentKey] = `${data[currentKey]} ${stripQuotes(trimmed)}`.trim();
    }
  });

  return { data, body };
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(value) {
  return escapeHTML(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function listValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return [value];
}

function sortOrder(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function hrefForDepth(value, depth) {
  if (!value) return "";
  if (/^(https?:)?\/\//.test(value) || value.startsWith("/")) return value;
  return `${"../".repeat(depth)}${value}`;
}

function splitPreface(body) {
  const lines = body.split(/\r?\n/);
  const firstSectionIndex = lines.findIndex((line) => line.trim().startsWith("## "));

  if (firstSectionIndex === -1) {
    return { preface: body.trim(), mainBody: "" };
  }

  return {
    preface: lines.slice(0, firstSectionIndex).join("\n").trim(),
    mainBody: lines.slice(firstSectionIndex).join("\n").trim(),
  };
}

function prefaceLines(preface) {
  return preface
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function markdownToHtml(markdown, options = {}) {
  const html = [];
  let paragraph = [];
  let list = [];
  let table = [];
  let sectionOpen = false;
  let phaseOpen = false;
  const reportSections = options.layout === "report";

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("\n")}</ul>`);
    list = [];
  }

  function flushTable() {
    if (!table.length) return;
    const [head, ...body] = table;
    html.push(
      [
        '<table class="article-table">',
        `  <thead><tr>${head.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join("")}</tr></thead>`,
        "  <tbody>",
        ...body.map(
          (row) =>
            `    <tr>${row
              .map((cell, index) => `<td data-label="${escapeHTML(head[index] || "")}">${inlineMarkdown(cell)}</td>`)
              .join("")}</tr>`
        ),
        "  </tbody>",
        "</table>",
      ].join("\n")
    );
    table = [];
  }

  function parseTableRow(line) {
    if (!line.includes("|")) return null;
    const cells = line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

    if (cells.length < 2) return null;
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return [];
    return cells;
  }

  function sectionClass(heading) {
    if (/^Public-Source \/ Synthetic Case Study$/i.test(heading)) {
      return "case-report-section case-report-notice";
    }

    if (/^Document Basis$/i.test(heading)) {
      return "case-report-section case-report-basis";
    }

    return "case-report-section";
  }

  function closePhase() {
    if (!phaseOpen) return;
    html.push("</section>");
    phaseOpen = false;
  }

  function closeSection() {
    closePhase();
    if (!sectionOpen) return;
    html.push("</section>");
    sectionOpen = false;
  }

  markdown.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      flushTable();
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      flushTable();
      if (reportSections) {
        html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      } else {
        closePhase();
        html.push('<section class="phase-block">');
        html.push(`<h2>${inlineMarkdown(trimmed.slice(4))}</h2>`);
        phaseOpen = true;
      }
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushTable();
      closePhase();
      closeSection();
      const heading = trimmed.slice(3);
      if (reportSections) {
        html.push(`<section class="${sectionClass(heading)}">`);
        html.push(`<h2>${inlineMarkdown(heading)}</h2>`);
        sectionOpen = true;
      } else {
        html.push(`<h2>${inlineMarkdown(heading)}</h2>`);
      }
      return;
    }

    const tableRow = parseTableRow(trimmed);
    if (Array.isArray(tableRow)) {
      if (!tableRow.length) return;
      flushParagraph();
      flushList();
      table.push(tableRow);
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      flushTable();
      list.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      flushTable();
      html.push(`<div class="quote-callout">${inlineMarkdown(trimmed.slice(2))}</div>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  flushTable();
  closePhase();
  closeSection();
  return html.join("\n");
}

function pageShell({ depth, title, description, main }) {
  const prefix = "../".repeat(depth);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/png" href="${prefix}assets/images/favicon.png">
    <title>${escapeHTML(title)}</title>
    <meta name="description" content="${escapeHTML(description)}">
    <link rel="stylesheet" href="${prefix}assets/styles/site.css">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-61G7BKXNT6"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag("js", new Date());
      gtag("config", "G-61G7BKXNT6");
    </script>
  </head>
  <body data-depth="${depth}">
    <header class="site-header">
      <div class="nav-shell">
        <a class="brand" href="${prefix}index.html"><span class="brand-mark" aria-hidden="true"><span class="mark-c">C</span><span class="mark-p">P</span></span><span>ControlPointAI</span></a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a href="${prefix}services/index.html">Services</a>
          <a href="${prefix}mission/index.html">Method</a>
          <a href="${prefix}case-studies/index.html">Case Studies</a>
          <a href="${prefix}insights/index.html">Insights</a>
          <a href="${prefix}contact/index.html">Contact</a>
        </nav>
      </div>
    </header>
${main}
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <strong>ControlPointAI&trade;</strong>
          <p>AI data flow mapping and Control Point placement for high-consequence teams.</p>
          <p class="copyright">&copy; 2026 ControlPointAI. All Rights Reserved.</p>
        </div>
        <nav class="footer-links" aria-label="Footer navigation">
          <a href="/services/index.html">Services</a>
          <a href="/mission/index.html">Method</a>
          <a href="/case-studies/index.html">Case Studies</a>
          <a href="/insights/index.html">Insights</a>
        </nav>
        <div class="footer-cta">
          <span>Need to see where AI-generated work moves before it becomes action?</span>
          <a href="/contact/index.html">Start the conversation</a>
        </div>
      </div>
    </footer>
    <script src="${prefix}assets/scripts/site.js"></script>
  </body>
</html>
`;
}

function renderReportArticle(entry) {
  const { data, body } = entry;
  const title = data.title || "Case Study";
  const lead = data.summary || "";
  const { preface, mainBody } = splitPreface(body);
  const [baseline = "", issueDate = ""] = prefaceLines(preface);
  const documentStatus = data.document_status || "Current case study";
  const reportLabel = data.report_label || title;
  const pdfPath = data.pdf_path || "";
  const classificationHeading = data.classification_heading || data.document_notice || "Public-Source / Synthetic Case Study";
  const classificationNote =
    data.classification_note || "Fictional case data for AI-assisted engineering governance demonstration.";
  const docline = ["ControlPointAI&trade;", escapeHTML(reportLabel), escapeHTML(documentStatus)].filter(Boolean).join(" | ");

  return [
    '        <section class="case-report-cover">',
    `          <div class="case-report-docline">${docline}</div>`,
    `          <p class="eyebrow">${inlineMarkdown(data.eyebrow || "Case Study")}</p>`,
    `          <h1>${inlineMarkdown(title)}</h1>`,
    lead ? `          <p class="case-report-subtitle">${inlineMarkdown(lead)}</p>` : "",
    baseline ? `          <p class="case-report-baseline">${inlineMarkdown(baseline)}</p>` : "",
    issueDate ? `          <p class="case-report-date">${inlineMarkdown(issueDate)}</p>` : "",
    '          <div class="case-report-classification">',
    `            <strong>${inlineMarkdown(classificationHeading)}</strong>`,
    `            <span>${inlineMarkdown(classificationNote)}</span>`,
    "          </div>",
    pdfPath
      ? `          <a class="button ghost case-report-download" href="${escapeHTML(hrefForDepth(pdfPath, 2))}">Download formatted PDF</a>`
      : "",
    "        </section>",
    markdownToHtml(mainBody, { layout: "report" })
      .split("\n")
      .map((line) => `        ${line}`)
      .join("\n"),
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function renderStandardArticle(entry) {
  const { data, body } = entry;
  const title = data.title || "Case Study";
  const { preface, mainBody } = splitPreface(body);
  const lead = data.lead || prefaceLines(preface).join(" ") || data.summary || "";
  const pdfPath = data.pdf_path || "";

  return [
    `        <p class="eyebrow">${inlineMarkdown(data.eyebrow || "Case Study")}</p>`,
    `        <h1>${inlineMarkdown(title)}</h1>`,
    lead ? `        <p class="lead">${inlineMarkdown(lead)}</p>` : "",
    pdfPath ? `        <p><a class="button ghost" href="${escapeHTML(hrefForDepth(pdfPath, 2))}">Download PDF</a></p>` : "",
    markdownToHtml(mainBody, { layout: "article" })
      .split("\n")
      .map((line) => `        ${line}`)
      .join("\n"),
    data.source_url ? `        <p><a href="${escapeHTML(data.source_url)}">Read the original LinkedIn article</a></p>` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function renderSidebar(entry, isReport) {
  const principles = listValue(entry.data.key_principles);
  const pdfPath = entry.data.pdf_path || "";

  if (isReport) {
    return [
      '        <div class="case-report-sidebar-card">',
      "          <span>Document Status</span>",
      `          <strong>${inlineMarkdown(entry.data.document_status || "Current case study")}</strong>`,
      `          <p>${inlineMarkdown(entry.data.document_notice || "ControlPointAI case study")}</p>`,
      pdfPath ? `          <a class="button primary" href="${escapeHTML(hrefForDepth(pdfPath, 2))}">Download PDF</a>` : "",
      "        </div>",
      "        <h2>Key Principles</h2>",
      "        <ul>",
      ...principles.map((principle) => `          <li>${inlineMarkdown(principle)}</li>`),
      "        </ul>",
    ]
      .filter((line) => line !== "")
      .join("\n");
  }

  return [
    "        <h2>Key Principles</h2>",
    "        <ul>",
    ...principles.map((principle) => `          <li>${inlineMarkdown(principle)}</li>`),
    "        </ul>",
    pdfPath ? `        <a class="button ghost" href="${escapeHTML(hrefForDepth(pdfPath, 2))}">Download PDF</a>` : "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function renderCaseNav(entries, index) {
  const previous = entries[index - 1];
  const next = entries[index + 1];

  return [
    '        <nav class="case-nav" aria-label="Case study navigation">',
    previous
      ? `          <a href="../${escapeHTML(previous.data.live_path)}/index.html">Previous: ${inlineMarkdown(previous.data.title)}</a>`
      : "          <span></span>",
    next
      ? `          <a href="../${escapeHTML(next.data.live_path)}/index.html">Next: ${inlineMarkdown(next.data.title)}</a>`
      : "          <span></span>",
    "        </nav>",
  ].join("\n");
}

function renderCasePage(entry, entries, index) {
  const data = entry.data;
  const isReport = String(data.layout || (data.pdf_path ? "report" : "article")).toLowerCase() === "report";
  const articleContent = isReport ? renderReportArticle(entry) : renderStandardArticle(entry);
  const main = `    <main class="article-wrap${isReport ? " case-report-wrap" : ""}">
      <article class="article${isReport ? " case-report" : ""}">
        <a href="../index.html">Back to case studies</a>
${articleContent}
${renderCaseNav(entries, index)}
      </article>
      <aside class="sidebar${isReport ? " case-report-sidebar" : ""}">
${renderSidebar(entry, isReport)}
      </aside>
    </main>`;

  return pageShell({
    depth: 2,
    title: data.meta_title || `${data.title || "Case Study"} | ControlPointAI`,
    description:
      data.meta_description ||
      `${data.summary || "ControlPointAI case study."} ControlPointAI case study on AI data flow mapping and authority governance.`,
    main,
  });
}

function replaceGeneratedBlock(html, name, replacement) {
  const start = `          <!-- generated-${name}:start -->`;
  const end = `          <!-- generated-${name}:end -->`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing generated ${name} markers`);
  }

  return `${html.slice(0, startIndex)}${start}\n${replacement}\n${end}${html.slice(endIndex + end.length)}`;
}

function renderIndexCards(entries) {
  return entries
    .filter((entry) => entry.data.status === "featured")
    .map((entry) => {
      const data = entry.data;
      const themes = listValue(data.themes);
      const badgeClass = `badge${data.badge_variant ? ` ${escapeHTML(data.badge_variant)}` : ""}`;
      return [
        '          <article class="card compact-card">',
        data.card_image ? `            <img class="card-media" src="${escapeHTML(hrefForDepth(data.card_image, 1))}" alt="">` : "",
        `            <span class="${badgeClass}">${inlineMarkdown(data.eyebrow || "Case Study")}</span>`,
        `            <h3>${inlineMarkdown(data.title || "Case Study")}</h3>`,
        data.summary ? `            <p>${inlineMarkdown(data.summary)}</p>` : "",
        themes.length ? `            <ul class="theme-list">${themes.map((theme) => `<li>${inlineMarkdown(theme)}</li>`).join("")}</ul>` : "",
        `            <a href="${escapeHTML(data.live_path)}/index.html">Read case study</a>`,
        "          </article>",
      ]
        .filter((line) => line !== "")
        .join("\n");
    })
    .join("\n");
}

function buildCaseIndex(entries) {
  const current = fs.readFileSync(caseIndexPath, "utf8");
  const updated = replaceGeneratedBlock(current, "case-study-index", renderIndexCards(entries));
  fs.writeFileSync(caseIndexPath, updated);
  console.log(`Generated ${path.relative(root, caseIndexPath)} from ${path.relative(root, contentDir)}.`);
}

const entries = fs
  .readdirSync(contentDir)
  .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
  .map((file, index) => {
    const sourcePath = path.join(contentDir, file);
    const parsed = parseFrontMatter(fs.readFileSync(sourcePath, "utf8"), file);
    return {
      ...parsed,
      file,
      sourcePath,
      order: sortOrder(parsed.data.order, index + 1),
    };
  })
  .filter((entry) => entry.data.live_path)
  .sort((a, b) => a.order - b.order || a.file.localeCompare(b.file));

entries.forEach((entry, index) => {
  const outputPath = path.join(root, "case-studies", entry.data.live_path, "index.html");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderCasePage(entry, entries, index));
  console.log(`Generated ${path.relative(root, outputPath)} from ${path.relative(root, entry.sourcePath)}.`);
});

buildCaseIndex(entries);
