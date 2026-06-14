---
name: install-composable-component
description: >-
  Manually installs a composable (compound) component from user-pasted source code
  into the daily-logs web app, following the project's dialog/tooltip/conversation
  conventions: unified `radix-ui` imports, `composeCompoundComponent`, `data-slot`
  attributes, `cn`/`composeCompoundComponent` from `@/lib/utils/components`, and
  inline prop-type exports. Use this whenever the user pastes component code (e.g.
  from shadcn/ui or the AI Elements docs), asks to add/install/import a composable
  or compound component, or references https://ui.shadcn.com/docs/components — even
  if they don't say the words "compound" or "design system".
---

# Install Composable Component

Manually add a **composable (compound) component** from source the user provides, adapting it to the daily-logs web app's conventions. [shadcn/ui](https://ui.shadcn.com/docs/components) and the AI SDK's [AI Elements](https://ai-sdk.dev/elements) are common sources — the pasted code is usually a set of compound parts (`Dialog.Trigger`, `Conversation.Content`, etc.) — but the same workflow applies to any pasted composable component.

The goal is that an installed component is indistinguishable from one already in `web/src/components/ui`: same imports, same structure, same naming. The rules below describe that house style and *why* each piece exists, so you can apply judgment when source code doesn't map cleanly.

## Canonical references (read these, not other files)

Match these exactly. They are the source of truth for the pattern:

- [`web/src/components/ui/dialog.tsx`](web/src/components/ui/dialog.tsx) — **preferred reference.** Unified `radix-ui` import, every part wrapped in a named function, `data-slot` on every node, portal handling via `usePortalContainer`.
- [`web/src/components/ui/tooltip.tsx`](web/src/components/ui/tooltip.tsx) — compound component **plus** a standalone exported helper (`TooltipProvider`) that lives outside the compound object.
- [`web/src/components/ai-elements/conversation.tsx`](web/src/components/ai-elements/conversation.tsx) — non-Radix compound (wraps a third-party primitive) with a `Helper functions` section at the bottom.

**Use only these three as a pattern.** Other files in `components/ui` (`button.tsx`, `button-group.tsx`) are non-compound, cva-variant primitives and use older idioms — `import * as React`, `React.ComponentProps`, trailing `export { ... }` blocks. They are fine as they are, but **do not copy those idioms** into a new composable component. Borrow from them only if you genuinely need the cva variant pattern, and then still follow the import/export rules below.

## Install location

Pick the target path **before** writing the file:

1. **User-provided path** — If the user names a file or directory, use that path and naming. Don't move it elsewhere unless they ask.
2. **AI / chat composable** (default for AI Elements) — Components that are part of the chat/AI surface (message lists, prompt inputs, reasoning blocks, sources, etc., e.g. from AI Elements) go in `web/src/components/ai-elements/<dasherized-name>.tsx`. The project already keeps `conversation.tsx` and `message.tsx` there.
3. **Shared UI primitive** (default otherwise) — Reusable, generic UI (overlays, menus, inputs, layout shells) goes in `web/src/components/ui/<dasherized-name>.tsx`.
4. **Unclear** — If the component is feature-specific, page-only, or could reasonably live in multiple places, **ask the user** before creating the file.

**File shape:** a **single flat `.tsx` file**, named in kebab-case (the repo names all files kebab-case). Do **not** create a `<name>/index.tsx` folder — this project keeps components as flat files. Consumers import directly from the path, e.g. `@/components/ui/popover` or `@/components/ai-elements/prompt-input`. There is **no barrel `index.ts`** to update.

### Detect existing installation

**Before creating, overwriting, or deleting any file**, check whether the component already exists. macOS is case-insensitive, so `Popover.tsx` and `popover.tsx` are the **same file** — a case-mismatched name still counts as existing.

Check, in order:

1. **Resolved path** — e.g. `web/src/components/ui/<name>.tsx`.
2. **The sibling directory** — also check `web/src/components/ai-elements/<name>.tsx` (and vice-versa) so the same component isn't installed in two places.
3. **Case / tracked / deleted variants** — run `git ls-files -- 'web/src/components/**/*<name>*'` so renamed-but-uncommitted and deleted variants are visible too.
4. **User-provided path** — if the user named one, check it and its parent.

**If a match exists:**

1. **Read** the existing file first — do not delete or overwrite yet.
2. **If it already follows this skill** (`composeCompoundComponent`, `radix-ui` import, `cn` from `@/lib/utils/components`, inline `export type` / no trailing `export { … }`) → stop and tell the user it's already installed. Offer to make specific edits only if they describe what should change. Do **not** reinstall.
3. **Otherwise** → stop and ask the user to choose before any writes:
   - **Overwrite in place** — transform the pasted source and replace the file at its current path.
   - **Install at a different path** — user supplies a new path.
   - **Cancel** — make no changes.

Until the user confirms an overwrite or a new path, do **not** delete files or create a new one at the resolved path.

## Workflow

1. Confirm the component name and that the user pasted the full source (for shadcn/AI-Elements-only requests, you may fetch the source if they name a component without pasting code).
2. **Resolve the install location** (above).
3. **Detect existing installation** (above); follow the stop/ask rules if a match is found.
4. **Install missing dependencies** (see [Dependencies](#dependencies)) before writing the file.
5. Create the file and transform the source using every rule in [Transformation rules](#transformation-rules).
6. Run `pnpm web typecheck` if the imports or types are non-trivial.

## Dependencies

Scan the source for **external** npm packages (not `@/…` aliases or relative imports). For each one the adapted component will actually import:

1. Check whether it's already in [`web/package.json`](web/package.json).
2. If missing, install it from the **repo root** with the web filter script:

```bash
pnpm web add <package>
```

`pnpm web` is a root script for `pnpm --filter @daily-logs/web`, so the dependency lands in `web/`, not the monorepo root. Don't `cd web && pnpm add …` unless `pnpm web add` is unavailable.

**Already present** (verify in `package.json` before adding): `radix-ui` (unified — use this, never scoped `@radix-ui/react-*`), `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`. AI Elements often need `ai` and `streamdown`, which are also already present.

Only install what the component needs *after* transformation — skip packages whose imports you remap to existing project files (e.g. `@/components/ui/button`).

## Transformation rules

Apply all of these to the pasted source. Each exists to make the result match the canonical files.

### 1. React imports — narrow, type-only

Replace `import * as React from "react"` with only what's used, and import types with `import type`:

```tsx
import type { ComponentProps } from 'react';
```

If you also need runtime hooks, split them: `import { useCallback, useMemo } from 'react';`. Don't pull in all of React or use `React.ComponentProps` — the canonical files reference `ComponentProps` unqualified.

### 2. Radix — always unified `radix-ui`, aliased to `<Component>Primitive`

Sources default to scoped packages. Always import from `radix-ui` and alias:

```tsx
// bad
import * as DialogPrimitive from '@radix-ui/react-dialog';

// good
import { Dialog as DialogPrimitive } from 'radix-ui';
```

Use `DialogPrimitive.Root`, `DialogPrimitive.Trigger`, etc. as before — only the import changes. For `asChild` slots, use `import { Slot } from 'radix-ui';` and `Slot.Root` (see `button.tsx`).

Set `data-slot="<dasherized-component-part>"` on every primitive **and** layout node, e.g. `data-slot="dialog-trigger"`, `data-slot="dialog-header"`. This is how the project's Tailwind selectors target parts.

### 3. `cn` and `composeCompoundComponent` from `@/lib/utils/components`

```tsx
import { cn, composeCompoundComponent } from '@/lib/utils/components';
```

This path is specific to daily-logs (not `@/lib/utils`). Remap any other source alias (e.g. `@/lib/utils` → `@/lib/utils/components`, `@/components/ui/button` → `@/components/ui/button`).

### 4. Named function components, not arrows

Every part is a **named function declaration**. Convert `React.forwardRef` into a named function that reads `ref` from props:

```tsx
// bad
const SelectTrigger = () => { ... };

// good
function SelectTrigger(props: SelectTriggerProps) { ... }
```

### 5. Wrap the root primitive — never alias it

```tsx
// bad
const DialogRoot = DialogPrimitive.Root;

// good
function DialogRoot(props: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}
```

Prefer wrapping **every** part in a named function (as Dialog does) rather than passing primitives directly into the compound map.

### 6. Prop types — `type`, inline-exported, above the function

Define and export each part's props with `type` (not `interface`) immediately above its function:

```tsx
export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content>;

function DialogContent(props: DialogContentProps) { ... }
```

**Root naming exception:** the root wrapper's type drops `Root` — `DialogProps` for `DialogRoot`, not `DialogRootProps`.

### 7. Destructure inside the body, not in the signature

Keep the parameter as a single typed `props`; pull fields out in the first line:

```tsx
// bad
function DialogOverlay({ className, ...props }: DialogOverlayProps) { ... }

// good
function DialogOverlay(props: DialogOverlayProps) {
  const { className, ...rest } = props;
  return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn('…', className)} {...rest} />;
}
```

A trivial wrapper that forwards everything can skip destructuring: `function DialogTrigger(props: DialogTriggerProps) { return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />; }`.

### 8. Section comment blocks — divider + the part's name

When the file defines multiple parts, put this divider above each prop-type/function pair. The title is the **exact component name** (`DialogContent`), not a prose phrase:

```tsx
// ------------------------------------------------------------
// DialogContent
// ------------------------------------------------------------

export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content>;

function DialogContent(props: DialogContentProps) { ... }
```

Group trailing non-component helpers under a `Helper functions` divider (see `conversation.tsx`). If the file defines only a single component, skip the dividers.

### 9. Compound export at the top — no JSDoc

Right after the imports, export one composed component; define the parts below (function declarations hoist):

```tsx
export const Dialog = composeCompoundComponent(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
  Header: DialogHeader,
  Footer: DialogFooter,
  Title: DialogTitle,
  Description: DialogDescription,
});
```

Map source part names to PascalCase keys (`Dialog.Trigger`, `Dialog.Content`). The project's components do **not** put a JSDoc block on the compound export — keep it clean and omit it.

Add `'use client';` as the very first line whenever the component uses client-only APIs (Radix primitives, hooks, browser events).

### 10. Exports — inline only

Export exactly:

1. The compound component (`export const Dialog = composeCompoundComponent(...)`), and
2. Each part's prop type (`export type DialogProps`, `export type DialogContentProps`, …), inline above its function.

The part **functions are not exported** — only their types and the compound object are public. **Remove** any trailing `export { Dialog, DialogTrigger, … }` barrel block from the source.

**One exception:** a standalone helper that consumers must use directly and that is *not* a member of the compound object may be exported as a named function — e.g. `export function TooltipProvider(...)` in `tooltip.tsx`. Use this sparingly, only for genuine standalone pieces like providers.

## File layout (reference — follow `dialog.tsx`)

1. `'use client'` (if needed)
2. Imports — `{ Component as ComponentPrimitive } from 'radix-ui'`, icons, `import type { ComponentProps } from 'react'`, `cn`/`composeCompoundComponent` from `@/lib/utils/components`, relative imports to sibling components and hooks
3. `export const Component = composeCompoundComponent(ComponentRoot, { … })`
4. Each part: section divider → `export type …Props` → non-exported `function` (with `data-slot` on nodes)
5. Optional `Helper functions` section at the bottom
6. No trailing `export { … }` block

Non-Radix layout parts (e.g. `DialogHeader`) use `ComponentProps<'div'>` and a plain `div` with `data-slot`.

## Pre-merge checklist

- [ ] Checked for an existing component at the resolved path, the sibling `ui`/`ai-elements` dir, and case/tracked variants **before** any writes or deletes
- [ ] If found: user confirmed overwrite / new path, or task stopped because it's already installed
- [ ] Did **not** delete or replace files without explicit user confirmation
- [ ] Location resolved (user path, `ai-elements` for AI/chat, `ui` otherwise, or asked)
- [ ] Followed **dialog / tooltip / conversation only** — did not copy `button.tsx` legacy idioms
- [ ] Radix from unified `radix-ui` (no `@radix-ui/react-*`); aliased to `<Component>Primitive`
- [ ] `data-slot` on every primitive and layout node
- [ ] No `import * as React`; `ComponentProps` imported with `import type` and used unqualified
- [ ] `cn` / `composeCompoundComponent` from `@/lib/utils/components`
- [ ] All parts are `function` declarations; part functions not exported
- [ ] Root primitive wrapped (no `const X = Primitive.Root`); root type omits `Root`
- [ ] Prop types use `type`, exported inline above each function
- [ ] Props destructured inside the body, not in the parameter list
- [ ] Section dividers use the exact component name; only when multiple parts exist
- [ ] No JSDoc on the compound export
- [ ] Single top-level `export const` compound; no trailing `export { … }` block (Provider-style standalone exception allowed)
- [ ] Flat kebab-case `.tsx` file (no `<name>/index.tsx`); no barrel to update
- [ ] Missing npm deps installed via `pnpm web add` from repo root (checked `web/package.json` first)
- [ ] `pnpm web typecheck` run if imports/types are non-trivial
