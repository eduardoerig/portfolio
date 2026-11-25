# Redesign do painel /admin: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel `/admin` no layout A: menu lateral, topo com status, avatar e "Ver site", editor com prévia ao vivo usando os componentes do site, chave PT/EN, campos de etiquetas, uploads com miniatura, Ctrl+S e aviso de alterações não salvas.

**Architecture:**
- O estado de cada editor é um objeto `Draft` no cliente. Funções puras convertem a linha do banco em `Draft`, o `Draft` em `FormData` (para as mesmas server actions) e o `Draft` nos tipos de `src/lib/types.ts`, que alimentam a prévia.
- A prévia renderiza `Hero`, `Contact`, `ProjectCard` etc. sem mudança nenhuma neles.
- Um contexto `AdminStatus` liga o editor ao topo: status salvo/não salvo, caminho atual e aviso "Salvo ✓".

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v4, Vitest + jsdom + Testing Library. Nenhuma dependência nova.

**Spec:** `docs/superpowers/specs/2026-11-25-admin-redesign-design.md`

## Global Constraints

- Nenhuma dependência nova. Ícones em SVG inline, no padrão de `src/components/icons`.
- As server actions em `src/app/(admin)/admin/actions.ts` não mudam: mesma assinatura, mesmas validações e `requireAdmin()` primeiro. O `FormData` enviado usa as mesmas chaves de hoje:
  - listas em texto, uma por linha (`stack`, `stackEn`, `bullets`, `bulletsEn`);
  - checkbox `"on"` quando marcado e ausente quando desmarcado;
  - `remove_<campo>=on` para remover arquivo;
  - `id` vazio para um item novo.
- Nada de seed, reset ou `db push` destrutivo: `prisma/dev.db` tem dados reais. Os testes usam os bancos próprios deles.
- Todos os textos da interface em português.
- Animações respeitam `prefers-reduced-motion`.
- Cores só pelos tokens (`--bg`, `--surface`, `--border`, `--fg`, `--muted`, `--accent`, `--accent-deep`, `--danger`) e pelas classes globais (`card`, `btn`, `btn-primary`, `pill`, `chip`, `label`, `display`).
- **Tema da prévia:** o botão de tema da prévia é o `ThemeToggle` existente e troca o tema do painel inteiro. Os tokens claros estão em `:root[data-theme="light"]`, então não dá para ter um tema só na prévia.
- Os 97 testes atuais continuam passando.

## Review Focus

1. **Server action lança erro** (sessão expirada, arquivo grande demais): o que foi digitado, as etiquetas e o arquivo escolhido continuam no editor, e aparece o `ActionError`. Teste na Task 5.
2. **Campo EN vazio:** a prévia em EN mostra o texto PT, igual ao site (`pick`/`pickList`). Uma lista EN vazia cai na lista PT. Teste na Task 1.
3. **Item novo salvo duas vezes** (duplo clique ou Ctrl+S repetido): só uma chamada a `saveItem` enquanto a primeira está pendente. Teste na Task 5.
4. **Sair com alterações não salvas** por um link da lateral ou do topo: pede confirmação, e cancelar mantém a página. Teste na Task 3.
5. **Etiqueta vazia ou repetida** (Enter num campo vazio ou numa tecnologia que já existe): não adiciona nada. Teste na Task 2.

---

### Task 1: Conversões puras (Draft ↔ banco ↔ FormData ↔ prévia)

**Files:**
- Create: `src/lib/localize.ts`. Mova para cá `pick`, `pickNull`, `pickList` e `toLevel` de `src/lib/portfolio.ts`, agora exportados.
- Modify: `src/lib/portfolio.ts`, que passa a importar de `localize.ts` sem mudar o comportamento.
- Create: `src/lib/adminDraft.ts`
- Test: `tests/adminDraft.test.ts`

**Interfaces:**
- Produces:
  - `type EditorKind = "profile" | Kind`
  - `type Draft = Record<string, string | boolean | string[]>`
  - `const LIST_FIELDS = ["stack", "stackEn", "bullets", "bulletsEn"]`
  - `const BOOL_FIELDS = ["visible", "current", "openToWork"]`
  - `rowToDraft(row: Record<string, unknown> | null, kind: EditorKind): Draft`:
    - um campo de `LIST_FIELDS` vira `string[]` via `parseList`;
    - um campo de `BOOL_FIELDS` vira `boolean`;
    - o resto vira `String(v ?? "")`;
    - com `row === null` (item novo), devolve `{ id: "", visible: true }` mais os campos vazios do kind.
  - `draftToFormData(draft: Draft, files: Record<string, File | null>, removed: string[]): FormData`:
    - `string[]` vira `join("\n")`;
    - `true` vira `"on"`, e `false` fica ausente;
    - cada `File` não nulo é enviado na sua chave;
    - cada nome em `removed` vira `remove_<nome>=on`.
  - `profilePreview(d: Draft, locale: Locale, photoUrl?: string | null): Profile`
  - `itemPreview(kind: Kind, d: Draft, locale: Locale, imageUrl?: string | null): Project | Experience | Skill | Education`
  - Nas duas, o id da prévia é `Number(d.id) || -1`, e um `photoUrl`/`imageUrl` dado substitui o `*Path`.

- [ ] **Step 1: Escrever os testes que falham** em `tests/adminDraft.test.ts`:
  - `rowToDraft` de um projeto com `stack: '["PHP","MySQL"]'`, `stackEn: null` e `url: null` resulta em `stack` igual a `["PHP","MySQL"]`, `stackEn` igual a `[]` e `url` igual a `""`.
  - `rowToDraft(null, "project").visible === true` e `id === ""`.
  - `draftToFormData({ id: "", stack: ["A","B"], visible: true, current: false }, {}, ["image"])`:
    - `get("stack")` é `"A\nB"`;
    - `get("visible")` é `"on"`;
    - `has("current")` é `false`;
    - `get("remove_image")` é `"on"`.
  - `itemPreview("project", { title: "Pedidos", titleEn: "", stack: ["PHP"], stackEn: [], ... }, "en")` tem `title === "Pedidos"` e `stack` igual a `["PHP"]` (fallback).
  - Com `titleEn: "Requests"` e `"en"`, `title === "Requests"`.
  - `itemPreview("skill", { level: "" , ...}, "pt").level === null`.
  - `profilePreview(d, "pt", "blob:x").photoPath === "blob:x"`.
- [ ] **Step 2:** Rodar `npx vitest run tests/adminDraft.test.ts`. Esperado: FAIL, módulo inexistente.
- [ ] **Step 3:** Criar `localize.ts` com as funções movidas e `adminDraft.ts` com as assinaturas acima.
- [ ] **Step 4:** Rodar `npx vitest run`. Esperado: todos PASS, inclusive `tests/portfolio.test.ts`, sem mudança.
- [ ] **Step 5:** Commit: `feat(admin): conversões do rascunho do editor`.

### Task 2: Campos do editor (controlados, etiquetas, upload com miniatura)

**Files:**
- Modify: `src/components/admin/fields.tsx`
  - `Field`, `Select` e `Check` passam a ser controlados.
  - `Pair` é removido, porque a chave PT/EN da Task 5 escolhe qual nome mostrar.
  - `FileField` é substituído por `Dropzone`.
  - `ActionError` fica como está.
- Create: `src/components/admin/TagInput.tsx`, `src/components/admin/Dropzone.tsx`
- Test: `tests/admin/fields.test.tsx`

**Interfaces:**
- Produces:
  - `Field({ label, name, value, onChange(v: string), error?, multiline?, hint?, placeholder? })`
  - `Select({ label, name, value, onChange, options, error? })`
  - `Check({ label, name, checked, onChange(b: boolean) })`
  - `TagInput({ label, value: string[], onChange(v: string[]), placeholder?, hint?, error?, long?: boolean })`
    - Enter adiciona o texto aparado se não estiver vazio nem repetido.
    - × remove.
    - Backspace com o input vazio remove a última etiqueta.
    - `long` mostra cada item como linha editável, para as realizações.
  - `Dropzone({ label, name, accept, currentUrl: string | null, kind: UploadKind, onFile(f: File | null), onRemove(removed: boolean), error?, hint? })`
    - Aceita arrastar ou clicar.
    - Valida o tamanho com `checkFileSize` antes de chamar `onFile`. Se passar do limite, mostra `SIZE_ERROR` e não chama `onFile`.
    - Mostra uma miniatura via `URL.createObjectURL` para imagem, ou o nome do arquivo para PDF.
    - Revoga a URL ao trocar o arquivo ou desmontar.

- [ ] **Step 1: Escrever os testes que falham**:
  - TagInput: digitar "PHP" e Enter chama `onChange(["PHP"])`.
  - Enter com o input vazio, ou com "PHP" quando já existe "PHP", não chama `onChange`.
  - Clicar em "Remover PHP" (o `aria-label` do ×) chama `onChange([])`.
  - Dropzone: um arquivo de 4 MB com `kind="image"` mostra "Arquivo maior que o limite" e não chama `onFile`.
  - Um arquivo de 10 KB chama `onFile(file)` e mostra um `<img>` com `src` vindo do `URL.createObjectURL`, mockado em `vi.fn(() => "blob:t")`.
  - `Field` com `placeholder="Texto PT"` e `value=""` exibe o placeholder.
- [ ] **Step 2:** Rodar `npx vitest run tests/admin/fields.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Estilo dos inputs:
  - `rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2`;
  - foco em `outline-[var(--accent)]`;
  - etiqueta no estilo `chip` com o botão × de `aria-label="Remover <texto>"`.
- [ ] **Step 4:** Rodar `npx vitest run tests/admin/fields.test.tsx`. Esperado: PASS. O `tsc` vai acusar os usos antigos em `ItemForm` e `ProfileForm`; eles são reescritos na Task 5. Até lá, o build não precisa passar entre as tasks 2 e 5, mas os testes sim.
- [ ] **Step 5:** Commit: `feat(admin): campos controlados, etiquetas e upload com miniatura`.

### Task 3: Estrutura do painel (topo, lateral, status e login)

**Files:**
- Create:
  - `src/components/admin/AdminStatus.tsx` (contexto);
  - `src/components/admin/AdminHeader.tsx`;
  - `src/components/admin/Sidebar.tsx`;
  - `src/components/admin/GuardedLink.tsx`;
  - `src/components/admin/Toast.tsx`.
- Modify:
  - `src/app/(admin)/admin/layout.tsx`, que carrega as contagens e o perfil (nome e `photoPath`) e monta a grade lateral + topo + conteúdo;
  - `src/app/(admin)/admin/login/page.tsx`, com o novo visual: `> admin` em mono, cartão centrado, grade de fundo e a mesma `login` action.
- Test: `tests/admin/shell.test.tsx`

**Interfaces:**
- Produces:
  - `AdminStatusProvider({ children })`
  - `useAdminStatus(): { dirty: boolean; setDirty(b: boolean): void; crumb: string | null; setCrumb(s: string | null): void; notify(msg: string): void }`
  - `GuardedLink(props: LinkProps & { className?, children })`: se `dirty`, pede `confirm("Há alterações não salvas. Sair mesmo assim?")` e cancela a navegação se a resposta for não.
  - `Sidebar({ counts: Record<"projetos"|"experiencias"|"competencias"|"formacao", number> })`:
    - o item ativo recebe `aria-current="page"` pelo `usePathname()`;
    - no celular, abre por um botão ☰ (`aria-label="Abrir menu"`).
  - `AdminHeader({ name: string, photoPath: string | null })`:
    - mostra `> admin`, a seção atual pelo pathname e o `crumb`;
    - mostra "● salvo" ou "● alterações não salvas";
    - tem "Ver site ↗" (`href="/"`, `target="_blank"`);
    - o avatar (foto, ou iniciais do nome) abre um menu com "Sair", que é o form com a action `logout`.
  - O `Toast` lê o `notify` do contexto e some depois de cerca de 2,5 s.

- [ ] **Step 1: Escrever os testes que falham** (mock de `next/navigation` com `usePathname` → `"/admin/projetos"`):
  - Sidebar com `counts.projetos = 4` mostra "4" no link Projetos, e esse link tem `aria-current="page"`.
  - AdminHeader sem foto mostra "EE" para "Eduardo Erig".
  - Clicar no avatar revela o botão "Sair".
  - Com `setDirty(true)`, o topo mostra "alterações não salvas".
  - GuardedLink com `dirty` e `confirm` mockado devolvendo `false`: o clique tem `defaultPrevented === true`.
  - `notify("Salvo ✓")` mostra o texto com `role="status"`.
- [ ] **Step 2:** Rodar `npx vitest run tests/admin/shell.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. O layout continua devolvendo só `children` quando não há sessão, como hoje.
- [ ] **Step 4:** Rodar `npx vitest run`. Esperado: PASS.
- [ ] **Step 5:** Commit: `feat(admin): topo, menu lateral e tela de login novos`.

### Task 4: Prévia ao vivo

**Files:**
- Create: `src/components/admin/Preview.tsx`
- Test: `tests/admin/preview.test.tsx`

**Interfaces:**
- Consumes: `profilePreview`, `itemPreview` (Task 1); `getDictionary` (`src/i18n/dictionary.ts`, só dados).
- Produces: `Preview({ kind: EditorKind, draft: Draft, locale: Locale, fileUrl?: string | null, siblings?: Skill[] })`. Renderiza:
  - **profile:** `Hero` + `Contact`, com rolagem interna;
  - **project:** `ProjectCard` com `dict.projects`;
  - **experience:** `ExperienceSection` com só esse item;
  - **skill:** `Skills` com os `siblings` (todas as competências visíveis, já localizadas). O item editado substitui o de mesmo id ou entra no fim, se for novo;
  - **education:** `EducationSection` com só esse item.
  - Moldura: `// prévia` em mono, um selo do idioma e o `ThemeToggle` existente.
  - A coluna é `sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto` no desktop.

- [ ] **Step 1: Escrever os testes que falham**:
  - Prévia de projeto com `title: "Pedidos"`, `titleEn: ""` e `locale="en"` mostra "Pedidos".
  - Com `titleEn: "Requests"`, mostra "Requests".
  - Prévia de skill com `siblings`, sendo `[{id:1,name:"PHP",group:"Back-end",level:null},{id:2,name:"Node.js",group:"Back-end",level:"intermediate"}]`, e um draft com `id:"2"` e `name:"Node"`: mostra "PHP" e "Node", e não mostra "Node.js".
  - Prévia do perfil mostra o nome do draft e o e-mail do contato.
- [ ] **Step 2:** Rodar `npx vitest run tests/admin/preview.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Rodar `npx vitest run tests/admin/preview.test.tsx`. Esperado: PASS.
- [ ] **Step 5:** Commit: `feat(admin): prévia ao vivo com os componentes do site`.

### Task 5: Editores (perfil e itens) com a prévia, PT/EN, Ctrl+S e aviso de saída

**Files:**
- Create:
  - `src/components/admin/useEditor.ts`;
  - `src/components/admin/ProfileEditor.tsx`, que substitui `ProfileForm.tsx` (apagar);
  - `src/components/admin/ItemEditor.tsx`, que substitui `ItemForm.tsx` (apagar).
- Modify:
  - `src/app/(admin)/admin/page.tsx`, que passa a linha crua para `ProfileEditor`;
  - `src/app/(admin)/admin/[section]/page.tsx`, que renderiza `ItemEditor` e, para `skill`, passa `siblings` com as competências visíveis localizadas pelas funções de `localize.ts`.
- Test: `tests/admin/editor.test.tsx`

**Interfaces:**
- Consumes: Tasks 1–4 e `saveItem`/`updateProfile` (mockados nos testes).
- Produces: `useEditor({ kind, row, save: (fd: FormData) => Promise<FormState>, onSaved: () => void })`, que devolve `{ draft, set(name, value), locale, setLocale, files, setFile, removed, setRemoved, errors, failed, pending, submit }`. Ele:
  - marca `dirty` no `AdminStatus` assim que algo muda e o limpa ao salvar com sucesso;
  - registra `beforeunload` enquanto há alterações;
  - liga Ctrl+S/Cmd+S a `submit`;
  - ignora o `submit` enquanto `pending`;
  - em caso de exceção, define `failed` e mantém draft, arquivos e etiquetas.

  Sobre os editores:
  - **Cabeçalho do editor:**
    - à esquerda, o título ("Novo item", ou o título/nome/cargo do item);
    - à direita, a chave PT/EN (`role="radiogroup"`, `aria-label="Idioma"`);
    - a opção EN mostra um ponto quando algum campo `*En` traduzível está vazio.
  - **Campos traduzíveis:** mostram `name` em PT e `${name}En` em EN. No modo EN, o placeholder é o valor PT. Os campos não traduzíveis (empresa, instituição, URL, e-mail, arquivos, checkboxes) aparecem nos dois modos.
  - **Depois de salvar:**
    - item novo: `router.push(base)` e `notify("Salvo ✓")`;
    - item existente e perfil: ficam abertos, chamam `router.refresh()` e `notify("Salvo ✓")`.
  - `setCrumb` recebe o título do item ou "novo".
  - **Grade:** `lg:grid-cols-2`, com o formulário à esquerda e a `Preview` à direita. Abaixo de `lg`, a prévia fica embaixo do formulário.

- [ ] **Step 1: Escrever os testes que falham** (mock de `next/navigation` com `useRouter` e `usePathname`, e as actions como `vi.fn`):
  - ProfileEditor: digitar no campo Nome atualiza a prévia na hora; o texto aparece no `Hero` sem chamar `updateProfile`.
  - Ctrl+S chama `updateProfile` uma vez, com `FormData` em que `get("name")` é o valor digitado.
  - Com `updateProfile` rejeitando, aparece o `ActionError` (`role="alert"`) e o campo Nome mantém o valor digitado.
  - Trocar a chave para EN: o campo Cargo mostra o `roleEn` e tem como placeholder o `role` PT.
  - ItemEditor de projeto novo, com `saveItem` resolvendo `{ok:true}`: chama `router.push("/admin/projetos")`.
  - ItemEditor existente (`row.id = 3`): não chama `push` e chama `refresh`.
  - Dois cliques rápidos em "Salvar", com `saveItem` pendente: `saveItem` é chamado uma vez só.
  - Projeto com stack `["PHP"]` e mais "MySQL" adicionado: o `FormData` tem `stack === "PHP\nMySQL"`.
  - `saveItem` devolvendo `{ errors: { title: "Título: campo obrigatório" } }` mostra a mensagem junto ao campo Título.
- [ ] **Step 2:** Rodar `npx vitest run tests/admin/editor.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar e apagar `ItemForm.tsx` e `ProfileForm.tsx`.
- [ ] **Step 4:** Rodar `npx vitest run`, `npx tsc --noEmit` e `npm run lint`. Esperado: tudo limpo.
- [ ] **Step 5:** Commit: `feat(admin): editores com prévia ao vivo, PT/EN e Ctrl+S`.

### Task 6: Lista de cada seção (mini-cartões e ações em ícones)

**Files:**
- Modify:
  - `src/app/(admin)/admin/[section]/page.tsx`:
    - cabeçalho da seção com o título e o botão "+ novo" (`btn btn-primary`);
    - quando o editor está aberto (`?novo` ou `?editar`), a lista fica escondida e aparece um link "← voltar para a lista" (`GuardedLink`).
  - `src/components/admin/RowActions.tsx`: as ações viram ícones (↑, ↓, olho/olho riscado, lápis, lixeira), com `aria-label` e `title` iguais ("Subir", "Descer", "Ocultar"/"Mostrar", "Editar", "Excluir"). A confirmação de excluir continua.
- Create: `src/components/admin/ItemCard.tsx`:
  - é um mini-cartão por kind: imagem pequena + título + etiquetas para projeto, cargo · empresa + período para experiência, chip com ícone e nível para skill, curso · instituição para formação;
  - o cartão inteiro é um `GuardedLink` para `?editar=<id>`;
  - item oculto tem `opacity-50` e o `chip` "oculto".
- Test: `tests/admin/list.test.tsx`

**Interfaces:**
- Consumes: `GuardedLink` (Task 3), `SkillIcon`.
- Produces: `ItemCard({ kind: Kind, row: Row, href: string })`.

- [ ] **Step 1: Escrever os testes que falham**:
  - O `ItemCard` de um projeto oculto mostra "oculto" e é um link para `href`.
  - `RowActions` tem botões com `aria-label` "Subir", "Descer", "Ocultar", "Editar" e "Excluir".
  - Com `confirm` → `false`, "Excluir" não chama `deleteItem`.
- [ ] **Step 2:** Rodar `npx vitest run tests/admin/list.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Rodar `npx vitest run`, `npx tsc --noEmit` e `npm run lint`. Esperado: tudo limpo.
- [ ] **Step 5:** Fazer o build numa cópia descartável, porque o `npm run dev` do Eduardo pode estar na :3000. Copiar o repositório sem `node_modules/.next` para uma pasta temporária, rodar `npm ci` e `npx next build`. Esperado: o build passa.
- [ ] **Step 6:** Commit: `feat(admin): lista em mini-cartões com ações em ícones`.
