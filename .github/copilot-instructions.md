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
- Keep the bank balanced: continuously expand across traffic laws, signals/signs, safe driving techniques, sharing the road (bikes, transit, vulnerable users), licensing/responsibility, emergencies, and weather/mountain driving so the 100-question set mirrors the Washington exam outline.
- Stick to Washington statutes and numeric values (distances, BAC thresholds, reporting timelines, teen license limits, etc.) and double-check figures before publishing.
- Treat accessibility and localization as first-class: favor scenario-based wording, avoid slang, and ensure every visual question also works for users relying on alt text.
