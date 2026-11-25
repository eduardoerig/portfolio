# Portfólio Eduardo Erig — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Next.js portfolio site for recruiters, in the "Terminal" style with light and dark themes, plus an `/admin` panel where Eduardo edits all of the content.

**Architecture:**
- One Next.js app (App Router, TypeScript).
- The public page `/` is a Server Component that reads from SQLite through Prisma.
- `/admin` is protected by a signed session cookie and changes data through Server Actions, which call `revalidatePath('/')`.
- Uploaded files go to `storage/uploads` and are served through a route handler.

**Tech Stack:**
- Framework: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4.
- Data: Prisma with SQLite.
- Validation and auth: zod, bcryptjs, jose.
- Tests: Vitest with Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-24-portfolio-design.md`

## Global Constraints

- **Copy:**
  - All UI copy is in Portuguese.
  - Never mention or depend on the two hosted platforms Eduardo vetoed (his note: "não passa credibilidade"); the names live only in his private notes. Keep code, copy, README and dependencies free of third-party BaaS/serverless-host brands.
  - React, Next.js and TypeScript are shown as "aprendendo" (`learning: true`), never as mastered.
- **Colors:**
  - Navy palette, changed by Eduardo on 2026-11-24 (source of truth: CSS variables in `src/app/globals.css`; never hardcode colors).
  - Dark theme: background `#0b1526`, text `#e4e9f1`, accent `#8ea6d4`, button `#1f3a8a`, border `#1b365d`.
  - Light theme: background `#eef1f6`, text `#13233f`, accent and button `#1b365d`, border `#c5cfda`.
  - Both themes have a soft navy halo at the top.
  - Both themes have the thin grid background.
- **Theme:** the first visit follows `prefers-color-scheme`, the toggle is ☾/☀, and the choice is saved in `localStorage` under `theme`. There must be no flash of the wrong theme on load.
- **Motion:** animations stay light and turn off under `prefers-reduced-motion: reduce`.
- **Section order:**
  - hero → `// projetos` → `// experiência` → `// competências` → `// formação` → `// contato`;
  - the hero shows the photo with a blue glow, `> whoami`, the name, the role, the "aberto a oportunidades" badge, and the buttons Baixar currículo, GitHub and LinkedIn.
- **Projects:** a card only, never a detail page. Contact is links only, with no form.
- **Git:** `.gitignore` covers `*.db`, `*.db-journal`, `storage/`, `.env` and `.env*.local`. The phone number never appears in the repo.
- **Code style:** easy for a learner to read, with plain names and no extra libraries beyond the stack above.
- **Hand-off:** every task ends with a 3–5 line Portuguese explanation for Eduardo of what was built and why.

## Review Focus

1. **Empty optional fields:** a project with no `url` or no `imagePath` shows a tidy card, with no broken link or image. Tested in Task 2.
2. **Hidden items:** an item with `visible = false` never shows on `/`. Tested in Task 3.
3. **Unauthenticated writes:** calling an admin Server Action without a session must throw and change nothing. Tested in Task 4.
4. **Bad uploads:** a wrong file type (an `.exe` sent as the photo, a `.png` sent as the CV) or an oversized file is rejected with a Portuguese message. Tested in Task 6.
5. **Reordering past the ends:** moving the first item up or the last item down changes nothing. Tested in Task 5.

---

### Task 1: Project setup and ECC plugin

**Files:**
- Create: the Next.js scaffold in `C:\Users\eduardo\Desktop\portfolio`, plus `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `.env.example` and `tests/smoke.test.ts`.

**Interfaces:**
- Produces:
  - `npm run dev`, `npm test` (vitest run) and `npm run lint`;
  - the path alias `@/` → `src/`.

- [ ] **Step 1: Initialize git and install ECC locally**
  - Wait until `C:\Users\eduardo\Desktop\ECC` is fully cloned. Read its README install section; the official sources are the `ecc@ecc` plugin or a local marketplace.
  - From the portfolio folder, run `claude plugin marketplace add C:\Users\eduardo\Desktop\ECC`, then `claude plugin install ecc@ecc --scope local`.
  - Write down which ECC React, Next or TS skills and agents will be used.
- [ ] **Step 2: Scaffold the app**
  - Run `npx create-next-app@15 . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm`, keeping the existing `docs/` and `.superpowers/`.
  - If it refuses because the folder is not empty, scaffold into a sibling temp folder and move the files in.
  - Add `.superpowers/` to `.gitignore`.
- [ ] **Step 3: Add Vitest**
  - Run `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom`.
  - Set up the config with the `jsdom` environment and the `@` alias.
- [ ] **Step 4: Write a smoke test** in `tests/smoke.test.ts` asserting `expect(1 + 1).toBe(2)`. Run `npm test`. Expected: 1 passed.
- [ ] **Step 5: Commit** with the message `chore: setup Next.js, Vitest e ECC local`.

### Task 2: Static public page in the Terminal style (for Eduardo's approval)

**Files:**
- Create:
  - `src/lib/types.ts`;
  - `src/content/fixture.ts`;
  - `src/lib/theme.ts`;
  - `src/components/ThemeToggle.tsx`;
  - `src/components/sections/{Hero,Projects,Experience,Skills,Education,Contact}.tsx`;
  - `src/components/ProjectCard.tsx`.
- Modify: `src/app/layout.tsx`, `src/app/page.tsx` and `src/app/globals.css`.
- Test: `tests/theme.test.ts` and `tests/ProjectCard.test.tsx`.

**Interfaces:**
- Produces, in `src/lib/types.ts`:
  ```ts
  type Profile = { name: string; role: string; summary: string; openToWork: boolean;
    email: string; githubUrl: string; linkedinUrl: string; photoPath: string | null; cvPath: string | null };
  type Project = { id: number; title: string; description: string; stack: string[];
    url: string | null; imagePath: string | null; metric: string | null };
  type Experience = { id: number; role: string; company: string; location: string;
    period: string; bullets: string[]; current: boolean };
  type Skill = { id: number; name: string; group: string; learning: boolean };
  type Education = { id: number; course: string; school: string; period: string; note: string | null };
  type Portfolio = { profile: Profile; projects: Project[]; experiences: Experience[];
    skills: Skill[]; education: Education[] };
  ```
- Produces:
  - `src/lib/theme.ts` exports `resolveTheme(stored: string | null, prefersDark: boolean): 'light' | 'dark'` and `THEME_SCRIPT: string`, an inline script placed in `<head>` before paint.
  - `fixture.ts` exports `fixturePortfolio: Portfolio`, built from the spec's "Conteúdo inicial" section.
  - The sections all take props from `Portfolio`.

- [ ] **Step 1: Write failing tests**
  - `resolveTheme('dark', false) === 'dark'`
  - `resolveTheme('light', true) === 'light'`
  - `resolveTheme(null, true) === 'dark'`
  - `resolveTheme(null, false) === 'light'`
  - `resolveTheme('garbage', true) === 'dark'`
  - For a `ProjectCard` with `url: null, imagePath: null`, `queryByRole('link')` is null and `queryByRole('img')` is null, and every `stack` item is rendered as text.
  - A `ProjectCard` with a `metric` renders the metric text.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL (the modules don't exist yet).
- [ ] **Step 3: Implement `theme.ts`.**
  - The theme is a `data-theme` attribute on `<html>`.
  - Set up the CSS variables for both themes, with the hex values from Global Constraints.
- [ ] **Step 4: Implement the types, the fixture, the sections and `ProjectCard`.**
  - Section headings use a monospace font (`// projetos`). The photo circle shows the initials "EE" when `photoPath` is null.
  - Skills are grouped by `group`, and `learning` skills get a dashed border with the label "aprendendo".
  - Wrap every animation in `@media (prefers-reduced-motion: no-preference)`.
- [ ] **Step 5: Run `npm test`.** Expected: PASS.
- [ ] **Step 6: Check it in the browser**
  - Run `npm run dev` and open `/` in both themes and at 375px width.
  - The page must have no horizontal scroll, and the toggle must survive a reload with no flash.
- [ ] **Step 7: Commit** with the message `feat: página pública estática no estilo Terminal`.
- [ ] **Step 8: Get Eduardo's approval.** Stop and show him the page. Don't start Task 3 until he approves the look.

### Task 2d: PT/EN languages on the public page

Added after Eduardo's request on 2026-11-24. See the "Idiomas" section of the spec.

**Files:**
- Create:
  - `src/i18n/locales.ts`
  - `src/i18n/dictionary.ts`
  - `src/components/LanguageSwitcher.tsx`
  - `src/components/flags/{BrazilFlag,UsaFlag}.tsx`
  - `src/components/PortfolioPage.tsx`
  - `src/content/fixture.en.ts`
- Move: the current root `layout.tsx` and `page.tsx` into the route groups `src/app/(pt)/` and `src/app/(en)/en/`, two root layouts each with its own `<html lang>`. The shared markup moves to `PortfolioPage`.
- Test: `tests/i18n.test.ts` and `tests/LanguageSwitcher.test.tsx`.

**Interfaces:**
- Produces, in `src/i18n/locales.ts`:
  - `type Locale = 'pt' | 'en'`
  - `const LOCALES: Locale[] = ['pt', 'en']`
  - `localePath(locale: Locale): string`, which returns `'/'` for pt and `'/en'` for en.
- Produces, in `src/i18n/dictionary.ts`:
  - `getDictionary(locale: Locale): Dictionary`, holding every fixed UI string: section labels and headings, buttons, the badge, "aprendendo"/"learning", nav links, the scroll hint, "ver código"/"view code", aria labels and contact copy.
  - `pt` and `en` have exactly the same keys.
- Produces, for content:
  - `getFixturePortfolio(locale: Locale): Portfolio`. pt uses the existing fixture; en uses `fixture.en.ts`, an English translation written by Claude.
  - The data shapes do not change.
- Produces `PortfolioPage({ portfolio, dict, locale })`.
- Produces `LanguageSwitcher({ locale })`:
  - Two flag buttons, with the current one marked by `aria-pressed`.
  - Clicking the other flag shows a full-page loading overlay (a spinner and "Carregando…"/"Loading…", fading in about 150ms), then navigates to the other locale's path.
  - With reduced motion the overlay appears without animation.

- [ ] **Step 1: Write failing tests:**
  - `localePath('pt') === '/'` and `localePath('en') === '/en'`.
  - `Object.keys(getDictionary('pt'))` deep-equals `Object.keys(getDictionary('en'))`, recursively.
  - `getFixturePortfolio('en').projects.length === getFixturePortfolio('pt').projects.length`.
  - `LanguageSwitcher` with `locale='pt'` renders 2 buttons, and the Brazil one has `aria-pressed="true"`. Clicking the USA button renders the loading overlay (role `status`).
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The switcher sits in the floating nav, next to the ThemeToggle.
  - `/` and `/en` both export `metadata`, with `alternates.languages` set to `{ 'pt-BR': '/', en: '/en' }`.
  - The theme script and no-flash behavior work in both layouts.
- [ ] **Step 4: Run `npm test`, lint and tsc,** then check in the browser:
  - `/` is in Portuguese and `/en` is in English.
  - Switching shows the loading overlay and lands on the other language.
  - The theme persists across the switch.
  - At 375px there is no horizontal scroll.
- [ ] **Step 5: Commit** with the message `feat: site em português e inglês com seletor de bandeiras`.

### Task 3: Database, seed and reading on the public page

> **Language amendment (2026-11-24):**
> - Every translatable text column gets an English twin with an `En` suffix (`roleEn`, `summaryEn`, `titleEn`, `descriptionEn`, `metricEn`, `bulletsEn`, `periodEn`, `locationEn`, `groupEn`, `courseEn`, `noteEn`). The `En` columns are nullable.
> - The signature becomes `getPortfolio(locale: Locale, opts?)`. For `en` it uses each `En` field and falls back to PT when the `En` field is null or empty.
> - The seed fills both languages from `getFixturePortfolio('pt')` and `getFixturePortfolio('en')`.
> - Add one test: when `summaryEn` is null, `getPortfolio('en').profile.summary` equals the PT summary.

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts` and `src/lib/db.ts`.
- Create the repository: `src/lib/portfolio.ts`.
- Modify: `src/app/page.tsx`, which reads from the database instead of the fixture.
- Test: `tests/portfolio.test.ts`, which runs against `file:./test.db` and is reset with `prisma db push --force-reset`.

**Interfaces:**
- Consumes: the `Portfolio` types from Task 2.
- Produces:
  - **Prisma models:**
    - `Profile` (a single row, `id = 1`).
    - `Project`, `Experience`, `Skill` and `Education`. Each has `order Int` and `visible Boolean @default(true)`.
    - `stack` and `bullets` are stored as JSON strings, since SQLite has no arrays.
  - **Functions:**
    - `getPortfolio(opts?: { includeHidden?: boolean }): Promise<Portfolio>`. It sorts each list by `order` ascending and parses the JSON fields.
    - `db`, a singleton `PrismaClient`.
  - **Seed:** inserts `fixturePortfolio` (no phone number) and is idempotent through upserts. It runs with `npx prisma db seed`.

- [ ] **Step 1: Write failing tests**
  - Seed, then `getPortfolio()` returns 4 projects, in the order Requests, Dolce Delícias, Automação do Instagram, Topografia.
  - After setting `visible = false` on Dolce, `getPortfolio()` returns 3 projects and `getPortfolio({ includeHidden: true })` returns 4.
  - The skills React, Next.js and TypeScript have `learning === true`.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement the schema, `db.ts`, `portfolio.ts` and the seed.** Also add `DATABASE_URL="file:./dev.db"` to `.env.example`.
- [ ] **Step 4: Run `npx prisma db push && npx prisma db seed && npm test`.** Expected: PASS, and `/` looks the same as it did in Task 2.
- [ ] **Step 5: Commit** with the message `feat: banco SQLite com Prisma e seed`.

### Task 4: Admin login and session

**Files:**
- Create:
  - auth code: `src/lib/auth.ts` and `src/middleware.ts`;
  - login page: `src/app/admin/login/page.tsx` and `src/app/admin/login/actions.ts`;
  - tooling: `scripts/hash-password.ts`.
- Test: `tests/auth.test.ts`.

**Interfaces:**
- Produces, in `src/lib/auth.ts`:
  - `verifyPassword(plain: string): Promise<boolean>`, which compares against `ADMIN_PASSWORD_HASH` (bcrypt) in `.env`;
  - `createSession(): Promise<string>`, a jose HS256 JWT with `sub: 'admin'` that expires in 7 days and is signed with `SESSION_SECRET`;
  - `readSession(token?: string): Promise<boolean>`;
  - `requireAdmin(): Promise<void>`, which reads the `session` cookie and throws `Error('Não autorizado')` when it's invalid. Every admin Server Action calls it first.
- Produces, elsewhere:
  - The cookie is `session`: httpOnly, `sameSite: 'lax'`, and `secure` in production.
  - The middleware redirects `/admin/*` (except `/admin/login`) to `/admin/login` when the session is invalid.
  - `npm run hash-password -- <senha>` prints the bcrypt hash for `.env`.

- [ ] **Step 1: Write failing tests**
  - `verifyPassword` with the right password → true, with the wrong one → false.
  - `readSession(await createSession())` → true.
  - `readSession('lixo')` → false.
  - `readSession(undefined)` → false.
  - A token signed with a different secret → false.
  - When `requireAdmin()` has no cookie, it rejects with `'Não autorizado'`.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement the auth module, the middleware, the login page and the hash script.**
  - A wrong password shows the message "Senha incorreta".
  - Add `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` to `.env.example`, with empty values.
- [ ] **Step 4: Run `npm test`.** Expected: PASS. Then check by hand: going to `/admin` without logging in redirects to `/admin/login`.
- [ ] **Step 5: Commit** with the message `feat: login do painel com sessão assinada`.

### Task 5: Admin panel CRUD

> **Language amendment (2026-11-24):**
> - Every translatable field appears twice in the forms, side by side or stacked, labeled "Português" and "English". The English field is optional.
> - The panel UI itself stays in Portuguese.
> - `revalidatePath` revalidates both `/` and `/en`.

**Files:**
- Create:
  - the reorder helper: `src/lib/reorder.ts`;
  - the actions: `src/app/admin/actions.ts`;
  - the pages: `src/app/admin/layout.tsx`, `src/app/admin/page.tsx` (profile) and `src/app/admin/[section]/page.tsx` for `projetos | experiencias | competencias | formacao`;
  - the form components: `src/components/admin/*`.
- Test: `tests/reorder.test.ts` and `tests/admin-actions.test.ts`, run against the test db.

**Interfaces:**
- Consumes: `requireAdmin` (Task 4), `db` and `getPortfolio({ includeHidden: true })` (Task 3).
- Produces:
  - `moveItem<T extends { id: number }>(items: T[], id: number, dir: 'up' | 'down'): T[]`, a pure function that returns the reordered list.
  - In `actions.ts`, all with `'use server'`, and every one calls `requireAdmin()`, validates with zod, then calls `revalidatePath('/')`:
    - `updateProfile(form: FormData)`;
    - `saveItem(kind: Kind, form: FormData)`, which creates when `id` is empty and updates otherwise;
    - `deleteItem(kind: Kind, id: number)`;
    - `toggleVisible(kind: Kind, id: number)`;
    - `move(kind: Kind, id: number, dir: 'up' | 'down')`.
  - `Kind = 'project' | 'experience' | 'skill' | 'education'`.
  - Form fields: `stack` and `bullets` are typed one per line, and `learning`, `current` and `visible` are checkboxes.

- [ ] **Step 1: Write failing tests**
  - `moveItem([a, b, c], b.id, 'up')` → `[b, a, c]`.
  - Moving the first item up, or the last item down, returns the same order.
  - An unknown id returns the same order.
  - `saveItem('project', form)` with an empty title rejects with a zod error and creates no row.
  - `toggleVisible` flips `visible`.
  - When `requireAdmin` is mocked to throw, `deleteItem` rejects and the row still exists.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement `reorder.ts`, the actions and the admin pages.**
  - Each list shows its items with ↑, ↓, "ocultar/mostrar", "editar" and "excluir"; excluir asks for confirmation.
  - The admin uses the same theme variables as the public page.
- [ ] **Step 4: Run `npm test`.** Expected: PASS. Then check by hand: editing a project title in `/admin/projetos` updates `/` after a reload.
- [ ] **Step 5: Commit** with the message `feat: painel admin com edição, ordem e visibilidade`.

### Task 6: Uploads for the photo, project images and CV

**Files:**
- Create: `src/lib/uploads.ts` and `src/app/files/[...path]/route.ts`.
- Modify:
  - in `src/app/admin/actions.ts`: `updateProfile` (fields `photo` and `cv`) and `saveItem('project')` (field `image`);
  - the Hero button "Baixar currículo", which only shows when `cvPath` is set.
- Test: `tests/uploads.test.ts`.

**Interfaces:**
- Produces:
  - `validateUpload(file: File, kind: 'image' | 'pdf'): { ok: true } | { ok: false; error: string }`:
    - `image` accepts `image/jpeg`, `image/png` and `image/webp` up to 3 MB;
    - `pdf` accepts `application/pdf` up to 5 MB;
    - the error messages are "Tipo de arquivo não permitido" and "Arquivo maior que o limite".
  - `saveUpload(file: File, kind): Promise<string>`, which writes to `storage/uploads/<uuid>.<ext>` and returns the public path `/files/<uuid>.<ext>`.
  - `GET /files/[...path]` serves the file from `storage/uploads` with the correct `Content-Type`. It returns 404 for missing files and for any path containing `..`.

- [ ] **Step 1: Write failing tests**
  - A PNG of 100 KB as `image` → ok.
  - A `.exe` (`application/octet-stream`) as `image` → "Tipo de arquivo não permitido".
  - A PNG as `pdf` → the type error.
  - A 4 MB image → "Arquivo maior que o limite".
  - The route with path `['..', '.env']` → 404.
- [ ] **Step 2: Run `npm test`.** Expected: FAIL.
- [ ] **Step 3: Implement the uploads module and the route, and wire them into the actions.** Replacing a file deletes the old one.
- [ ] **Step 4: Run `npm test`.** Expected: PASS. Then check by hand: upload a photo and the CV in `/admin`, and on `/` the photo shows with the blue glow and "Baixar currículo" downloads the PDF.
- [ ] **Step 5: Commit** with the message `feat: upload de foto, imagens e currículo`.

### Task 7: README and final pass

**Files:**
- Create: `README.md`, in Portuguese.

- [ ] **Step 1: Write the README.**
  - What the project is and the stack.
  - How to run it: `npm i`, copy `.env.example` to `.env`, `npm run hash-password`, `npx prisma db push`, `npx prisma db seed`, `npm run dev`.
  - How to use `/admin`.
  - Where the data lives, and what stays out of git.
- [ ] **Step 2: Run `npm test && npm run lint && npm run build`.** Expected: all pass.
- [ ] **Step 3: Run the forbidden-words grep from the controller ledger (the two vetoed platform names plus the phone digits).** Expected: no matches anywhere in the repo.
- [ ] **Step 4: Commit** with the message `docs: README do portfólio`.
