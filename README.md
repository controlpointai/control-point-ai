# ControlPointAI Website

Static marketing website for ControlPointAI, built from the Phase 2 PRD, mission materials, case studies, profile materials, and newsletter archive.

## Pages

- `index.html` - homepage / landing page
- `services/` - primary offer and engagement paths
- `mission/` - method, mission, and vision
- `insights/` - readable newsletter archive and individual article view
- `case-studies/` - case-study index
- `case-studies/runtime-authority-enforcement/`
- `case-studies/unauthorized-concept-drift/`
- `case-studies/context-disruption-ui-intervention/`
- `demo/` - legacy redirect to services
- `contact/` - inquiry page

## Assets

- `assets/styles/site.css` - shared responsive styling
- `assets/scripts/site.js` - navigation, newsletter archive rendering, article routing, sorting, and contact form behavior
- `assets/scripts/newsletter-content.js` - newsletter issue content

## Preview

Open `index.html` directly in a browser, or run a local static server from this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/`.

## Framework Notes

ControlPointAI explores execution-bound authority for AI-enabled systems.

Focus areas include:

- AI data flow mapping
- runtime authority validation
- operational governance
- refusal-path enforcement
- dynamic authority continuity at t + Delta t
- auditability and post-action accountability

## What Problem Are We Solving?

Many current AI governance approaches focus primarily on model review, policy documentation, or post-event auditability.

ControlPointAI explores a different operational question:

How can authority remain valid and enforceable during execution as conditions change over time?

This becomes increasingly important as AI systems move from productivity tools into operational infrastructure and decision-support environments.

## Core Concepts

- execution-bound authority
- runtime governance
- operational risk ownership
- dynamic validation at t + Delta t
- authority envelopes
- refusal-path enforcement
- post-action accountability

## Why Traditional Governance Falls Short

Many governance approaches can document approvals or demonstrate policy intent, but cannot dynamically enforce operational authority during runtime execution.

ControlPointAI focuses on governance embedded directly into execution pathways rather than governance existing only as documentation, review, or after-action analysis.

## 1-Page Execution Pattern

Each ControlPointAI example should be written as a simple execution pattern:

### 1. Scenario

Describe the operational situation in plain language.

Example: An AI-enabled work system generates tasking instructions based on initial authorization.

### 2. Authority State

Define what authority exists at t0.

Who authorized the action? What conditions made the action valid? What limits or constraints applied?

### 3. Failure Mode

Describe what changes by t + Delta t.

Examples:

- authority owner changes
- funding or threshold changes
- human approval expires
- operational condition changes
- risk level changes

### 4. Control Point

Identify where execution should be checked before action continues.

The control point asks:

Is authority still valid now?

### 5. Execution Flow

Show the basic flow:

Request -> Authority Check -> Condition Change -> Revalidation -> Execute / Refuse / Escalate

### 6. Operational Ownership

Identify who owns the risk if the system acts incorrectly.

This includes:

- system owner
- process owner
- approving authority
- accountable human decision-maker

Anchor line:

Authority must remain valid at t + Delta t.

## Relationship to AI-1, AI-3, and AI-4

ControlPointAI builds progressively across earlier governance concepts:

### AI-1

Established foundational concerns around AI governance, authority definition, accountability, and operational trust in AI-enabled systems.

### AI-3

Expanded the discussion into runtime authority drift, changing operational conditions, and the distinction between static authorization and dynamic execution governance.

### AI-4

Extended the framework into operational risk ownership, evidentiary considerations, execution accountability, and governance continuity during real-world operational use.

ControlPointAI serves as an execution-focused integration layer connecting these concepts into reusable operational governance patterns.
