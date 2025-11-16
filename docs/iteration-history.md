# DriveReady Iteration Timeline

> Color key: 🟢 = ≤2 development iterations (minimal rework). 🔴 = ≥3 iterations (required additional passes).

| Step | Iterations | Highlights |
| --- | --- | --- |
| 🟢 **1. Repo bootstrap & guardrails** | 1 | Added `.github/copilot-instructions.md`, clarified Washington-only scope, and documented palette/theme expectations. |
| 🟢 **2. Scaffolding & initial polish** | 2 | Ran Vite React-TS scaffold, installed Bootstrap, built the landing hero/stats/review/checklist sections, and verified builds & VS Code task wiring. |
| 🔴 **3. Question bank authoring** | 4 | Iterated on Washington-specific prompts, enforced citation format (`quote`, `reference`, `referenceLink`), randomized choices, and kept the 100-question outline balanced across topics. |
| 🔴 **4. Road sign sourcing** | 3 | Repeatedly sourced official MUTCD SVG assets, wired them through `ROAD_SIGNS`, and updated alt text + accessibility copy when assets were missing or inaccurate. |
| 🔴 **5. Theming & calendar refinements** | 3 | Multiple passes to unify colors across progress bars, adjust calendar tile height/padding, and fix today+met color contrast for accessibility. |
| 🔴 **6. Persistence tooling & reset workflow** | 4 | Audited localStorage keys, added reset CTA + warning modal, ensured state/localStorage clearing, and styled overlay/CTA for clarity. |
| 🔴 **7. UI testing setup** | 3 | Selected Playwright, installed browsers, created `playwright.config.ts`, authored `tests/home.spec.ts`, updated npm scripts/README, and ran the cross-browser suite. |
| 🟢 **8. Documentation expansion** | 2 | Enhanced README with feature rundown, Playwright usage instructions, and maintained deployment/auth guidance. |

These counts reflect the distinct implementation/review cycles each area needed as we evolved DriveReady from a scaffold into a fully instrumented Washington practice app.
