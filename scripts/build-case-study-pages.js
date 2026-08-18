const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

// Add entries here as existing static case-study pages are migrated to CMS output.
const generatedPages = [
  {
    source: "runtime-authority-enforcement.md",
    output: path.join("case-studies", "runtime-authority-enforcement", "index.html"),
    eyebrow: "Operational Governance",
  },
];

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
      currentMode = value ? "scalar" : "list";
      data[key] = value || [];
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

function markdownToHtml(markdown) {
  const html = [];
  let paragraph = [];
  let list = [];
  let table = [];
  let sectionOpen = false;

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

  function closeSection() {
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
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      flushTable();
      closeSection();
      const heading = trimmed.slice(3);
      html.push(`<section class="${sectionClass(heading)}">`);
      html.push(`<h2>${inlineMarkdown(heading)}</h2>`);
      sectionOpen = true;
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
  closeSection();
  return html.join("\n");
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

function replaceGeneratedBlock(html, name, replacement) {
  const start = `        <!-- generated-case-study-${name}:start -->`;
  const end = `        <!-- generated-case-study-${name}:end -->`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing generated case-study ${name} markers`);
  }

  return `${html.slice(0, startIndex)}${start}\n${replacement}\n${end}${html.slice(endIndex + end.length)}`;
}

function renderArticle(data, body, eyebrow) {
  const title = data.title || "Case Study";
  const lead = data.summary || "";
  const { preface, mainBody } = splitPreface(body);
  const [baseline = "", issueDate = ""] = prefaceLines(preface);
  const pdfPath = data.pdf_path || "";
  return [
    '        <section class="case-report-cover">',
    '          <div class="case-report-docline">ControlPointAI&trade; | RX Maintenance Case Study | Reissued August 2026</div>',
    `          <p class="eyebrow">${inlineMarkdown(eyebrow)}</p>`,
    `          <h1>${inlineMarkdown(title)}</h1>`,
    `          <p class="case-report-subtitle">${inlineMarkdown(lead)}</p>`,
    baseline ? `          <p class="case-report-baseline">${inlineMarkdown(baseline)}</p>` : "",
    issueDate ? `          <p class="case-report-date">${inlineMarkdown(issueDate)}</p>` : "",
    '          <div class="case-report-classification">',
    "            <strong>Public-Source / Synthetic Case Study</strong>",
    "            <span>Fictional case data for AI-assisted engineering governance demonstration.</span>",
    "          </div>",
    pdfPath
      ? `          <a class="button ghost case-report-download" href="${escapeHTML(pdfPath)}">Download formatted PDF</a>`
      : "",
    "        </section>",
    "",
    markdownToHtml(mainBody)
      .split("\n")
      .map((line) => `        ${line}`)
      .join("\n"),
  ].join("\n");
}

function renderSidebar(data) {
  const principles = Array.isArray(data.key_principles) ? data.key_principles : [];
  const pdfPath = data.pdf_path || "";
  return [
    '        <div class="case-report-sidebar-card">',
    "          <span>Document Status</span>",
    "          <strong>Reissued August 2026</strong>",
    "          <p>Public-source / synthetic case study</p>",
    pdfPath ? `          <a class="button primary" href="${escapeHTML(pdfPath)}">Download PDF</a>` : "",
    "        </div>",
    "        <h2>Key Principles</h2>",
    "        <ul>",
    ...principles.map((principle) => `          <li>${inlineMarkdown(principle)}</li>`),
    "        </ul>",
  ].join("\n");
}

generatedPages.forEach((page) => {
  const sourcePath = path.join(root, "content", "case-studies", page.source);
  const outputPath = path.join(root, page.output);
  const { data, body } = parseFrontMatter(fs.readFileSync(sourcePath, "utf8"), page.source);
  let html = fs.readFileSync(outputPath, "utf8");

  html = replaceGeneratedBlock(html, "content", renderArticle(data, body, page.eyebrow));
  html = replaceGeneratedBlock(html, "sidebar", renderSidebar(data));

  fs.writeFileSync(outputPath, html);
  console.log(`Generated ${path.relative(root, outputPath)} from ${path.relative(root, sourcePath)}.`);
});
