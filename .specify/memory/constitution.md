<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0
Modified principles: N/A — initial population of template
Added sections:
  - I. Code Quality
  - II. User Interface & Experience
  - III. Modern Design
  - IV. Performance
  - Development Standards
  - Quality Gates
  - Governance
Removed sections: N/A — first population of template
Templates requiring updates:
  ✅ .specify/memory/constitution.md — updated (this file)
  ✅ .specify/templates/plan-template.md — Constitution Check placeholder intact; no structural change needed
  ✅ .specify/templates/spec-template.md — Success Criteria structure aligns with Performance and UX principles; no change needed
  ✅ .specify/templates/tasks-template.md — Polish phase covers performance and design tasks; no change needed
  ⚠  README.md — Does not exist at project root; consider creating a project overview document
Follow-up TODOs:
  - None. All placeholders resolved.
-->

# Pomo Timer Constitution

## Core Principles

### I. Code Quality

All code MUST be clean, consistent, and maintainable. Non-negotiable rules:

- Every module MUST have a single, clearly defined responsibility.
- Functions MUST remain small enough to understand in isolation (target: ≤40 lines).
- Dead code, commented-out blocks, and speculative abstractions MUST NOT be committed.
- Code MUST pass linting and type-checking gates before merge.
- New behavior MUST be accompanied by tests — no workarounds permitted.

**Rationale**: Technical debt compounds rapidly in a UI-heavy timer app. Clean code is
the foundation on which reliable UI and performance rest.

### II. User Interface & Experience

Every interface surface MUST be intuitive, accessible, and low-friction. Rules:

- Every interactive element MUST be keyboard-navigable and meet WCAG 2.1 AA standards.
- Primary user flows (start, pause, reset, configure) MUST complete in ≤3 steps.
- Error states MUST surface actionable, human-readable feedback — never raw codes.
- Visual feedback MUST appear within 100ms of any user interaction.
- UI changes MUST be validated against the primary Pomodoro flow before merge.

**Rationale**: A focus timer succeeds only when it reduces friction. Poor UX disrupts the
flow state the tool is designed to support.

### III. Modern Design

All visual presentation MUST conform to a consistent, contemporary design system. Rules:

- A single design token set (colors, spacing, typography, radii) MUST govern all components.
- Ad-hoc inline styles MUST NOT be used — all styling derives from design tokens.
- Dark mode MUST be supported from initial release, not retrofitted later.
- All icons and graphic assets MUST be vector-based (SVG) for crisp rendering at any DPI.
- Component variants MUST be kept minimal; prefer composition over proliferating one-offs.

**Rationale**: Visual consistency builds user trust and reduces cognitive load. Divergence
from the design system creates compounding maintenance debt across every new screen.

### IV. Performance

The application MUST be fast, accurate, and resource-efficient. Rules:

- Largest Contentful Paint (LCP) MUST complete in ≤1.5 seconds on a mid-range device.
- Timer accuracy MUST deviate no more than ±50ms per Pomodoro interval.
- JavaScript bundle size MUST be tracked; any addition over 10 kB gzipped requires explicit justification.
- Cumulative Layout Shift (CLS) MUST remain ≤0.1 after initial render.
- Background resource usage (CPU, memory) MUST be profiled before shipping any new feature.

**Rationale**: A focus tool that is slow or battery-draining undermines the user's session
quality. Performance is a first-class feature, not a post-launch optimization.

## Development Standards

### Testing Requirements

- Unit tests MUST cover all pure logic (timer state machines, interval calculations).
- Integration tests MUST cover primary user-visible flows (start/pause/reset/complete cycles).
- Visual regression tests SHOULD be added for any component that touches the design system.
- Performance benchmarks MUST be run and compared against baselines in CI for any change
  affecting the critical rendering path or bundle size.

### Accessibility Requirements

- Color contrast ratios MUST meet WCAG 2.1 AA minimums for all text and interactive elements.
- All interactive states (focus, hover, active, disabled) MUST have visually distinct treatments.
- Screen reader announcements MUST fire for all timer state transitions (start, pause, complete).

## Quality Gates

### Definition of Done

A feature is complete when ALL of the following hold:

1. Code passes linting, type checks, and the full test suite.
2. New behavior is covered by unit or integration tests.
3. Performance metrics (bundle size, LCP, CLS) are within the thresholds defined in Principle IV.
4. A design review confirms adherence to the design system (Principle III).
5. An accessibility check passes for any new UI surface (Principle II).

### Amendment Procedure

Any contributor may propose a constitution amendment by:

1. Opening a pull request with the amended `.specify/memory/constitution.md`.
2. Documenting the rationale, the version bump type, and any affected templates.
3. Obtaining approval from at least one other contributor.
4. Updating all dependent templates listed in the Sync Impact Report before merge.

## Governance

This constitution supersedes all informal conventions and prior agreements. Every feature
plan MUST include a Constitution Check section that gates progress before Phase 0 research
and is re-checked after Phase 1 design. Complexity that violates these principles MUST be
explicitly justified in the Complexity Tracking table of the plan — unjustified violations
MUST be resolved before merge.

**Versioning Policy**: MAJOR for principle removal or incompatible redefinition; MINOR for
new principles or materially expanded guidance; PATCH for clarifications, wording fixes,
and non-semantic refinements.

**Compliance Review**: Constitution compliance is reviewed at every pull request. Violations
MUST be resolved or formally justified and recorded before merge.

**Version**: 1.0.0 | **Ratified**: 2026-05-08 | **Last Amended**: 2026-05-08
