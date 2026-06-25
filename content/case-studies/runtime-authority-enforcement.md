---
title: "Runtime Authority Enforcement in Naval Nuclear Maintenance"
live_path: "runtime-authority-enforcement"
status: "featured"
summary: "A naval availability scenario showing how AI assistance must remain bounded before it influences planning, material control, execution, testing, or final release."
failure_pattern: "Operational authority drift"
mapping_focus: "Map AI influence points across work identification, package development, routing, procurement, execution, testing, and final release."
key_principles:
  - "AI can inform; humans must authorize."
  - "Authority must be validated phase by phase."
  - "Changing conditions can invalidate prior approvals."
  - "Commercial optimization is not operational acceptability."
  - "Final release authority remains accountable and human."
---

A hypothetical nuclear valve impeller replacement during naval availability shows why high-consequence AI governance must operate at runtime, across multiple authority chains, rather than only at initial system review.

## Executive Summary

This case examines a reactor support seawater cooling valve impeller replacement during a scheduled naval shipyard availability. The scenario is useful because it naturally contains nuclear and non-nuclear work boundaries, multiple technical authorities, fleet operational authority, QA hold points, testing gates, dynamic execution conditions, and final Completion of Availability certification.

The case demonstrates the difference between traditional policy-based AI governance and execution-bound operational governance. AI assistance is not inherently the problem. Loss of runtime authority enforcement is the problem.

## Scenario Overview

A reactor support seawater cooling valve impeller is identified for replacement during a scheduled availability. The task appears straightforward, but the operating environment quickly exposes overlapping governance domains.

Authority domains include NAVSEA nuclear, NAVSEA non-nuclear, TYCOM nuclear, TYCOM non-nuclear, nuclear and non-nuclear project teams, QA organizations, test engineering, and shipyard production.

## The Central Governance Problem

Traditional AI governance often assumes that if an AI system was reviewed initially, governance has been achieved. Naval nuclear maintenance demonstrates why that assumption fails. During execution, material conditions change, system configurations shift, radiological boundaries evolve, work sequencing changes, QA findings emerge, testing creates new operational states, and fleet priorities shift.

The real question is whether the work remains authorized under current conditions, whether operational boundaries are still valid, whether any condition invalidated prior approval assumptions, and whether re-authorization is required.

## Phase 1: Work Identification

Fleet maintenance data identifies abnormal vibration trends associated with the valve. AI could analyze historical vibration data, compare fleet records, identify failure patterns, recommend maintenance timing, draft work candidate language, and correlate fleet lessons learned.

**Control Point 1: Authority Assignment.** AI may assist analysis, but it cannot determine nuclear work classification, technical authority ownership, reactor plant impact designation, final work authorization, or operational risk acceptance.

**Key insight:** AI can inform the process. AI cannot own the operational consequences.

## Phase 2: Work Package Development

Engineering develops Technical Work Documents, testing requirements, tagout boundaries, material requirements, procedure references, QA requirements, and radiological controls. AI could draft Technical Guidance Instructions, retrieve prior procedures, suggest sequencing, generate logistics tasks, and detect missing documentation.

**Control Point 2: Nuclear / Non-Nuclear Boundary Validation.** A valve may appear non-nuclear in isolation, but its significance can change if it supports reactor cooling functions, adjacent work changes system alignment, temporary configurations alter casualty response assumptions, new fleet guidance changes thresholds, or testing affects safety margins.

**Key insight:** Governance cannot remain static while operational conditions evolve dynamically.

## Phase 3: Multi-Authority Routing and Approval

The work package routes through NAVSEA, TYCOM, QA, Test Engineering, production, and project-team authorities. AI could detect missing approvals, route packages, identify conflicts, prioritize bottlenecks, correlate schedule impacts, and generate risk summaries.

**Control Point 3: Authority Conflict Resolution.** AI may detect that nuclear testing requirements conflict with schedule acceleration goals. It cannot resolve nuclear risk acceptance, schedule-versus-safety tradeoffs, certification disagreements, or the question of who owns operational risk.

**Key insight:** AI coordination is not equivalent to operational authority.

## Phase 4: Material Procurement and Verification

Replacement material must satisfy pedigree, vendor approval, configuration control, technical specification, and QA traceability requirements. AI could optimize sourcing, predict delivery delays, compare certifications, detect anomalies, and correlate supplier discrepancies.

**Control Point 4: Approved Material Validation.** A technically similar component may still violate configuration baselines, nuclear material requirements, or fleet certification constraints. Commercial optimization is not the same thing as operational acceptability.

**Key insight:** Operational acceptability is not equivalent to commercial optimization.

## Phase 5: Work Execution

Shipyard personnel perform system isolation, tagout verification, component removal, inspection, replacement installation, QA inspections, and radiological controls. AI copilots could display procedures, retrieve drawings, suggest tooling, monitor sequencing, detect checklist omissions, and provide reminders.

Unexpected conditions may emerge: corrosion beyond expected limits, incorrect impeller revision, adjacent work impacts, temporary shielding, tagout conflicts, or changing radiological conditions.

**Control Point 5: Runtime Execution Authorization.** The operational system must continuously determine whether current work is still authorized, whether boundaries remain valid, whether approval assumptions changed, whether re-review is required, and whether authority still holds at t + Delta t.

**Key insight:** Governance is not documentation. Governance is active operational constraint enforcement.

## Phase 6: Testing and Restoration

Following installation, the system undergoes functional testing, leak checks, vibration analysis, reactor support verification, and restoration testing. AI could compare historical test signatures, detect anomaly patterns, recommend retest conditions, analyze fleet performance data, and predict emerging failures.

AI may inform, analyze, detect, and recommend. Human authority must authorize, accept risk, certify, and release.

**Key insight:** Analytical capability does not equal operational authority.

## Phase 7: Completion of Availability

Completion of Availability requires work completion verification, configuration validation, deficiency review, testing closure, operational certification, and fleet acceptance. AI may reconcile configuration databases, identify unresolved discrepancies, predict risk areas, generate readiness summaries, and correlate readiness data.

**Control Point 7: Final Operational Release Authority.** CA is a formal operational declaration that the platform is certified for return to operational service. AI may support analysis throughout the availability, but fleet operational risk ownership, reactor plant certification, mission readiness acceptance, and safety accountability remain human.

**Key insight:** AI may compress execution timelines. It does not eliminate operational accountability.

## Strategic Conclusion

High-consequence AI governance cannot rely solely on policies, reviews, documentation, static approvals, or compliance checklists. Operational governance must focus on runtime authority enforcement, dynamic validation, continuous boundary monitoring, execution-bound accountability, and real-time constraint management.

Authority must remain valid not only at time t, but continuously at time t + Delta t as operational conditions evolve.

That is the difference between governance documentation and operational governance.
