---
id: dfm-standard-v01
order: 12
label: standard
title: ControlPointAI Data-Flow Mapping Standard — Version 0.1
publish_date: 2026-08-08T17:59:00.000-04:00
topic: runtime
image: ""
summary: ControlPointAI Version 0.1 establishes the initial controlled standard
  for mapping AI-enabled data flows, system boundaries, authority, control
  points, evidence, and configuration-controlled engineering drawings.
---
# ControlPointAI Data-Flow Mapping Standard

**Version:** 0.1  
**Status:** Controlled Draft  
**Issued:** August 8, 2026  
**POAM Item:** 2-1  
**Applies to:** Phase 2 Prototype Engineering Package  
**Owner:** ControlPointAI

---

## 1. Purpose

This standard defines the minimum conventions for creating ControlPointAI data-flow mapping products. It establishes a repeatable engineering method for showing how data, AI-generated work, decisions, authority, execution, and evidence move through an operational system.

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

ControlPointAI mapping proceeds from broad context to increasingly detailed controlled products.

### Level 1 — System Context Drawing

Shows the system boundary, major systems/applications, human actors, external interfaces, and primary data flows.

### Level 2 — Detailed Data-Flow Drawings

Decomposes each critical flow into source, destination, data/object, interface, direction, trigger, and operational purpose.

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
- Control-point markers where runtime validation is required before consequential action.
- Evidence / record flows when reconstructability is part of the governed process.
- A legend defining symbols and line conventions used on the drawing.
- A controlled title block containing drawing number, title, revision, status, date, sheet, scale or NTS, baseline, and classification / handling designation as applicable.

---

## 6. Flow Identification and Conventions

Primary operational flows are assigned sequential identifiers using the prefix **F-**.

Evidence or record flows use the prefix **E-**.

Control-point identifiers may be added in later drawings using a **CP-** prefix when a reusable or separately registered control point is established.

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

The system context drawing may show only the flow identifier and a concise label.

The detailed drawing set or associated flow register should capture, at minimum, the following attributes for each critical flow:

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

The data-flow drawing establishes where work and information move.

Authority mapping is then applied to the critical flows rather than inferred from system ownership or box placement.

### Decision Authority

Identifies who or what is permitted to make the governing decision.

### Execution Authority

Identifies who or what may cause the approved action to take effect.

### Risk Acceptance

Identifies the accountable human or organization authorized to accept defined operational risk.

### Human Control

Human review, approval, denial, hold, escalation, and override are shown explicitly when required.

### Control Points

A control point represents an execution-authority layer that validates applicable conditions before consequential action is released.

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

Where a governed action can create material effect, the mapping should identify the evidence needed to reconstruct the execution.

Evidence is not treated as a substitute for control. It demonstrates what inputs, recommendations, authority state, approvals, denials, overrides, and actions actually occurred.

Relevant evidence may include:

- input or request record
- AI-generated recommendation or instruction
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

1. Define the operational purpose and scenario.
2. Establish the system boundary and operating assumptions.
3. Identify systems, applications, AI components, external interfaces, and human actors.
4. Map the primary operational data flows.
5. Assign unique flow identifiers.
6. Decompose critical flows and capture required attributes.
7. Map decision and execution authority to the critical flows.
8. Identify required control points, human intervention, override, and recovery paths.
9. Identify required evidence or record flows.
10. Reconcile the drawing set into the as-designed baseline.
11. Update the controlled set to reflect the approved as-built configuration.
12. Use runtime evidence to compare the as-executed path with the approved baseline.

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

The first application of this standard will be the ControlPointAI Prototype Engineering Package for an **AI-enabled payment-instruction workflow**.

The prototype will use a familiar personal-finance scenario to demonstrate how AI-generated payment actions move from input and planning systems through an authority / control point before reaching bank or payment systems.

**CP-AI-001** will serve as the system context drawing.

Follow-on products will:

- decompose its primary flows
- establish the as-designed configuration
- map authority and control points
- establish the as-built baseline
- demonstrate runtime evidence and configuration change

---

## 15. Controlled Draft Status

**Version 0.1 is the initial controlled draft issued to satisfy Phase 2 POAM Item 2-1.**

It is intentionally concise and will be revised based on practical use during development of the prototype engineering package.

The purpose of this first issue is not to claim that the methodology is finished.

The purpose is to establish a controlled starting point, apply it to a real prototype, measure what works, identify what does not, and update the standard through disciplined configuration control.

---

**ControlPointAI**  
**Data-Flow Mapping Standard — Version 0.1 Controlled Draft**  
**Issued August 8, 2026**
