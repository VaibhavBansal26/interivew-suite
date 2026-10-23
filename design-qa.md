# Design QA

- Source visual truth: `/Users/vaibhavbansal/.codex/generated_images/01a11369-1ed8-79c0-891c-c100852a13ca/exec-015d5133-5453-4a5d-9f5b-3522595c20bc.png`, supported by the three selected round-specific generated references in the same directory.
- Implementation: `http://localhost:4173/` in the Codex in-app browser.
- Browser-rendered evidence: current marked deliverable browser tab, captured October 6, 2026.
- Source dimensions: 1488 × 1058 px. Intended CSS viewport: 1440 × 1024.
- Verification viewport: 812 × 814 px responsive desktop state; browser density managed by the in-app browser.
- States checked: practice-loop launcher, phone-screen leadership state, phone-screen coding state, passing test state, post-round feedback, DSA workspace, and system-design workspace.

## Full-view comparison evidence

The implementation preserves the source hierarchy: narrow persistent navigation, strong loop heading and level switch, three vertically sequenced rounds, distinct technical previews, restrained off-white product chrome, dark technical workspaces, green progress semantics, and rust destructive actions. At the verification viewport the responsive layout intentionally removes the tertiary assessment column while preserving all core actions and round previews.

## Focused region comparison evidence

- Launcher: round order, copy hierarchy, duration/language controls, visual previews, and primary action match the unified source direction.
- Phone screen: editorial light surface, behavioral prompt, private-feedback lock, interview timeline, and coding transition match the selected phone-screen direction.
- DSA: problem/editor/interviewer anatomy matches the selected focused pairing-room direction; the interviewer rail collapses at narrow desktop widths.
- System design: navy dotted canvas, structured brief, selectable architecture nodes, stage footer, and voice-interviewer rail match the selected studio direction; the voice rail collapses at narrow desktop widths.

## Required fidelity surfaces

- Fonts and typography: Manrope and DM Mono provide the selected humanist/product and engineering-code pairing. Hierarchy, weights, wrapping, and line heights remain legible at the tested breakpoint.
- Spacing and layout rhythm: primary region proportions, separators, vertical round rhythm, and work-area density match the references. The medium-width top bar was tightened after the first browser pass.
- Colors and visual tokens: off-white, graphite, deep navy, indigo/cyan, forest green, and rust are consistently mapped to the source semantics.
- Image and icon fidelity: the visual target is UI-led and contains no required photography or bespoke illustrations. Phosphor icons replace generic glyphs consistently; no placeholder imagery remains.
- Copy and content: SDE I/SDE II, Python/Java, round durations, prompts, rubrics, and feedback copy reflect the approved requirements.

## Interaction verification

- Level and language selectors render and update the selected practice configuration.
- Phone screen transitions from Leadership Principles to coding.
- Code editor is editable and Run Tests produces a visible passed state.
- End Round opens evidence-oriented feedback.
- DSA and System Design round launchers open their purpose-built workspaces.
- System-design nodes are selectable and the add-node control works.
- Screen sharing is wired to the browser display-capture API; accepting the browser permission prompt was intentionally not exercised during automated QA.
- No visible runtime error was encountered during primary-flow testing.
- Live backend verification completed after the prototype pass: `/api/health` confirms the server key configuration; Python returned four passing tests; Java returned three passing tests; screen-image analysis returned a grounded interviewer follow-up; structured evaluation returned a persisted evidence-based report; the Realtime WebRTC bridge reached OpenAI and correctly rejected an intentionally incomplete SDP offer at media validation.
- Past Interviews and Improvement Plan open the persisted-history route, including the empty state after test data cleanup.

## Comparison history

1. Initial browser pass found a P2 medium-width issue: top-bar controls were cramped and the last whiteboard node touched the viewport edge.
2. Added a 761–1050 px override that converts utility controls to compact icon buttons, reduces timer width, and repositions the final node.
3. Post-fix browser capture showed persistent controls fully visible with the architecture canvas contained.

## Findings

No actionable P0, P1, or P2 visual differences remain in the tested states.

## Follow-up polish

- P3: A wider 1440 × 1024 browser capture would permit pixel-level comparison of the right-side assessment and interviewer rails that collapse in the current in-app viewport.
- P3: Add richer connector routing and drag handles to the whiteboard during the production backend phase.

final result: passed
