# Repository Guidelines

## Project Structure & Module Organization

- `migration/`: active Tauri + React workspace.
- `migration/src/`: React code organized by `app`, `pages`, `widgets`, `features`, `entities`, and `shared`.
- `migration/src-tauri/`: Rust/Tauri shell, commands, capabilities, updater, and app configuration.
- `migration/tests/` and `migration/src/**/__tests__/`: Vitest and Testing Library tests.
- `migration/public/` and `migration/src/assets/`: static assets and UI media.
- `sidecar/posture-engine/`: Python posture engine, model assets, and parity tests.

## Build, Test, and Development Commands

Run frontend and Tauri commands from `migration/`.

- `pnpm install`: install dependencies using the pinned pnpm workflow.
- `pnpm run dev`: start the Vite renderer dev server.
- `pnpm run tauri:dev`: run the desktop app locally through Tauri.
- `pnpm run build`: type-check and build the Vite frontend.
- `pnpm run tauri:build`: build the native desktop bundle.
- `pnpm run lint:check`: run Biome checks without modifying files.
- `pnpm run lint`: run Biome and apply safe fixes.
- `pnpm run test`: run Vitest once.
- `pnpm run typecheck`: run TypeScript with `--noEmit`.

For the sidecar, use Python 3.11, install `sidecar/posture-engine/requirements.txt`, and run `pytest`.

## Coding Style & Naming Conventions

TypeScript, TSX, JSON, and CSS are formatted by Biome. Use 2-space indentation, LF line endings, 80-column formatting, single quotes in TypeScript, double quotes in JSX attributes, trailing commas, and no semicolons.

Follow the feature-sliced layout: primitives in `shared`, business state in `entities`, flows in `features`, route screens in `pages`, and app surfaces in `widgets`.

## Testing Guidelines

Vitest uses `jsdom`, globals, and `migration/src/test/setup.ts`. Name frontend tests `*.test.ts` or `*.test.tsx`, colocated near the unit or under `migration/tests/unit/`. Use Testing Library and prefer user-visible assertions.

Python tests live in `sidecar/posture-engine/tests/`. Add tests when changing calculations, classifiers, score smoothing, camera behavior, or sidecar contracts.

## Commit & Pull Request Guidelines

Recent history uses conventional prefixes such as `fix:`, `chore:`, and `ci:`. Keep commit subjects imperative and scoped, for example `fix: restore main window on app launch`.

Pull requests should follow `.github/PULL_REQUEST_TEMPLATE.md`: include a summary, AS-IS, TO-BE, reviewer notes, and related issues. For UI changes, attach screenshots or recordings. Before review, run `pnpm run lint:check`, `pnpm run typecheck`, `pnpm run test`, and a build command when packaging changes.

## Security & Configuration Tips

Do not commit updater signing keys, Apple credentials, API secrets, generated bundles, `node_modules`, or virtual environments. Keep release-only configuration in GitHub Secrets and prefer the existing release scripts under `migration/scripts/` over ad hoc packaging steps.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read
`specs/016-camera-stream-permission/plan.md`.
<!-- SPECKIT END -->
