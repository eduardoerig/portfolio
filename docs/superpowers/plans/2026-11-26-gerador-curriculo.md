# Gerador de currículo — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O currículo em PDF (visual e simples, PT e EN) é gerado na hora a partir do banco do portfólio, e o admin ganha os campos que faltam, o cadastro de idiomas e uma limpeza de arquivos soltos.

**Architecture:** Uma função pura (`src/cv/resume.ts`) transforma o `Portfolio` de `getPortfolio(locale)` mais os campos novos num `Resume` pronto para desenhar. Dois documentos `@react-pdf/renderer` (`VisualCv`, `SimpleCv`) desenham esse `Resume`; route handlers `/curriculo.pdf` e `/en/resume.pdf` devolvem o PDF. Idiomas entram como mais um `Kind` do admin, no mesmo padrão de Formação.

**Tech Stack:** Next.js 15.5 App Router, React 19, Prisma 6 (SQLite/libSQL), zod 4, Vitest. Novos: `@react-pdf/renderer` (dependência), `@fontsource/inter` e `unpdf` (devDependencies).

**Spec:** `docs/superpowers/specs/2026-11-26-gerador-curriculo-design.md`

## Global Constraints
- Nunca citar o nome da hospedagem nem do banco remoto no repositório (código, comentários, commits, README, `.env.example`). "Armazenamento" e "banco remoto/de produção" são os termos.
- Nunca apagar, recriar ou resetar `prisma/dev.db`. Mudanças locais só por `npx prisma db push` (sem `--force-reset`, sem `--accept-data-loss`).
- Nenhum segredo impresso em log, teste ou saída de script.
- Comentários e mensagens em português; commits sem linhas de atribuição.
- Campos EN vazios caem no PT (`pick`/`pickNull`/`pickList` de `src/lib/localize.ts`).
- Todo texto do PDF é texto selecionável (nada de texto em imagem).
- `Cache-Control: no-store` nos PDFs.
- Telefone nunca aparece no site, só no PDF.
- Fontes: Inter 300/400/600/700/900 (visual); Helvetica embutida (simples).
- Limpeza: só apaga arquivo não referenciado **e** com mais de 24 h.
- `cvPath` fica no schema como obsoleto (comentário igual ao de `Skill.learning`); nenhum código o lê.

## Review Focus
1. Perfil existente no banco sem os campos novos (todos `null`): o PDF sai sem cidade/telefone/frase, sem linha vazia nem separador sobrando — teste em Task 2 (`buildResume` com extras nulos).
2. Nome com uma palavra só ("Eduardo"): divisão em duas linhas e monograma não quebram (linha 2 vazia, iniciais "E") — teste em Task 2.
3. Acentos e "ç/ã" no PDF visual e no simples (fonte sem o glifo vira quadrado): o teste de texto extraído em Task 3 procura "Formação"/"Competências".
4. Muitos projetos/experiências: o conteúdo passa para a página 2 sem cortar, com a barra lateral repetida — teste em Task 3 (fixture com 8 projetos → `pages >= 2` e o último título aparece no texto).
5. Limpeza rodando enquanto um envio acabou de ser feito (arquivo novo ainda não salvo): não pode apagar — teste em Task 6 (objeto de 1 h sem referência fica).

---

### Task 1: Banco — campos novos, modelo Language e script do banco remoto

**Files:**
- Modify: `prisma/schema.prisma`, `prisma/seed.ts`, `package.json`
- Create: `scripts/db-remote-cv.ts`
- Test: `tests/db-remote-cv.test.ts`

**Interfaces:**
- Produces: colunas `Profile.fullName`, `location`, `locationEn`, `phone`, `cvClosing`, `cvClosingEn` (todas `String?`); modelo `Language { id Int @id, name String, nameEn String?, level String, levelEn String?, proficiency Int, order Int, visible Boolean @default(true) }`; `export async function applyCvSchema(client: Client): Promise<void>` em `scripts/db-remote-cv.ts`; npm script `db:remote:cv`.

- [ ] **Step 1: Write the failing test** `tests/db-remote-cv.test.ts` (ambiente node, banco `file:` temporário criado com o SQL de `prisma migrate diff --from-empty` do schema **anterior**, como em `tests/db-copy.test.ts`):
  - `applyCvSchema adiciona as colunas e a tabela sem perder o perfil`: insere Profile id=1 `name "Eduardo Erig"`, roda `applyCvSchema`, espera `name` ainda `"Eduardo Erig"`, `fullName` `null`, e `SELECT * FROM Language` com 2 linhas: `{name:"Português", nameEn:"Portuguese", level:"Nativo", levelEn:"Native", proficiency:5, order:0}` e `{name:"Inglês", nameEn:"English", level:"Intermediário: leitura técnica e documentação", levelEn:"Intermediate: technical reading and documentation", proficiency:3, order:1}`.
  - `rodar duas vezes não dá erro nem duplica idiomas`: chama duas vezes, `Language` continua com 2 linhas.
- [ ] **Step 2: Run** `npx vitest run tests/db-remote-cv.test.ts` — Expected: FAIL (módulo não existe).
- [ ] **Step 3: Implement.** Schema: campos e modelo acima; acima de `cvPath` o comentário `// Obsoleto: não é mais lido (o currículo é gerado). Mantido para o db push não apagar dados.` Script: lê `PRAGMA table_info(Profile)` e só faz `ALTER TABLE Profile ADD COLUMN <c> TEXT` para as que faltam; `CREATE TABLE IF NOT EXISTS "Language"` com as mesmas colunas/tipos que o Prisma gera para SQLite; insere os 2 idiomas só se a tabela estiver vazia. `main()` igual a `db-remote-init.ts` (lê `REMOTE_DATABASE_URL`/`REMOTE_DATABASE_AUTH_TOKEN`, imprime só "Banco remoto atualizado."), executado apenas quando o arquivo é o entrypoint (o teste importa `applyCvSchema`). `package.json`: `"db:remote:cv": "tsx --env-file=.env scripts/db-remote-cv.ts"`. Seed: cria os mesmos 2 idiomas (ids 1 e 2) dentro do bloco que só roda em banco vazio.
- [ ] **Step 4: Run** `npx vitest run tests/db-remote-cv.test.ts` — Expected: PASS. Depois `npx prisma db push --skip-generate && npx prisma generate` no `dev.db` — Expected: "Your database is now in sync", sem pedir data loss. Depois aplicar os idiomas iniciais no `dev.db` com `npx tsx -e` chamando `applyCvSchema` com `createClient({ url: "file:prisma/dev.db" })`.
- [ ] **Step 5: Commit** `feat(db): campos do currículo e idiomas`

### Task 2: Dados do currículo (função pura + leitura do banco) e textos

**Files:**
- Create: `src/cv/resume.ts`, `src/cv/data.ts`
- Modify: `src/i18n/dictionary.ts`
- Test: `tests/cv-resume.test.ts`

**Interfaces:**
- Consumes: `Portfolio` (`src/lib/types.ts`), colunas da Task 1.
- Produces (em `src/cv/resume.ts`):
  ```ts
  export type CvExtras = { fullName: string | null; location: string | null; phone: string | null; closing: string | null;
    languages: { name: string; level: string; proficiency: number }[] };
  export type Segment = { text: string; bold: boolean };
  export type SkillGroup = { group: string; items: { name: string; learning: boolean }[] };
  export type Resume = Portfolio & { cv: { fullName: string; nameLines: [string, string]; initials: string;
    location: string | null; phone: string | null; closing: Segment[]; languages: CvExtras["languages"];
    skillGroups: SkillGroup[]; hasLearning: boolean; locale: Locale } };
  export function splitName(full: string): [string, string];
  export function initials(full: string): string;
  export function parseBold(text: string | null): Segment[];
  export function groupSkills(skills: Skill[]): SkillGroup[];
  export function buildResume(p: Portfolio, x: CvExtras, locale: Locale): Resume;
  export function cvFilename(fullName: string, locale: Locale, simple: boolean): string;
  export const linkLabel: (url: string) => string;
  ```
  `src/cv/data.ts`: `export async function getResume(locale: Locale): Promise<Resume>` (usa `getPortfolio` + lê `Profile` e `Language` visíveis em `ORDER`, com `pick`).
  `dictionary.ts`: chave `cv` em PT e EN: `contact, skills, education, languages, summary, experience, projects, learningLegend, learningPrefix` — PT: `"Contato","Competências","Formação","Idiomas","Resumo","Experiência","Projetos","Contorno tracejado = em aprendizado","Em aprendizado"`; EN: `"Contact","Skills","Education","Languages","Summary","Experience","Projects","Dashed outline = currently learning","Currently learning"`.

- [ ] **Step 1: Write the failing tests** `tests/cv-resume.test.ts` (sobre `fixturePortfolio`):
  - `splitName("Eduardo Felipe Storck Erig")` → `["Eduardo Felipe", "Storck Erig"]`; `splitName("Eduardo Felipe Erig")` → `["Eduardo Felipe", "Erig"]`; `splitName("Eduardo")` → `["Eduardo", ""]`.
  - `initials("Eduardo Felipe Storck Erig")` → `"EE"`; `initials("Eduardo")` → `"E"`.
  - `parseBold("Aberto a **vagas remotas** de X.")` → `[{text:"Aberto a ",bold:false},{text:"vagas remotas",bold:true},{text:" de X.",bold:false}]`; `parseBold(null)` → `[]`.
  - `groupSkills` mantém a ordem da primeira aparição de cada grupo e marca `learning` quando `level === "learning"`.
  - `buildResume` com `fullName: null` usa `profile.name`; com extras todos nulos e `languages: []` → `location`/`phone` `null`, `closing` `[]`; `hasLearning` false quando nenhuma skill é `learning`.
  - `cvFilename("Eduardo Felipe Storck Erig","pt",false)` → `"CV_Eduardo_Erig_PT.pdf"`; `("…","en",true)` → `"CV_Eduardo_Erig_EN_simples.pdf"` (primeiro e último nome, sem acento).
  - `linkLabel("https://github.com/eduardoerig/x/")` → `"github.com/eduardoerig/x"`.
- [ ] **Step 2: Run** `npx vitest run tests/cv-resume.test.ts` — Expected: FAIL (módulo não existe).
- [ ] **Step 3: Implement** as funções acima. `splitName`: primeira metade das palavras arredondada para cima. `cvFilename`: `normalize("NFD")` tirando diacríticos.
- [ ] **Step 4: Run** `npx vitest run tests/cv-resume.test.ts` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(cv): dados do currículo a partir do portfólio`

### Task 3: PDFs (dois modelos) e endereços

**Files:**
- Create: `src/cv/fonts.ts`, `src/cv/fonts/inter-{300,400,600,700,900}.woff`, `src/cv/VisualCv.tsx`, `src/cv/SimpleCv.tsx`, `src/cv/render.ts`, `src/app/(pt)/curriculo.pdf/route.ts`, `src/app/(en)/en/resume.pdf/route.ts`
- Modify: `next.config.ts`, `package.json`
- Test: `tests/cv-route.test.ts`

**Interfaces:**
- Consumes: `Resume`, `getResume`, `cvFilename`, `linkLabel`, `dictionary.cv` (Task 2).
- Produces: `export async function renderResume(resume: Resume, simple: boolean): Promise<Buffer>` e `export async function resumeResponse(locale: Locale, req: Request): Promise<Response>` em `src/cv/render.ts`. Rotas: `export const runtime = "nodejs"; export const dynamic = "force-dynamic"; export const GET = (req: Request) => resumeResponse("pt"|"en", req)`.

- [ ] **Step 1: Install** `npm i @react-pdf/renderer` e `npm i -D @fontsource/inter unpdf`; copiar `node_modules/@fontsource/inter/files/inter-latin-<peso>-normal.woff` para `src/cv/fonts/inter-<peso>.woff` (latin cobre ç, ã, é).
- [ ] **Step 2: Write the failing test** `tests/cv-route.test.ts` (ambiente node; banco `file:./test-cv.db` criado como em `tests/portfolio.test.ts`; nome do arquivo novo no padrão `prisma/test-*.db`):
  - `GET /curriculo.pdf responde PDF`: `resumeResponse("pt", new Request("http://x/curriculo.pdf"))` → status 200, `content-type` `application/pdf`, `cache-control` `no-store`, `content-disposition` contém `CV_Eduardo_Erig_PT.pdf`, bytes começam com `%PDF`.
  - Para cada combinação PT/EN × visual/simples: `extractText` do `unpdf` (com `mergePages: true`) contém o nome do perfil, o cargo da primeira experiência, o título do primeiro projeto e, em PT, `"Formação"` e `"Competências"` (EN: `"Education"`, `"Skills"`).
  - `?modelo=simples` muda o nome do arquivo para `…_simples.pdf`.
  - `muitos projetos quebram página`: `renderResume` com um `Resume` de 8 projetos → `getDocumentProxy(...).numPages >= 2` e o texto contém o título do 8º.
- [ ] **Step 3: Run** `npx vitest run tests/cv-route.test.ts` — Expected: FAIL.
- [ ] **Step 4: Implement.**
  - `fonts.ts`: `Font.register({ family: "Inter", fonts: [...] })` com `path.join(process.cwd(), "src/cv/fonts/…")`, uma vez por processo; `Font.registerHyphenationCallback((w) => [w])` (não hifeniza).
  - `next.config.ts`: acrescentar `"@react-pdf/renderer"` em `serverExternalPackages` e `outputFileTracingIncludes: { "/curriculo.pdf": ["./src/cv/fonts/**"], "/en/resume.pdf": ["./src/cv/fonts/**"] }`.
  - `VisualCv`: A4 (595×842 pt), barra lateral preta à esquerda com `fixed` para repetir na página 2; regras de conteúdo da seção "Regras de conteúdo" do spec. Bullets "▸" e ícones de contato desenhados com `Svg` (a Inter não tem "▸"). Chip tracejado = `borderStyle: "dashed"`. Comparar lado a lado com `Desktop\curriculos\CV_Eduardo_Erig_PT.pdf`.
  - `SimpleCv`: `fontFamily: "Helvetica"`, uma coluna, formatos do spec ("Cargo · Empresa", "período · local", "**Título** (stack): descrição. link", "Grupo: itens. Em aprendizado: …", idiomas "Nome (nível)" separados por " · ").
  - `resumeResponse`: `simple = url.searchParams.get("modelo") === "simples"`; cabeçalhos `Content-Type: application/pdf`, `Content-Disposition: inline; filename="<cvFilename>"`, `Cache-Control: no-store`.
- [ ] **Step 5: Run** `npx vitest run tests/cv-route.test.ts` — Expected: PASS. Depois `npm run build` — Expected: build ok, rotas `/curriculo.pdf` e `/en/resume.pdf` como `ƒ` (dinâmicas). Abrir `http://localhost:3000/curriculo.pdf` com `npm run dev` e comparar com o PDF atual.
- [ ] **Step 6: Commit** `feat(cv): PDF visual e simples gerados na hora`

### Task 4: Perfil no admin, fim do upload de PDF e botão do site

**Files:**
- Modify: `src/app/(admin)/admin/actions.ts`, `src/lib/adminDraft.ts`, `src/components/admin/ProfileEditor.tsx`, `src/lib/types.ts`, `src/lib/portfolio.ts`, `src/content/fixture.ts`, `src/content/fixture.en.ts`, `src/components/sections/Hero.tsx`, `src/components/admin/Preview.tsx` (se ler `cvPath`)
- Test: `tests/Hero.test.tsx`, `tests/admin-actions.test.ts`, `tests/adminDraft.test.ts`, `tests/admin/editor.test.tsx`

**Interfaces:**
- Consumes: colunas da Task 1; rotas da Task 3.
- Produces: `profileSchema` aceita `fullName, location, locationEn, phone, cvClosing, cvClosingEn` (todos `optional`); `FIELDS.profile` inclui esses nomes; `Profile` (tipo) sem `cvPath`.

- [ ] **Step 1: Write the failing tests**
  - `Hero.test.tsx`: botão "Baixar currículo" tem `href="/curriculo.pdf"` em PT e `"/en/resume.pdf"` em EN, mesmo sem nenhum arquivo enviado.
  - `admin-actions.test.ts`: `updateProfile` com `fullName "Eduardo Felipe Storck Erig"`, `phone "+55 45 99985-1160"`, `cvClosingEn ""` salva `fullName`/`phone` e `cvClosingEn` `null`; um `cvKey` no formulário é ignorado (`cvPath` não muda).
  - `admin/editor.test.tsx`: o editor de Perfil mostra os campos "Nome completo (currículo)", "Cidade", "Telefone (só no PDF)", "Frase final do currículo" e não mostra "Currículo (PDF)"; mostra 4 links "Ver PDF" com `href` `/curriculo.pdf`, `/curriculo.pdf?modelo=simples`, `/en/resume.pdf`, `/en/resume.pdf?modelo=simples`, `target="_blank"`.
- [ ] **Step 2: Run** `npx vitest run tests/Hero.test.tsx tests/admin-actions.test.ts tests/admin/editor.test.tsx` — Expected: FAIL nesses testes.
- [ ] **Step 3: Implement.** Hero não recebe o idioma: acrescentar `cvHref` em `dict.hero` (PT `"/curriculo.pdf"`, EN `"/en/resume.pdf"`) e usar `<a href={dict.hero.cvHref} download …>` sempre, sem depender de `cvPath`. Tirar o slot `cv` de `updateProfile`, o `cvPath` de `types.ts`, `portfolio.ts`, `adminDraft.ts` e fixtures; `isReferenced` passa a olhar só `photoPath` e `imagePath`. ProfileEditor: `text("fullName", …)`, `<Tr … name="location">`, `text("phone", …)`, `<Tr … name="cvClosing" multiline hint="Trecho entre ** sai em negrito.">`, remover o Dropzone do PDF, links "Ver PDF".
- [ ] **Step 4: Run** `npm test` — Expected: tudo verde (corrigir os testes antigos que esperavam `cvPath`).
- [ ] **Step 5: Commit** `feat(admin): campos do currículo no perfil; botão do site usa o PDF gerado`

### Task 5: Idiomas no admin

**Files:**
- Modify: `src/lib/tables.ts`, `src/app/(admin)/admin/actions.ts`, `src/lib/adminDraft.ts`, `src/components/admin/ItemEditor.tsx`, `src/components/admin/ItemCard.tsx`, `src/components/admin/Preview.tsx`, `src/app/(admin)/admin/[section]/page.tsx`, `src/components/admin/Sidebar.tsx`, `src/app/(admin)/admin/layout.tsx`, `src/components/admin/AdminHeader.tsx`
- Test: `tests/admin-actions.test.ts`, `tests/admin/list.test.tsx`, `tests/admin/shell.test.tsx`

**Interfaces:**
- Consumes: modelo `Language` (Task 1).
- Produces: `Kind` inclui `"language"`; seção `/admin/idiomas` ("Idiomas"); `itemSchemas.language = { name: required("Idioma"), nameEn: optional, level: required("Nível"), levelEn: optional, proficiency: z.coerce.number().int().min(1).max(5, "Nível de 1 a 5"), visible: checkbox }`.

- [ ] **Step 1: Write the failing tests**
  - `admin-actions.test.ts`: `saveItem("language", form({ id:"", name:"Espanhol", level:"Básico", proficiency:"2", visible:"on" }))` cria a linha no fim da ordem; `proficiency:"9"` devolve erro em `proficiency`; `assertKind("language")` não lança.
  - `admin/shell.test.tsx`: menu tem "Idiomas" apontando para `/admin/idiomas` com a contagem.
  - `admin/list.test.tsx`: card de idioma mostra "Português · Nativo".
- [ ] **Step 2: Run** os três arquivos — Expected: FAIL.
- [ ] **Step 3: Implement.** Editor: `<Tr name="name" label="Idioma">`, `<Tr name="level" label="Nível (texto)">`, `<Select name="proficiency" label="Barra no currículo" options={[["1","1"],…,["5","5"]]}>`. Preview para `language`: texto "Aparece só no currículo." (o site não mostra idiomas).
- [ ] **Step 4: Run** `npm test` — Expected: tudo verde.
- [ ] **Step 5: Commit** `feat(admin): cadastro de idiomas`

### Task 6: Limpeza de arquivos soltos

**Files:**
- Modify: `src/lib/storage.ts`, `src/app/(admin)/admin/actions.ts`, `src/app/(admin)/admin/page.tsx`
- Create: `src/components/admin/StorageCleanup.tsx`
- Test: `tests/storage.test.ts`, `tests/admin-actions.test.ts`

**Interfaces:**
- Produces: `export async function listObjects(): Promise<{ key: string; size: number; lastModified: Date }[]>` (ListObjectsV2: `GET ${base}?list-type=2`, lê `<Key>`, `<Size>`, `<LastModified>` de cada `<Contents>`; comentário `// shortcut: lê só a primeira página (1000 arquivos); paginar com continuation-token se um dia passar disso.`); action `export async function cleanStorage(): Promise<{ removed: number; freedBytes: number; totalBytes: number }>` (começa com `requireAdmin`).

- [ ] **Step 1: Write the failing tests**
  - `storage.test.ts`: `listObjects` com `fetch` simulado devolvendo XML de 2 `<Contents>` → 2 itens com `size` número e `lastModified` `Date`; a URL pedida contém `list-type=2`.
  - `admin-actions.test.ts` (o mock de `@/lib/storage` ganha `listObjects`): bucket com A (foto do perfil, 3 dias), B (sem referência, 3 dias, 1000 bytes), C (sem referência, 1 h), D (chave que só está no `cvPath` obsoleto, 3 dias, 500 bytes) → `cleanStorage()` apaga B e D, mantém A e C, devolve `{ removed: 2, freedBytes: 1500, totalBytes: <soma de A e C> }`; sem admin, `requireAdmin` rejeita e nada é apagado.
- [ ] **Step 2: Run** `npx vitest run tests/storage.test.ts tests/admin-actions.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** `cleanStorage`: lê `photoPath` e todos `imagePath` num conjunto; apaga com `deleteObject` o que não está no conjunto, é `isStoredKey` e tem `lastModified` < agora − 24 h. `StorageCleanup` (client): botão "Limpar arquivos soltos", depois mostra "N arquivos removidos · X MB liberados · total usado Y MB" (MB com 1 casa). Fica abaixo do editor na página de Perfil.
- [ ] **Step 4: Run** `npm test` — Expected: tudo verde. `npm run build` — Expected: ok.
- [ ] **Step 5: Commit** `feat(admin): limpeza de arquivos soltos no armazenamento`

### Depois das tasks (com o usuário)
1. Usuário roda `npm run db:remote:cv` (banco de produção ganha colunas e idiomas) — **antes** de publicar.
2. Push para `main` só com o ok do usuário; conferir `/curriculo.pdf` e `/en/resume.pdf` no ar.
3. Usuário preenche no admin: nome completo, cidade, telefone, frase final (PT/EN) e confere os idiomas; depois clica em "Limpar arquivos soltos" (some o PDF antigo).
4. Vault: linha em `Decisões.md` e nota de sessão.
