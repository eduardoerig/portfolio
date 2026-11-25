# Painel /admin: redesign — design

Data: 2026-11-25 · Pasta: `C:\Users\eduardo\Desktop\portfolio` · Base: `docs/superpowers/specs/2026-11-24-portfolio-design.md`

## Intenção

O Eduardo mantém o portfólio sozinho pelo painel `/admin`. O painel atual funciona, mas é cru:
- menu de botões iguais;
- formulários em uma coluna, com PT e EN lado a lado;
- listas de texto com cinco botões iguais;
- nenhuma prévia: para ver o resultado, é preciso salvar e abrir o site.

Ele pediu um painel **intuitivo e bonito**, com o **topo do painel personalizado**, **preenchimento dinâmico** e **prévia em cada seção**. Sucesso é editar uma seção vendo, enquanto digita, exatamente como ela vai ficar no site, sem precisar abrir o site.

## Objetivos

- Layout A (escolhido no navegador): menu lateral, topo com status e editor com o formulário à esquerda e a prévia ao vivo à direita.
- A prévia usa **os mesmos componentes do site público** e atualiza a cada tecla, sem salvar.
- Mesmo visual do site: paleta marinho/azul, fontes Geist/Unbounded, tema claro e escuro.

## Fora do escopo

- Mudanças no banco, no schema ou nas regras de segurança. As server actions (`saveItem`, `updateProfile`, `move`, `toggleVisible`, `deleteItem`) continuam com a mesma assinatura e as mesmas validações.
- Rascunhos, histórico de versões e vários usuários.
- Reordenar arrastando (as setas ↑ ↓ continuam).
- Mudanças no site público.

## O que seria um fracasso

- Uma prévia diferente do site, por ser uma imitação em vez dos componentes reais.
- Perder o que foi digitado quando o salvamento falha ou a sessão expira. Hoje o formulário não é limpo nesses casos, e isso tem que continuar valendo.
- Afrouxar a segurança. Por exemplo: mostrar o painel sem sessão, aceitar URL `javascript:` ou servir arquivos sem a checagem atual.
- Um código difícil demais para o Eduardo ler e manter, com muitas bibliotecas novas ou abstração demais.

## Abordagens consideradas

| Caminho | Ganho | Custo | Escolhido |
|---|---|---|---|
| A. Prévia ao vivo no cliente com os componentes do site | Instantânea, idêntica ao site e funciona em item novo | Os formulários passam a ter estado controlado, então `ItemForm` e `ProfileForm` são reescritos | **Sim** (Eduardo) |
| B. Site real num iframe com rascunho salvo a cada tecla | Página inteira, com animações reais | Tabela ou cookie de rascunho, lógica de publicar e recarga lenta; muito código | Não |
| C. Prévia só depois de salvar | Quase nenhum código | Não é dinâmico | Não |

Layout: entre **A** (lateral com topo de status), B (abas no topo) e C (topo imitando terminal), o Eduardo escolheu **A**.

## Decidido com o Eduardo

### Topo do painel
- À esquerda: `> admin` em mono, em azul, e o caminho atual (`/ projetos / Requests`).
- À direita:
  - o status de salvamento, "● salvo" em verde ou "● alterações não salvas";
  - o botão "Ver site ↗", que abre `/` em nova aba;
  - o avatar com a foto do perfil, ou as iniciais se não houver foto, que abre um menu com "Sair".

### Menu lateral
- Itens: Perfil, Projetos, Experiências, Competências e Formação, com a quantidade de itens ao lado de cada seção de lista.
- O item ativo fica destacado em azul.
- No celular, a lateral vira um menu ☰.

### Lista de cada seção
- Cada item é um mini-cartão parecido com o do site.
- Os itens ocultos ficam apagados, com a etiqueta "oculto".
- Ações em ícones (↑, ↓, olho, editar, lixeira), com `aria-label` e `title`.
- Clicar no cartão abre o editor.
- O botão "+ novo" fica no cabeçalho da seção.
- A exclusão continua pedindo confirmação.

### Editor (Perfil e itens)
- Formulário à esquerda e prévia à direita, `sticky`.
- No celular, a prévia vai para baixo do formulário ou fica numa aba "Prévia".
- **Uma chave PT/EN no topo do editor** troca todos os campos traduzíveis e a prévia juntos.
  - Os campos EN vazios mostram o texto PT como placeholder apagado, o que indica que o site vai usar o português ali.
  - A chave EN mostra um sinal quando algum campo EN está vazio.
- A prévia tem a chave de tema claro/escuro, e a de idioma segue a do editor.
- As listas viram etiquetas: tecnologias (`stack`/`stackEn`) e realizações (`bullets`/`bulletsEn`). Enter adiciona e × remove. As realizações podem ser frases longas, então a etiqueta aceita texto longo ou vira uma linha editável.
- Uploads de foto, imagem de projeto e PDF:
  - dá para arrastar ou clicar;
  - a miniatura aparece na hora, com `URL.createObjectURL`, e também na prévia;
  - "remover" continua existindo.
- Ctrl+S salva.
- Sair com alterações não salvas pede confirmação, tanto em `beforeunload` quanto ao clicar nos links do painel.
- Ao salvar, aparece um aviso rápido "Salvo ✓" no canto, e o status do topo é atualizado.

### Login
A tela de login ganha o mesmo visual: um cartão centrado, `> admin`, a grade de fundo e a mesma ação `login`.

## Restrições e fatos do código atual

- Next 15 App Router, React 19, Tailwind v4 e as classes globais `card`, `btn`, `btn-primary`, `pill` e `chip` em `globals.css`. Os tokens são `--bg`, `--surface`, `--border`, `--fg`, `--muted`, `--accent`, `--accent-deep` e `--danger`.
- O admin é um layout raiz próprio, `src/app/(admin)/layout.tsx`, montado pelo `RootShell`.
  - `src/app/(admin)/admin/layout.tsx` esconde o menu quando não há sessão, porque o login também mora em `/admin`.
  - O `middleware.ts` protege `/admin`.
- As seções públicas (`src/components/sections/*`, `ProjectCard`) são componentes sem estado que recebem `{dados, dict}`. Podem ser renderizadas num client component.
  - `TiltCard` já é client.
  - As entradas `.reveal` e `.reveal-group` só ficam visíveis quando o `RevealOnScroll` (IntersectionObserver) as marca. Na prévia, elas precisam aparecer sem esperar a rolagem.
- `getDictionary(locale)` fornece os textos fixos. Os tipos de `src/lib/types.ts` são o formato que as seções esperam. A prévia converte o estado do formulário para esses tipos, aplicando o mesmo fallback EN→PT de `getPortfolio`.
- `parseList` (`src/lib/lists.ts`) lê as listas em JSON.
- Os limites de upload estão em `src/lib/uploadLimits.ts` (`fileErrors`).
- O `ActionError` explica a falha quando a action lança uma exceção.
- O `prisma/dev.db` tem dados reais: nada de seed, reset ou recriação.
- 97 testes Vitest com jsdom e Testing Library. Os testes atuais do admin devem continuar passando ou ser atualizados para a nova interface, sem perder cobertura.

## Decisões do Claude (o Eduardo pode corrigir)

- Sem bibliotecas novas de UI: componentes à mão com Tailwind. Ícones em SVG inline, no mesmo padrão de `src/components/icons`.
- Estado do formulário com `useState` simples, um objeto por formulário. Nada de biblioteca de formulários.
- Envio ainda via `FormData` para as mesmas server actions, montado a partir do estado. Os arquivos vêm dos inputs `file`.
- A contagem por seção e o avatar vêm do servidor, no layout do admin.
- O trabalho é feito na branch `feat/admin-redesign`.

### Fluxo e prévia (respostas à revisão do design)

- **Depois de salvar**
  - Item novo: volta para a lista e mostra o aviso "Salvo ✓". Esse é o comportamento de hoje, e ele evita criar um duplicado, porque `saveItem` não devolve o id.
  - Item existente e Perfil: o editor continua aberto e o status volta a "● salvo".
  - Nos dois casos, `router.refresh()` atualiza as contagens e o avatar do layout.
- **URLs:** continua a página `[section]` com `?novo=1` e `?editar=<id>`. A lista e o editor ficam na mesma rota, e o aviso de alterações não salvas cobre os links do painel e o `beforeunload`.
- **Prévia de competência:** a página carrega todas as competências. A prévia mostra o grupo inteiro do item, com o item na posição real e o texto que está sendo digitado. A cor do grupo segue a posição real do grupo no site.
- **Prévia do perfil:** mostra `Hero` e `Contact` empilhados, com rolagem interna na coluna `sticky`.
- **Remover arquivo:** o formulário continua enviando `remove_<campo>=on`, que é o que `actions.ts` espera.
- **Dicionário:** `src/i18n/dictionary.ts` é só dados, então pode ser importado no cliente.

## Fica a cargo de quem construir

- Estrutura exata dos componentes novos (`AdminHeader`, `Sidebar`, `Editor`, `Preview`, `TagInput`, `Dropzone`, `Toast` ou outra divisão).
- Como a prévia mostra cada seção:
  - Perfil → `Hero` e `Contact`;
  - projeto → `ProjectCard`;
  - experiência → um item da timeline;
  - competência → o grupo dela em `Skills`;
  - formação → o cartão.
- Animações do painel: leves e respeitando `prefers-reduced-motion`.
