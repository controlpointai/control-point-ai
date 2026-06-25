const insightTracks = window.insightTracks || [
  {
    id: "ai1",
    order: 1,
    label: "Issue 1",
    title: "Why Faster AI Doesn't Matter If Authority Is Still Slow",
    topic: "runtime",
    url: "insights/post/index.html?issue=ai1",

    image: "assets/images/newsletter-ai1.jpg",
    summary:
      "Introduces the central ControlPointAI concern: AI can move quickly, but consequential work still depends on valid authority at the point of execution.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "Speed is not the same as authority. ControlPointAI frames the first problem of operational AI as a mismatch between how quickly systems can generate action and how slowly organizations validate who is allowed to execute that action.",
      },
      {
        heading: "Why It Matters",
        body:
          "In consequential work, an AI-generated recommendation can create pressure to act before the authority boundary has been confirmed. The risk is not only bad output. It is a fast output entering a slow authorization environment.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "ControlPointAI starts from a simple rule: before AI-assisted work moves into execution, the system has to confirm that the right person, condition, and authority are still aligned.",
      },
    ],
  },
  {
    id: "ai2",
    order: 2,
    label: "Issue 2",
    title: "When AI Moves Faster",
    topic: "operations",
    url: "insights/post/index.html?issue=ai2",

    image: "assets/images/newsletter-ai2.jpg",
    summary:
      "Frames the gap between technology, governance, and operations when AI-assisted work accelerates beyond traditional review cycles.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "ControlPointAI separates AI adoption into three linked domains: technology, governance, and operations. The issue is not whether AI can move faster. The issue is whether governance can keep authority connected to the operational consequence.",
      },
      {
        heading: "Operational Lens",
        body:
          "When AI reaches real workflows, policy statements are not enough. Leaders need a way to see whether a recommendation, agent action, or automated handoff remains inside an approved operating boundary.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "Useful AI governance has to travel with the work. It should not sit upstream as a one-time approval that loses force once the system begins producing outputs.",
      },
    ],
  },
  {
    id: "ai3",
    order: 3,
    label: "Issue 3",
    title: "Technology Is Moving Faster Than Authority",
    topic: "analysis",
    url: "insights/post/index.html?issue=ai3",

    image: "assets/images/newsletter-ai3.jpg",
    summary:
      "Explores why governance has to account for delegation, consequence boundaries, accountability chains, revocation, and override.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "This issue names the authority engineering problem directly: AI capability is expanding faster than the organizational structures that decide what it is allowed to do.",
      },
      {
        heading: "Control Dimensions",
        body:
          "The cover highlights the recurring dimensions ControlPointAI keeps returning to: governance, delegation, consequence boundaries, accountability chains, revocation, and override.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "An AI system is not governed just because it has a policy wrapper. Governance becomes real when authority can be delegated, limited, revoked, challenged, and traced.",
      },
    ],
  },
  {
    id: "ai4",
    order: 4,
    label: "Issue 4",
    title: "From Algorithms to Authority",
    topic: "operations",
    url: "insights/post/index.html?issue=ai4",

    image: "assets/images/newsletter-ai4.jpg",
    summary:
      "Positions Authority Engineering as the bridge between AI capability, governance intent, and operational execution.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "ControlPointAI reframes the AI governance conversation away from models alone and toward authority. The question is not only what the algorithm can produce, but what it is authorized to cause in a real operating environment.",
      },
      {
        heading: "Authority Engineering",
        body:
          "Authority Engineering becomes the doorway between technology and operations. It asks whether governance can constrain execution, not merely document intent.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "Leaders need mechanisms that translate governance into operational behavior: controls, decision gates, traceability, and clear human accountability.",
      },
    ],
  },
  {
    id: "ai5",
    order: 5,
    label: "Issue 5",
    title: "When Authority Breaks at Machine Speed",
    topic: "runtime",
    url: "insights/post/index.html?issue=ai5",

    image: "assets/images/newsletter-ai5.jpg",
    summary:
      "Presents the HCAI / Control Point AI framework as an execution-bound loop for defining, constraining, monitoring, auditing, and refining authority.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "This issue introduces a framework view of Control Point AI: authority definition, runtime constraints, execution monitoring, and post-action accountability.",
      },
      {
        heading: "Framework Logic",
        body:
          "The framework treats authority as a dynamic validation loop. It has to be defined before action, constrained during action, monitored as conditions change, audited afterward, and refined based on what was learned.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "AI governance fails when it is only front-loaded. The control point must exist at execution, where the work, the risk, and the authority all meet.",
      },
    ],
  },
  {
    id: "ai6",
    order: 6,
    label: "Issue 6",
    title: "Authority Gap at Execution",
    topic: "runtime",
    url: "insights/post/index.html?issue=ai6",

    image: "assets/images/newsletter-ai6.jpg",
    summary:
      "Shows how a defined authority model can still fail when invalid authority is allowed to execute without a live control point.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "A governance model can look valid on paper and still fail at execution. ControlPointAI calls attention to the moment where an AI-assisted action attempts to pass from recommendation into operational effect.",
      },
      {
        heading: "Execution Gap",
        body:
          "The gap appears when defined authority sits on one side and attempted execution sits on the other. The control point is the mechanism that should prevent invalid authority from crossing that boundary.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "The critical question is not whether a workflow was approved once. It is whether the authority remains valid at the moment the system or human actor tries to execute.",
      },
    ],
  },
  {
    id: "ai7",
    order: 7,
    label: "Issue 7",
    title: "Closing the Authority Gap at the Point of Execution",
    topic: "runtime",
    url: "insights/post/index.html?issue=ai7",

    image: "assets/images/newsletter-ai7.jpg",
    summary:
      "Maps the Control Point AI idea across model outputs, agents, governance layers, policy, dashboards, and audit evidence.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "This issue turns the execution authority gap into a system map. AI outputs, agents, governance layers, dashboards, policies, and audits all have to connect to the same authority boundary.",
      },
      {
        heading: "System View",
        body:
          "The control point is not a single button. It is a governance position in the system where authority can be checked before downstream effects occur.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "Closing the gap requires design discipline across the full stack: user action, model output, agent behavior, governance control, audit trail, and accountable decision authority.",
      },
    ],
  },
  {
    id: "ai8",
    order: 8,
    label: "Issue 8",
    title: "The Control Point",
    topic: "operations",
    url: "insights/post/index.html?issue=ai8",

    image: "assets/images/newsletter-ai8.jpg",
    summary:
      "Defines the control point as the moment where authority, governance, and system behavior must be checked before AI can act.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "ControlPointAI defines the control point as the place where authority becomes enforceable. It is the checkpoint between AI capability and AI action.",
      },
      {
        heading: "Delta Thinking",
        body:
          "The issue emphasizes change over time. A system may be evaluated at one point, but the world can change afterward. The control point asks what changed, whether it matters, and whether execution is still authorized.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "If an AI can act, it must pass a control point before it does. That is the practical heart of ControlPointAI.",
      },
    ],
  },
  {
    id: "ai9",
    order: 9,
    label: "Issue 9",
    title: "The Execution Authority Gap",
    topic: "analysis",
    url: "insights/post/index.html?issue=ai9",

    image: "assets/images/newsletter-ai9.jpg",
    summary:
      "The key reference for Data Flow Mapping: explains how AI-generated work can propagate through connected systems before authority is validated.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "This issue expands the execution authority gap into a practical operating model. The gap is where AI-generated work can influence action faster than human authority can validate it.",
      },
      {
        heading: "Operating Model",
        body:
          "The ControlPointAI diagram connects governance layers, decision paths, control points, audit evidence, and corrective feedback. The result is a way to see where authority can break before consequences appear.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "The gap is not solved by more policy alone. It is solved by designing authority checks into the flow of execution.",
      },
    ],
  },
  {
    id: "ai10",
    order: 10,
    label: "Issue 10",
    title: "What Six Months of Watching AI Taught Me",
    topic: "interface",
    url: "insights/post/index.html?issue=ai10",

    image: "assets/images/newsletter-ai10.jpg",
    summary:
      "A reflective issue on what ControlPointAI observed while watching AI systems move from early exploration toward governance and product reality.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "ControlPointAI uses this issue to reflect on the first phase of observing AI: what changed, what became clearer, and why the next phase has to move from observation into governance formation.",
      },
      {
        heading: "Phase Shift",
        body:
          "The cover frames the transition from Phase 1 Observe to Phase 2 Build. That shift is important because governance has to move from diagnosis into usable patterns, tools, and control concepts.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "Watching AI is no longer enough. Leaders need to build governance structures that can hold when AI enters real work.",
      },
    ],
  },
  {
    id: "aics1",
    order: 9.5,
    label: "Case Study 001",
    title: "Unauthorized Concept Drift During AI Analysis",
    topic: "analysis",
    url: "insights/post/index.html?issue=aics1",

    image: "assets/images/newsletter-aics1.jpg",
    summary:
      "A case-study entry point into how terms, frameworks, and assumptions can drift away from approved authority during AI-supported analysis.",
    sections: [
      {
        heading: "Core Argument",
        body:
          "This case study shows how an unauthorized concept can enter AI-assisted analysis, be rejected, and then later reappear without proper traceability.",
      },
      {
        heading: "Governance Problem",
        body:
          "The issue is concept drift inside analytical authority. When a term or framework lacks approval, it can still shape downstream reasoning if the system does not preserve rejection memory.",
      },
      {
        heading: "Governance Takeaway",
        body:
          "AI-supported analysis needs source authority, rejection memory, and controlled terminology. Otherwise, unapproved concepts can quietly become part of the working baseline.",
      },
    ],
  },
];

let activeArchiveFilter = "all";
let activeArchiveSort = "newest";

function rootPrefix() {
  const depth = document.body.dataset.depth || "0";
  return "../".repeat(Number(depth));
}

function assetPath(path) {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("/")) return path;
  return `${rootPrefix()}${path}`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderNewsletterBody(item) {
  const body = typeof newsletterBodies !== "undefined" ? newsletterBodies[item.id] : "";
  if (!body) {
    return item.sections
      .map(
        (section) => `
          <section>
            <h2>${escapeHTML(section.heading)}</h2>
            <p>${escapeHTML(section.body)}</p>
          </section>
        `
      )
      .join("");
  }
  return body;
}

function markActiveNav() {
  const path = window.location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const href = new URL(link.getAttribute("href"), window.location.href).pathname.replace(/\/index\.html$/, "/");
    if (href === path || (href !== "/" && path.startsWith(href))) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function renderNewsletterArchive(filter = activeArchiveFilter, sort = activeArchiveSort) {
  const host = document.querySelector("[data-newsletter-archive]");
  if (!host) return;
  const prefix = rootPrefix();
  activeArchiveFilter = filter;
  activeArchiveSort = sort;
  const visible = insightTracks
    .filter((item) => filter === "all" || item.topic === filter)
    .sort((a, b) => (sort === "oldest" ? a.order - b.order : b.order - a.order));
  host.innerHTML = visible
    .map(
      (item) => `
        <article class="card">
          <img class="card-media" src="${assetPath(item.image)}" alt="">
          <span class="badge">${item.label}</span>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <div class="actions">
            <a class="button ghost" href="${prefix}${item.url}">Read ${item.title}</a>
          </div>
        </article>
      `
    )
    .join("");
}

function renderInsightPost() {
  const host = document.querySelector("[data-insight-post]");
  if (!host) return;
  const issue = new URLSearchParams(window.location.search).get("issue") || "ai1";
  const item = insightTracks.find((track) => track.id === issue) || insightTracks[0];
  const prefix = rootPrefix();
  const topicLabel = {
    runtime: "Runtime authority",
    operations: "Operations",
    analysis: "Analysis",
    interface: "Interface governance",
  }[item.topic] || item.topic;
  document.title = `${item.title} | ControlPointAI`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      `${item.summary} ControlPointAI insight on AI data flow mapping, Control Point placement, and authority validation.`
    );
  }
  host.innerHTML = `
    <article class="article">
      <p class="eyebrow">${item.label}</p>
      <h1>${item.title}</h1>
      <p class="lead">${item.summary}</p>
      <img class="article-hero-image" src="${assetPath(item.image)}" alt="">
      ${renderNewsletterBody(item)}
      <div class="quote-callout">ControlPointAI principle: map where AI-generated work moves, then place Control Points before operational effects propagate.</div>
      <div class="case-nav">
        <a href="${prefix}insights/index.html">Back to Insights</a>
        <a href="${prefix}contact/index.html">Request Data Flow Mapping</a>
      </div>
    </article>
    <aside class="sidebar">
      <h2>Issue Context</h2>
      <ul class="credential-list">
        <li><strong>Publication:</strong> ${item.label}</li>
        <li><strong>Theme:</strong> ${topicLabel}</li>
        <li><strong>Format:</strong> ControlPointAI field note</li>
      </ul>
      <a class="button ghost" href="${prefix}contact/index.html">Request Data Flow Mapping</a>
    </aside>
  `;
}

function wireArchiveFilters() {
  const controls = document.querySelector("[data-archive-controls]");
  const sortControls = document.querySelector("[data-sort-controls]");
  if (controls) controls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    controls.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderNewsletterArchive(button.dataset.filter, activeArchiveSort);
  });
  if (sortControls) sortControls.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sort]");
    if (!button) return;
    sortControls.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderNewsletterArchive(activeArchiveFilter, button.dataset.sort);
  });
}

function wireContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const note = document.querySelector("[data-form-status]");
  if (!form || !note) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const endpoint = form.dataset.endpoint || form.getAttribute("action") || "";
    const button = form.querySelector('button[type="submit"]');
    const payload = {
      name: data.get("name") || "",
      email: data.get("email") || "",
      concern: data.get("concern") || "",
      workflow: data.get("workflow") || "",
    };

    if (data.get("company_website")) return;

    if (!endpoint) {
      note.textContent = "This form needs a delivery endpoint before launch. Once connected, inquiries will send directly to ControlPointAI.";
      return;
    }

    note.textContent = "Sending your inquiry...";
    if (button) button.disabled = true;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Form submission failed");

      form.reset();
      note.textContent = "Thank you. Your note has been sent to ControlPointAI.";
    } catch (error) {
      note.textContent = "Something went wrong while sending. Please try again in a moment.";
    } finally {
      if (button) button.disabled = false;
    }
  });
}

markActiveNav();
renderNewsletterArchive();
renderInsightPost();
wireArchiveFilters();
wireContactForm();
