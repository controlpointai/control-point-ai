---
title: Piping UT Demonstration — Requirements Baseline Complete
live_path: piping-ut-requirements-baseline
layout: article
eyebrow: PROJECT UPDATE 2
badge_variant: ""
card_image: /assets/images/uploads/announcement-image.png
status: featured
summary: ControlPointAI has completed the first-principles requirements baseline
  for the Piping UT Demonstration, defining 34 controlled requirements across
  five execution transitions while preserving evidence traceability,
  configuration control, human technical authority, and supervisory decision
  boundaries.
themes:
  - Requirements baseline
  - Evidence traceability
  - Human technical authority
---
ControlPointAI has completed the first-principles requirements baseline for the Piping UT Demonstration.

Starting with the bounded functional sequence established in earlier POAM work, the demonstration was examined transition by transition—from initiation of the inspection event through technical review and the final supervisory decision. The resulting baseline defines 34 controlled requirements across five execution transitions.

## What the baseline establishes

The objective was not to automate an existing checklist. It was to determine what must remain true as evidence, technical criteria, AI-generated analysis, human judgment, and decision authority move through the workflow.

The resulting control structure establishes several recurring principles:

- Evidence must remain tied to the correct case, configuration, technical basis, and source.
- AI-generated information must remain distinguishable from originating evidence.
- Changes to material evidence, criteria, or configuration must trigger appropriate revalidation rather than allowing an earlier conclusion or approval to silently carry forward.
- AI recommendations remain advisory until reviewed by the designated human technical authority.
- Human technical review and supervisory approval remain separate controlled functions.
- The evidence retained by the workflow must be sufficient to reconstruct what was reviewed, what authority was exercised, and what decision resulted


These controls were derived across the full bounded sequence. At the front end, prior work may support efficient reuse, but its applicability and technical basis must be revalidated for the current case. Examination evidence must then enter the decision path with its identity, completeness, provenance, and relationship to the governing inspection basis preserved.

At the AI-processing stage, the workflow preserves a clear boundary between source evidence and AI-derived calculations, interpretations, summaries, and recommendations. Those outputs then enter an independent human engineering review rather than becoming an engineering decision by implication.

Finally, completion of engineering review does not itself constitute supervisory approval. The designated supervisory authority acts on the controlled reviewed package and makes the explicit disposition for the bounded UT event.

## Why It Matters

The major efficiency opportunity is real: AI can perform much of the information gathering, comparison, organization, screening, and preparation work that engineers traditionally perform manually.

But efficiency cannot come by allowing authority, evidence, or configuration state to become ambiguous.

**ControlPointAI is therefore not simply asking whether AI can perform the work. We are defining the controls required for AI-assisted work to remain trustworthy while it is actually being executed.**

The next stage of the UT Demonstration will use this requirements baseline to move from design-time governance requirements toward executable controls and testable demonstration behavior.
