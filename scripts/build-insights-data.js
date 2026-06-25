const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const postsDir = path.join(root, "content", "insights");
const outputPath = path.join(root, "assets", "scripts", "insights-data.js");

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

  frontMatter.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) return;
    const [, key, value] = match;
    data[key] = value.replace(/^"|"$/g, "");
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
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function repairImportedText(value) {
  const replacements = [
    ["correctiveactionprograms", "corrective action programs"],
    ["Actions(STCA)establishimmediatecontrolsthat", "Actions (STCA) establish immediate controls that"],
    ["allowworktocontinuesafelyunderrestrictedconditions", "allow work to continue safely under restricted conditions"],
    ["safely resume. corrective action programs.", "safely resume. Corrective action programs address this explicitly."],
    ["questionreceivesfarless", "question receives far less"],
    ["aftera governance", "after a governance"],
    ["Despiterobustprocesses", "Despite robust processes"],
    ["failuresstillhappen", "failures still happen"],
    ["When theydo", "When they do"],
    ["conditionsmust", "conditions must"],
    ["Itis deliberatelyreviewed", "It is deliberately reviewed"],
    ["andrestored", "and restored"],
    ["AI systemsbecome", "AI systems become"],
    ["Whodeterminesthatcorrective", "Who determines that corrective"],
    ["Whoreviewstheevidence", "Who reviews the evidence"],
    ["Whoauthorizesthereturnto", "Who authorizes the return to"],
    ["These arefundamentally", "These are fundamentally"],
    ["organizations haveunderstood", "organizations have understood"],
    ["whenfailure", "when failure"],
    ["articleshighlighted", "articles highlighted"],
    ["todependingon", "to depending on"],
    ["becomesembeddedinbusinessprocesses", "becomes embedded in business processes"],
    ["theconsequences", "the consequences"],
    ["farbeyond", "far beyond"],
    ["allbecomestakeholdersinthe", "all become stakeholders in the"],
    ["Atsomepoint", "At some point"],
    ["Thatrealityshiftsthe", "That reality shifts the"],
    ["discussionfrom", "discussion from"],
    ["fromtechnologymanagementto", "from technology management to"],
    ["ultimatelyshapedthedirectionof", "ultimately shaped the direction of"],
    ["Issue10", "Issue 10"],
    ["Phase1of", "Phase 1 of"],
    ["thisnewsletterseriescomestoaclose", "this newsletter series comes to a close"],
    ["identifyrecurringpatterns", "identify recurring patterns"],
    ["Overtime", "Over time"],
    ["Questionsofaccountabilityarenowevolvingintoquestionsof", "Questions of accountability are now evolving into questions of"],
    ["Thoseobservations", "Those observations"],
    ["thenext", "the next"],
    ["Andwhengovernancefails", "And when governance fails"],
    ["howis authority", "how is authority"],
    ["no longerkeeppace", "no longer keep pace"],
    ["butbecauseitis", "but because it is"],
    ["atthepoint ofexecution", "at the point of execution"],
    ["battlefieldcapabilitiesintocivilianandpartnerenvironments", "battlefield capabilities into civilian and partner environments"],
    ["severalpatterns", "several patterns"],
    ["Compressionof timebetweendetection", "Compression of time between detection"],
    ["Pre-executionconstraintenforcement", "Pre-execution constraint enforcement"],
    ["Real-timemonitoring", "Real-time monitoring"],
    ["theyarenow beingintroducedintoenvironmentsgovernedbycivilian", "they are now being introduced into environments governed by civilian"],
    ["alreadycrossed", "already crossed"],
    ["onrapid", "on rapid"],
    ["Interestinlayereddefensesmodeledonbattlefield", "Interest in layered defenses modeled on battlefield"],
    ["securitycontexts", "security contexts"],
    ["occurinseconds", "occur in seconds"],
    ["threatsmay", "threats may"],
    ["overhow", "over how"],
    ["atexactly themomentitmattersmost", "at exactly the moment it matters most"],
    ["Asbattlefieldcapabilitiesmoveintocivilianenvironments", "As battlefield capabilities move into civilian environments"],
    ["cannotremainexternaltothe", "cannot remain external to the"],
    ["At thepoint", "At the point"],
    ["madeinseconds", "made in seconds"],
    ["deliberatereview", "deliberate review"],
    ["Theresult", "The result"],
    ["Acrossdefense", "Across defense"],
    ["publicsafety", "public safety"],
    ["andcriticalinfrastructuredomains", "and critical infrastructure domains"],
    ["systemsinto", "systems into"],
    ["Thesolution isnotsimplyto", "The solution is not simply to"],
    ["Itistore-engineerhowauthorityisstructuredandexecutedatspeed", "It is to re-engineer how authority is structured and executed at speed"],
    ["andaccountabilitymustbeembeddeddirectlyinto", "and accountability must be embedded directly into"],
    ["Fromhuman-pacedcontroltocontrolpointsoperating", "From human-paced control to control points operating"],
    ["atmachine speed", "at machine speed"],
    ["AI igning", "Aligning"],
    ["aprerequisitefor", "a prerequisite for"],
    ["exploredmultiple", "explored multiple"],
    ["The Problem Something is off.", "The Problem\n\nSomething is off."],
    ["The Signal This model", "The Signal\n\nThis model"],
    ["The Shift Control Point AI", "The Shift\n\nControl Point AI"],
    ["The System (Control Point AI Operating Model)", "The System\n\n(Control Point AI Operating Model)"],
    ["Authority Roles (Who holds authority)", "Authority Roles\n\nWho holds authority"],
    ["Control Layers (How Authority is Enforced)", "Control Layers\n\nHow authority is enforced"],
    ["Execution Layer (How Authority is Executed)", "Execution Layer\n\nHow authority is executed"],
    ["Example: Execution Under Control", "Example: Execution Under Control\n\n"],
    ["Bottom Line AI is not autonomous.", "Bottom Line\n\nAI is not autonomous."],
    ["CLOSING THOUGHTS", "Closing Thoughts"],
    ["Like ?Share", ""],
    ["1?1comment — Share R", ""],
    ["5?3 comments — Share", ""],
    ["How does accountability flow through the system are not technical questions.", "How does accountability flow through the system.\n\nThese are not technical questions."],
    ["Could it summarize documents Analyze data Generate code Improve productivity Reduce costs", "Could it summarize documents? Analyze data? Generate code? Improve productivity? Reduce costs?"],
    ['"What can the AI do" It may be:', '"What can the AI do?" It may be:'],
    ['"Who owns the risk when the AI influences a decision" remains incomplete.', '"Who owns the risk when the AI influences a decision?" That question remains incomplete.'],
  ];

  return replacements.reduce((text, [from, to]) => text.replaceAll(from, to), value);
}

function formatImportedMarkdown(markdown) {
  let formatted = repairImportedText(markdown);
  const sectionBreaks = [
    "Signal Statement",
    "What Changed",
    "Operational Reinforcement",
    "Why This Matters",
    "Key Insight",
    "Framework Introduction",
    "Phase 1 Reflection",
    "Where Do We Go From Here",
    "Reality Signal Statement",
  ];

  sectionBreaks.forEach((label) => {
    const pattern = new RegExp(`([^\\n])\\s+(${label})(?=\\s)`, "g");
    formatted = formatted.replace(pattern, `$1\n\n### $2`);
  });

  return formatted
    .replace(/\s+\?([A-Z][A-Za-z -]{3,80})(?=\s)/g, "\n- $1 ")
    .replace(/\s+•\s*([A-Z][A-Za-z -]{3,80})(?=\s)/g, "\n- $1 ")
    .replace(/:\s+Who has decision authority/g, ":\n\n- Who has decision authority")
    .replace(/\s+Who can intervene/g, "\n- Who can intervene")
    .replace(/\s+Who can override/g, "\n- Who can override")
    .replace(/\s+Who accepts/g, "\n- Who accepts")
    .replace(/\s+How does accountability/g, "\n- How does accountability")
    .replace(/(\S)\s+(The critical question will be:)/g, "$1\n\n$2")
    .replace(/(\S)\s+(Questions such as:)/g, "$1\n\n$2")
    .replace(/(\S)\s+(Authority to resume normal operations)/g, "$1\n\n$2")
    .replace(/(\S)\s+(As AI systems become embedded)/g, "$1\n\n$2")
    .replace(/(\S)\s+(For decades, engineering organizations)/g, "$1\n\n$2")
    .replace(/(\S)\s+(As AI adoption accelerates)/g, "$1\n\n$2");
}

function markdownToHtml(markdown) {
  const html = [];
  let paragraph = [];
  let list = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  }

  formatImportedMarkdown(markdown).split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    if (trimmed === "-") {
      flushParagraph();
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      return;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^[-*•]\s+/, ""));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      html.push(`<blockquote>${inlineMarkdown(trimmed.slice(2))}</blockquote>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();
  return html.join("\n");
}

function normalizeDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function isPublished(data, now = new Date()) {
  if (!data.publish_date) return true;
  const date = new Date(data.publish_date);
  if (Number.isNaN(date.getTime())) return true;
  return date.getTime() <= now.getTime();
}

const posts = fs
  .readdirSync(postsDir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const filePath = path.join(postsDir, file);
    const { data, body } = parseFrontMatter(fs.readFileSync(filePath, "utf8"), file);
    const id = data.id || path.basename(file, ".md");
    const order = Number(data.order || 0);

    return {
      id,
      order,
      label: data.label || `Issue ${order}`,
      title: data.title || id,
      topic: data.topic || "analysis",
      url: `insights/post/index.html?issue=${id}`,
      image: data.image || "assets/images/newsletter-authority-engineering.jpg",
      publishDate: normalizeDate(data.publish_date),
      summary: data.summary || "",
      sections: [
        {
          heading: "Core Argument",
          body: data.summary || "",
        },
      ],
      body,
      isPublished: isPublished(data),
    };
  })
  .filter((post) => post.isPublished)
  .sort((a, b) => a.order - b.order);

const insightTracks = posts.map(({ body, isPublished, ...item }) => item);
const newsletterBodies = posts.reduce((all, post) => {
  all[post.id] = markdownToHtml(post.body);
  return all;
}, {});

const output = `// This file is generated by scripts/build-insights-data.js.\n// Edit content in content/insights/*.md through Decap CMS.\nwindow.insightTracks = ${JSON.stringify(insightTracks, null, 2)};\nvar newsletterBodies = ${JSON.stringify(newsletterBodies, null, 2)};\n`;

fs.writeFileSync(outputPath, output);
console.log(`Generated ${path.relative(root, outputPath)} from ${posts.length} insight posts.`);
