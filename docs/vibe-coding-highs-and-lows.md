# AI Collaboration Recap

## What we built

- **Project:** DriveReady – a Washington-only mock driving test companion with adaptive Smart Review, MUTCD-accurate assets, and state-specific prep flows.
- **Repository:** https://github.com/hindol/drive-ready
- **Live app:** https://hindol.github.io/drive-ready/

DriveReady pairs a 100-question Washington-aligned bank with adaptive scheduling, road sign drills, and smart persistence so learners can practice anywhere and resume instantly.

## Highs – AI wins

1. **Rapid scaffold + localization:** Bootstrapped Vite + React + TypeScript with Bootstrap, then localized copy, layout, and MUTCD assets for Washington without extra coaching.
2. **Question bank expansion:** Added the final 26 Washington-referenced questions in one pass, keeping explanations, citations, and topic balance intact.
3. **GitHub Pages automation:** Reconfigured Vite’s base path, authored the deploy workflow, and updated docs in one go—push-to-prod now “just works.”
4. **DriveReady rebrand:** Propagated the new name across package metadata, UI copy, and docs with no follow-up fixes required.

## Lows – Iteration required

1. **Smart Review persistence:** Initial fixes still lost data on reload, so we iterated on storage hydration and migrations before it stuck.
2. **MUTCD asset sourcing:** Early attempts relied on generic icons; we reworked the pipeline to import verified MUTCD SVGs and wire them through `ROAD_SIGNS`.
3. **Git identity cleanup:** Needed multiple passes to swap the personal commit email for GitHub’s noreply address and rewrite the last commit safely.
4. **Story sequencing:** The first write-up buried the “what we built” lead, so we restructured the narrative to start with the product overview per stakeholder feedback.
