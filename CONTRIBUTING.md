# Contributing to Motrix Next

## Getting Started

```bash
# Prerequisites: Node.js 22+, pnpm 9+, Rust (stable)
git clone https://github.com/user/motrix-next.git
cd motrix-next
pnpm install
pnpm dev         # Start dev server (frontend)
```

Rust backend (Tauri):
```bash
cd src-tauri
cargo build
cargo test       # 11 tests
```

## Code Quality

All checks must pass before PR merge:

```bash
pnpm lint        # ESLint (0 errors, 0 warnings)
pnpm test        # Vitest (189+ tests)
npx vue-tsc --noEmit   # TypeScript strict mode
npx vite build   # Production build (no chunk warnings)
cd src-tauri && cargo test  # Rust tests
```

Pre-commit hooks (husky + lint-staged) auto-run `eslint --fix` and `prettier --write` on staged files.

## Component Guidelines

- **Max 250 lines** per `.vue` SFC. Extract sub-components when approaching this limit.
- Use `<script setup lang="ts">` with composition API.
- Every file starts with a `/** @fileoverview ... */` doc comment.
- Use `logger` from `@shared/logger` for all runtime logging — **no bare `console.*`**.

## Error Handling

- **TypeScript**: Never leave `catch` blocks empty — always call `logger.debug()` at minimum.
- **Rust**: Use the `AppError` enum (`Store`, `Engine`, `Io`, `NotFound`) for all command return types.

## Testing

- Follow **TDD** (Red → Green → Refactor) for new utilities and guards.
- Test files live alongside source: `__tests__/filename.test.ts`.
- Runtime type guards (in `guards.ts`) validate all external API responses.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add torrent file selection
fix: handle empty bitfield in peer parser
refactor: extract TorrentUpload sub-component
test: add rename utility tests
docs: update CONTRIBUTING guidelines
```
