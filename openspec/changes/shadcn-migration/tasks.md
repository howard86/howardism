## 1. Foundation — Create packages/ui

- [ ] 1.0 Follow official shadcn monorepo setup guide (https://ui.shadcn.com/docs/monorepo): create `packages/ui` workspace with `package.json` (exports for `./components/*`, `./lib/*`, `./styles/*`), `components.json` (style: radix-nova, rsc: true, cssVariables: true, iconLibrary: lucide), and `tsconfig.json`. Ensure both package-level and app-level `components.json` share identical `style`, `iconLibrary`, and `baseColor` values. Use `@howardism/ui` as the workspace alias (replacing `@workspace/ui` from docs). Leave `tailwind.config` empty for Tailwind v4 CSS-first approach.
- [ ] 1.1 Initialize `packages/ui` package with `package.json`, `components.json`, TypeScript config, and workspace registration
- [ ] 1.2 Create `cn()` utility (`src/lib/utils.ts`) with `clsx` + `tailwind-merge`
- [ ] 1.3 Create `src/styles/globals.css` with Tailwind v4 imports and CSS variable theme tokens (map DaisyUI `jp` theme colors)
- [ ] 1.4 Add `components.json` to `apps/blog` pointing aliases to `@howardism/ui`

## 2. Tailwind v4 Upgrade

- [ ] 2.1 Upgrade blog app from Tailwind v3.4.1 to v4 — migrate `tailwind.config.ts` to CSS-first config
- [ ] 2.2 Remove DaisyUI Tailwind plugin, replace with shadcn CSS variable approach
- [ ] 2.3 Add Tailwind v4 to recipe app (currently no Tailwind)
- [ ] 2.4 Add Tailwind v4 to github-search app (currently no Tailwind)

## 3. Blog App Migration

- [ ] 3.1 Install initial shadcn components: button, input, select, card, form, label, tabs, popover
- [ ] 3.2 Migrate blog form components (`FormInput`, `FormSelect`, `FormTextArea`) from DaisyUI → shadcn
- [ ] 3.3 Migrate blog Header from Headless UI Popover → shadcn components
- [ ] 3.4 Migrate blog Card/container components from DaisyUI → shadcn
- [ ] 3.5 Migrate ResumeForm tabs from Headless UI → shadcn Tabs
- [ ] 3.6 Replace remaining DaisyUI class usage (`btn`, `swap`, theme classes) with shadcn equivalents
- [ ] 3.7 Remove DaisyUI and `@headlessui/react` dependencies

## 4. Shared Package Refactor

- [ ] 4.1 Rewrite `packages/components/common` Image and RouteLink to use Next.js primitives + shadcn styling
- [ ] 4.2 Rewrite `packages/components/login-form` Card, LoginForm, LoginPage using shadcn + React Hook Form
- [ ] 4.3 Deprecate and remove `packages/theme` (Chakra extendTheme)

## 5. Recipe App Migration

- [ ] 5.1 Replace Chakra layout components (Box, Flex, Stack, Container) with Tailwind utility classes
- [ ] 5.2 Replace Chakra form components (FormControl, Input, Select, Checkbox) with shadcn equivalents
- [ ] 5.3 Replace Chakra data display (List, Tag, Avatar, Tooltip, Code) with shadcn equivalents
- [ ] 5.4 Replace Chakra feedback (Spinner, Accordion, Tabs) with shadcn equivalents
- [ ] 5.5 Migrate Formik forms to React Hook Form + Zod
- [ ] 5.6 Remove Chakra UI and Emotion dependencies

## 6. GitHub-Search App Migration

- [ ] 6.1 Replace Chakra layout components with Tailwind utility classes
- [ ] 6.2 Replace Chakra form and data display components with shadcn equivalents
- [ ] 6.3 Replace Chakra feedback components with shadcn equivalents
- [ ] 6.4 Remove Chakra UI and Emotion dependencies
