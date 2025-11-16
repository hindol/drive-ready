- [x] Verify that the copilot-instructions.md file in the .github directory is created. Completed via create_file tool.

- [x] Clarify Project Requirements. Requirements provided: React, Bootstrap, TypeScript.

- [x] Scaffold the Project. Ran `npx create-vite@latest . --template react-ts` with npm install and dev server verification.

- [x] Customize the Project. Installed Bootstrap, imported global styles, and built a landing page with feature, session, and contact sections.

- [x] Install Required Extensions. No extensions specified, skipped installation.

- [x] Compile the Project. `npm run build` completes without errors.

- [x] Create and Run Task. Added `.vscode/tasks.json` with an `npm: dev` shell task and executed it once.

- [x] Launch the Project. Started `npm run dev -- --debug`, running on http://localhost:5174/.

- [x] Ensure Documentation is Complete. Updated README with project details and stripped comments from this file.
- Work through each checklist item systematically.
- Keep communication concise and focused.
- Follow development best practices.

## Question Creation Rules

- Base every prompt, explanation, and citation on Washington-specific sources—prefer the 2023 Washington Driver Guide or an official DOL fact sheet—and keep the law/regulation wording exact for local accuracy.
- Give each `Question` object a unique sequential `id`, a clear prompt, exactly four plausible answer choices (strings only—no letter prefixes), and a single correct response referenced by `answerIndex` (0-based).
- Pair every question with:
	- An `explanation` that restates the correct behavior in plain language for learners.
	- A verbatim `quote` from the cited source supporting the rule being tested.
	- A `reference` string in the format `Washington Driver Guide (2023), <section>` so `getReferenceLink` can build a URL.
- When covering signs or signals, use the official MUTCD SVG assets stored under `src/assets/signs/` (download via authoritative sources, never AI-generated art) and wire them through the `ROAD_SIGNS` map with descriptive `image` + `imageAlt` (include the MUTCD code in the alt text for screen readers).
- If an appropriate official asset does not exist, reframe the prompt as a word problem instead of fabricating inaccurate artwork.
- Never create bespoke illustrations or icons—only use assets sourced from official MUTCD, Washington DOL, or other authoritative public-domain/licensed sets. If a trustworthy asset is unavailable, keep the question text-only.
- Keep the bank balanced: continuously expand across traffic laws, signals/signs, safe driving techniques, sharing the road (bikes, transit, vulnerable users), licensing/responsibility, emergencies, and weather/mountain driving so the 100-question set mirrors the Washington exam outline.
- Stick to Washington statutes and numeric values (distances, BAC thresholds, reporting timelines, teen license limits, etc.) and double-check figures before publishing.
- Treat accessibility and localization as first-class: favor scenario-based wording, avoid slang, and ensure every visual question also works for users relying on alt text.

## Theme Color Update Checklist

When swapping to a new palette, change every place below in the same commit so the UI stays consistent:

1. `src/index.css`
	- Update all `--driveready-*` CSS custom properties (primary, dark, soft, secondary, accent, muted) under `:root`.
	- Keep `--driveready-primary-pressed` and `--driveready-focus-ring` in sync with the palette for consistent button active states and focus rings.
	- Ensure Bootstrap override variables (`--bs-primary`, `--bs-link-color`, etc.) mirror the new tones.
	- Refresh the `.btn-primary`, `.btn-outline-primary`, `.bg-primary`, `.text-primary`, and `.text-bg-primary` overrides (including hover/active/disabled states and focus rings) if the new palette needs different contrast ratios.
2. `src/App.css`
	- Adjust the hero gradient colors, card hover shadow rgba value, stat-card border color, and `.stat-value` text color to use the new palette.
	- Review any other hard-coded color tokens (e.g., state selector background/box shadow) and align them with the palette.
3. Component markup (`src/App.tsx`)
	- Double-check badge/alert variants (e.g., `text-bg-primary`, `bg-primary`, `btn-primary`) still make sense with the updated colors. Prefer semantic Bootstrap classes backed by the overrides above instead of inline hex codes.
4. Visual regression check
	- After changing colors, run `npm run build` and manually spot-check the hero, navbar, checklist, progress bar, CTA buttons, Smart Review controls, and footer to confirm they reflect the palette with accessible contrast.

Document any newly introduced variables or utility classes in this section so future palette swaps remain predictable.
