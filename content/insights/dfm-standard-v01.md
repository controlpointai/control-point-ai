---
id: dfm-standard-v01
order: 12
label: standard
title: ControlPointAI Data-Flow Mapping Standard — Version 2.0
publish_date: 2026-10-06T07:37:00.000-04:00
insights_tab_visibility: show
topic: runtime
image: ""
summary: ControlPointAI’s Data-Flow Mapping Standard Version 2.0 establishes
  consistent conventions for reading, assessing, and using our drawings—making
  information flows, system boundaries, human authority, control points, and
  supporting evidence clear and traceable.
author: Wayne Couch
slug_mode: automatic
meta_title_mode: automatic
meta_description_mode: automatic
related_service: ai-data-flow-mapping
cta: request-data-flow-mapping
---
# ControlPointAI Data-Flow Mapping Standard

**Version:** 2.0
**Status:** Approved
**Issued:** October 6, 2026  
**POAM Item:** 2-1  
**Applies to:** Phase 2 Prototype Engineering Package  
**Owner:** ControlPointAI

---

## 1. Purpose

This public standard defines the conventions for reading, assessing, and using ControlPointAI data-flow mapping products. It establishes consistent expectations for showing how information, AI analysis outputs, decisions, human authority, execution, and evidence relate within the mapped operational scope

The standard is intended to make ControlPointAI drawings understandable, traceable, configuration-controlled, and suitable for later comparison between the approved design, the as-built configuration, and the as-executed operating path.

---

## 2. Scope

This standard applies to:

- Prototype and client-facing system context drawings.
- Detailed data-flow drawings derived from an approved context drawing.
- Authority and control-point overlays tied to identified flows.
- As-designed and as-built configuration baselines that depend on the drawing set.
- Runtime evidence mapping used to reconstruct specific executions.

This version does not prescribe a software tool, file format, or industry-specific notation. The emphasis is on consistent engineering content and traceability rather than decorative presentation.

---

## 3. Governing Principles

### Data flows are the foundation

Authority, control points, cost, evidence, and recovery analysis are mapped against an established operating flow.

### Map what actually matters

A drawing should include only systems, actors, interfaces, and flows needed to understand the governed execution path.

### Separate data from authority

A system receiving or transmitting data does not, by itself, possess decision or execution authority.

### Distinguish intended from executed

The approved path and the path actually used during an event are separate engineering facts.

### Use control points only where consequential action can propagate

Control points are placed where validation is required before an action creates operational, financial, legal, safety, or other material effects.

### Preserve traceability

Every controlled drawing must carry a drawing number, revision, status, date, and relationship to the applicable baseline.

---

## 4. Drawing Hierarchy

The drawing set may contain the following product types. Each drawing identifies its scope and level of detail; the table describes what readers can expect from each product, rather than a required development sequence.

### Level 1 — System Context Drawing

Shows the system boundary, major systems/applications, human actors, external interfaces, and primary data flows.

### Level 2 — Detailed Data-Flow Drawings

Shows critical flows in greater detail, including their source, destination, information content, interfaces, and operational purpose.

### Level 3 — Authority / Control Overlay

Maps decision authority, execution authority, approvals, denials, holds, escalation, override, risk acceptance, and recovery points.

### Level 4 — Baseline / Runtime Comparison

Uses controlled drawings to compare as-designed, as-built, and as-executed states and identify divergence or drift.

---

## 5. Required Drawing Elements

Every controlled drawing should include, as applicable:

- A clearly labeled system or workflow boundary.
- Named internal systems, applications, AI components, and services relevant to the mapped execution path.
- Named external systems and interfaces where data or actions enter or leave the boundary.
- Human actors when they provide input, review, approval, override, escalation, risk acceptance, or execution authority.
- Directional arrows for every primary operational data flow.
- Unique flow identifiers for controlled flows.
- Control-point markers where applicable conditions and required human authority must be verified before consequential action.
- Evidence / record flows when reconstructability is part of the governed process.
- A legend defining symbols and line conventions used on the drawing.
- A controlled title block containing drawing number, title, revision, status, date, sheet, scale or NTS, baseline, and classification / handling designation as applicable.

---

## 6. Flow Identification and Conventions

The drawing legend defines the identifiers used on that drawing. F- identifies an operational flow, E- an evidence or record flow, and CP- a named control point where those conventions are used. Other identifiers are acceptable when clearly defined in the legend and used consistently.

### Standard identifiers

**F-01, F-02, ...**  
Primary operational data or execution flow.  
Default convention: solid directional arrow.

**E-01, E-02, ...**  
Evidence, audit, event, or record flow.  
Default convention: dashed directional arrow.

**CP-xxx**  
Named control point.  
Default convention: shield, gate marker, or labeled control-point box.

**System Boundary**  
Scope of the governed prototype or client system.  
Default convention: dashed boundary line with explicit label.

Arrow direction represents the direction of the mapped information, instruction, approval, action, or record.

Bidirectional exchange should normally be represented as two separately identified flows when the two directions carry materially different information or authority implications.

---

## 7. Required Flow Attributes

A context drawing may show only a flow identifier and concise label. For critical flows, the detailed drawing or its supporting documentation should provide the following information as applicable to the stated scope. Readers should be able to determine what moves, why it moves, and what authority, controls, and evidence apply.

### Flow ID

Unique controlled identifier.

### Source

System, application, actor, or service originating the flow.

### Destination

System, application, actor, or service receiving the flow.

### Data / Object

What is actually moving: request, transaction, recommendation, approval, record, command, status, or other operational object.

### Trigger

Event or condition that initiates the flow.

### Interface / Mechanism

API, message, user interface, file, queue, human entry, workflow action, or other known interface.

### Purpose

Why the flow exists and what operational effect it supports.

### Authority Relevance

Whether the flow contains, requests, changes, delegates, or depends on decision or execution authority.

### Control Requirement

Whether a control point is required before the flow may create consequential effect.

### Evidence Requirement

What record is required to show that the flow and associated control operated as intended.

---

## 8. Boundary Rules

- Every drawing must state what is inside the governed boundary and what remains external.
- A boundary is not an authority statement. External actors may still hold approval, risk-acceptance, or execution authority.
- Cross-boundary flows must be explicitly shown; hidden interfaces are not acceptable on a controlled drawing.
- Where a boundary assumption is uncertain, the drawing must identify the assumption rather than present it as confirmed fact.
- Material boundary changes require revision of the affected drawing and baseline.

---

## 9. Authority and Control-Point Representation

Information movement does not, by itself, establish authority. The drawing or its supporting documentation identifies the relevant decision and execution authority for consequential transitions as follows:

### Decision Authority

Decision authority identifies the accountable human role or organization authorized to make the governing decision. AI analysis may support that decision within its stated scope.

### Execution Authority

Execution authority identifies the role or organization authorized to release the approved action for execution.

### Risk Acceptance

Identifies the accountable human or organization authorized to accept defined operational risk.

### Human Control

Human review, approval, denial, hold, escalation, and override are shown explicitly when required.

### Control Points

A control point marks where applicable conditions and required approvals must be verified before consequential action proceeds.

A control point should identify the conditions it evaluates, such as:

- identity
- consent
- policy
- scope
- budget or funds
- schedule
- risk
- configuration
- required human approval

---

## 10. Evidence and Reconstructability

Where a governed action can create material effect, the mapping should identify the evidence needed to reconstruct the execution within its stated scope. Evidence is not a substitute for control; it supports review of the relevant inputs, AI analysis outputs, authority, human approvals, and actions that occurred.

Relevant evidence may include:

- input or request record
- AI analysis output used to support the decision, where applicable.
- active configuration or version information where material
- authority and policy state evaluated at the control point
- human approval, denial, hold, escalation, or override when applicable
- action actually released to the execution system
- resulting status or response
- recovery action when required

---

## 11. Drawing Title Block and Configuration Control

Every controlled drawing shall include, as applicable:

- Drawing number
- Drawing title
- Scenario or project
- Revision
- Issue date
- Status
- Sheet number
- Scale or NTS
- Applicable baseline
- Classification or handling designation

Typical status values may include:

- Draft
- Issued for Review
- Issued
- Superseded

Revision changes must be traceable.

A material change to a system boundary, critical flow, interface, authority path, control point, or evidence requirement requires evaluation for drawing revision and, when applicable, baseline reapproval.

---

## 12. Drawing Development Sequence

Development procedures are outside the scope of this public standard. The following checklist helps readers assess the content and limitations of an issued drawing.

---

## 13. Minimum Drawing Review Checklist

Before a controlled drawing is issued, confirm:

- Is the purpose of the drawing clear?
- Is the system boundary explicit?
- Are all material systems, applications, AI components, actors, and external interfaces shown?
- Can every critical arrow be explained in plain language?
- Does every controlled flow have a unique identifier?
- Are data flow and authority flow kept conceptually distinct?
- Are human authority and risk acceptance explicit where required?
- Are control points placed before consequential execution, not after it?
- Can the evidence needed to reconstruct the execution be identified?
- Does the title block accurately identify the revision and issue status?
- Do the drawing and associated registers agree with the applicable baseline?

---

## 14. Phase 2 Prototype Application

The issued piping UT demonstration drawing, CP-UT-DFD-001, Revision A, illustrates the transition from work-package initiation at Node 1 to inspection-basis and criteria determination at Node 2. It provides a practical example of information movement, AI assistance, human technical authority, and controlled progression within the scope shown.

The drawing should be read with its legend, title block, and stated scope. It covers the Node 1 to Node 2 transition; it does not represent the complete UT inspection process or establish authority beyond that scope.


## 15. Controlled Draft Status

Version 2.0 is an update to Version 0.1, issued August 8, 2026. This public standard establishes drawing conventions and deliverable expectations; internal development procedures remain outside its scope. The standard will continue to be revised based on practical use.

---

**ControlPointAI**  
**Data-Flow Mapping Standard — Version 2.0 **  
**Issued October 6, 2026**
