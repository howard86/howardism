# howardism

A Bun + Turborepo monorepo containing the blog app and its shared packages by Howard Tai.

## Apps

- `apps/blog` — Next.js blog: articles, RSS
- `apps/cli` — internal CLI utilities (wiki import, etc.)

## Packages

- `@howardism/ui` — shadcn/ui components (Tailwind v4)
- `@howardism/test-config` — shared Bun test preload (happy-dom, jest-dom, Next.js mocks)
- `@howardism/tsconfig` — shared TypeScript configs

## Development

```bash
bun install
bun run build       # turbo run build
bun run lint        # turbo run lint
bun run test        # turbo run test
bun run type-check  # turbo run type-check
```

The pre-commit hook runs a local secret scan with [gitleaks](https://github.com/gitleaks/gitleaks). Install it once to enable the check (otherwise the hook prints a warning and proceeds):

```bash
brew install gitleaks
```

## License

[MIT](LICENSE)
