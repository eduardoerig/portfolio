# Portfólio do Eduardo Erig: design

Data: 2026-11-24 · Pasta do projeto: `C:\Users\eduardo\Desktop\portfolio`

## Intenção

Um site de portfólio pessoal para **recrutadores de vagas remotas** (Desenvolvedor Full Stack, Web ou Back-end). Em poucos segundos, o recrutador precisa ver quem é o Eduardo, que está aberto a vagas, baixar o currículo e chegar aos projetos.

Ele também é um exercício: o Eduardo quer praticar React, Next.js e TypeScript (no currículo aparecem como "em aprendizado"), e o próprio portfólio vira um projeto para mostrar.

Ele também quer um painel para alterar o conteúdo sozinho e manter o site sem mexer no código.

## Objetivos

- Página pública bonita e "tecnológica", com tema claro e escuro e azul escuro como cor principal.
- Topo com a foto, nome, cargo, selo "aberto a oportunidades" e botões Baixar currículo, GitHub e LinkedIn.
- Painel `/admin` com login, onde o Eduardo edita todo o conteúdo da página pública.
- Rodar **só no PC local** por enquanto, mas sem nada que impeça publicar depois.

## Fora do escopo

- Página própria para cada projeto (o usuário quis **só o cartão**).
- Formulário de contato e envio de e-mail (contato só por links).
- Blog, estatísticas de visita, vários usuários no painel. (Idiomas PT/EN foram adicionados depois; veja a seção "Idiomas".)
- Publicação (deploy) e domínio: ficam para depois.

## O que seria um fracasso

- Citar ou depender das duas plataformas hospedadas que o Eduardo vetou (BaaS e hospedagem serverless de terceiros): ele acha que não passa credibilidade.
- Afirmar tecnologias que ele não domina: React, Next.js e TypeScript aparecem como "aprendendo", igual ao currículo.
- Visual de terminal tão carregado que fica clichê ou difícil de ler.
- Painel que só o Claude consegue manter: o código tem que ser simples o bastante para o Eduardo entender.

## Restrições

- Windows, rodando com `npm run dev` local.
- Dados num arquivo SQLite dentro do projeto; foto, imagens dos projetos e PDF do currículo numa pasta local de uploads.
- O plugin ECC (affaan-m/ECC) será instalado **só nesse projeto** (`--scope local`), clonado do GitHub em `C:\Users\eduardo\Desktop\ECC`.
- Textos em português.

## Caminhos considerados

| Caminho | Ganho | Custo | Escolhido |
|---|---|---|---|
| 1. Next.js + painel próprio (Prisma + SQLite) | Treina React/Next de verdade; todo o código é dele e vira projeto de portfólio | Mais trabalho: login, upload e reordenação feitos à mão | **Sim**, escolhido pelo usuário |
| 2. Next.js + Payload CMS | Painel pronto com pouco código | Aprende a ferramenta, não a construir | Não |
| 3. Next.js + Sanity | Já usado no Dolce Delícias | Dados na nuvem, contra "rodar local"; depende de serviço externo | Não |

Antes disso, a stack também foi escolhida entre PHP + MySQL no WAMP, Node/Express + SQLite e Next.js. O usuário escolheu **Next.js**, porque o ECC é voltado a React e ele quer praticar.

## Decidido com o usuário

- **Estilo visual "Terminal"**:
  - fundo com grade fina e detalhes em fonte monoespaçada, como o `> whoami` acima do nome;
  - brilho azul em volta da foto redonda.
- **Duas versões do mesmo estilo:**
  - paleta azul-marinho escolhida pelo Eduardo em 2026-11-24, com base nas referências Pantone 534 C, 3597 C, 4135 C, Cool Gray 7 C e 538 C;
  - escura: fundo `#060b16`, texto `#e6ebf3`, destaque `#3d7bfd`, botão `#2f6bf0`, bordas `#18243a`;
  - clara: fundo `#f3f5f9`, texto `#0d1726`, destaque e botão `#1f4fd1`, bordas `#dfe5ee`.
- **Tema:** segue o do sistema na primeira visita, tem um botão ☾/☀ para trocar e guarda a escolha.
- **Ordem das seções:** topo → projetos → experiência → competências → formação → contato.
- **Projetos:** só cartões, cada um com imagem, descrição curta, etiquetas de stack e link.
- **Contato:** só links (e-mail, LinkedIn, GitHub).

Referência: `.superpowers/brainstorm/.../content/estilo-hero-v2.html`, opção A.

## Conteúdo inicial

Vem do currículo novo (`Desktop\curriculos\CV_Eduardo_Erig_PT.pdf`).

- **Topo**
  - Eduardo Erig.
  - Cargo: "Auxiliar de TI · Desenvolvedor Full Stack".
  - Selo: "aberto a oportunidades".
  - Resumo igual ao do currículo.
- **Projetos**
  - Requests: PHP, JavaScript, MySQL, com link `github.com/eduardoerig/requests-institutional-management`.
  - Dolce Delícias: HTML, CSS, JavaScript, Sanity, com link `github.com/eduardoerig/Dolce-Delicias`.
  - Automação do Instagram: n8n, agentes de IA, Cloudflare Workers. Sem link. Métrica: 1.777 views contra uma mediana de 37.
  - Gestão de Serviços de Topografia: PHP, MySQL. Sem link.
- **Experiência**
  - Auxiliar de TI no Colégio Evangélico Martin Luther, de 2025 até hoje.
  - Cofundador e Desenvolvedor Full Stack na PrimoDev, de fev. 2026 até hoje.
  - Assistente administrativo de TI, de 2024 a 2025.
- **Competências**, com os mesmos grupos do currículo:
  - React, Next.js e TypeScript marcados como "aprendendo";
  - o grupo de suporte traz help desk, manutenção de hardware, formatação e instalação, cabeamento e Wi-Fi, impressoras e periféricos.
- **Formação:** Engenharia de Software na Faculdade Donaduzzi (fev. 2026 a dez. 2029) e o Técnico em Desenvolvimento de Sistemas no Colégio Estadual Eron Domingues (2023 a 2025).
- **Contato:** eduardoferig@gmail.com, linkedin.com/in/eduardoerig, github.com/eduardoerig.

## Painel `/admin`

- **Login:** um único usuário, o Eduardo, com senha guardada em hash. As rotas e as ações de escrita só funcionam com sessão válida.
- **O que dá para editar**
  - Perfil: nome, cargo, resumo, selo de vagas, links, foto e PDF do currículo.
  - Projetos, experiências, competências (com grupo e marca de "aprendendo") e formação.
- **Em cada lista:** criar, editar, excluir, mudar a ordem e esconder sem apagar.
- **Atualização:** o site público mostra a mudança assim que ela é salva.

## Idiomas (pedido do Eduardo em 2026-11-24)

- O site fica em **português (padrão)** e **inglês**.
  - Português fica em `/`, inglês em `/en`, e cada versão tem o seu `<html lang>`.
  - As duas versões se apontam com `hreflang`.
- **Seletor de idioma no topo:** duas bandeiras, Brasil e EUA, em SVG, porque o Windows não mostra emojis de bandeira. Ao escolher a outra, aparece um loading rápido e a página troca de idioma.
- **Textos fixos da interface** (títulos, botões, rótulos) ficam num dicionário no código.
- **Textos do conteúdo** (cargo, resumo, projetos, experiências, competências, formação) têm **duas versões, PT e EN, no banco e no painel**.
  - O seed já traz a tradução inicial em inglês, feita pelo Claude, para o Eduardo revisar.
  - Se o campo em inglês estiver vazio, o site mostra o português.
- **Sem tradução automática** e sem serviço externo.
- Isso substitui o item "várias línguas" de "Fora do escopo".

## Quem escreve

O **Claude escreve todo o código**, e o Eduardo revisa. Por isso, as tarefas podem ser maiores. O código precisa ser fácil de ler, com nomes claros e poucas bibliotecas, porque o Eduardo vai aprender lendo e tem que conseguir manter sozinho. Cada parte entregue vem com uma explicação curta do que foi feito e por quê.

## Decisões do Claude (o usuário pode corrigir)

- **Publicação futura:** quando publicar, o alvo é um servidor com disco persistente, seja VPS ou Docker. Hospedagem serverless não serve. Até lá, nada de interface de armazenamento: os arquivos vão direto para o disco e o banco é SQLite via Prisma. Se um dia precisar trocar de banco, o Prisma faz isso mudando o provider.
- **Papel do ECC:**
  - O plugin é instalado com `--scope local` como primeiro passo do plano.
  - As skills e os agentes de React, Next.js e TypeScript dele são usados na implementação e na revisão.
  - O que for Laravel, Postgres ou de outros stacks é ignorado.
- **Visual das outras seções:**
  - A referência é `.superpowers/brainstorm/451-1795542599/content/estilo-hero-v2.html`, opção A, e cobre só o topo da página.
  - As outras seções seguem o mesmo estilo: títulos `// projetos`, grade fina e azul nos detalhes.
  - O primeiro entregável visual é a página pública inteira com conteúdo fixo, para o usuário aprovar antes de ligar o banco.
- **Repositório público no GitHub:**
  - O `.gitignore` deixa fora o banco (`*.db`), a pasta de uploads e o `.env`, que guarda o segredo da sessão e o hash da senha.
  - O seed com o conteúdo inicial vai para o repositório, porque é o mesmo conteúdo do site público. O telefone não entra no seed.
  - O projeto tem um README que explica como rodar o site.

## Fica a cargo de quem construir

- Versão do Next.js (App Router), estilização (Tailwind ou CSS Modules), biblioteca de sessão e de hash.
- Animações: devem ser leves e respeitar `prefers-reduced-motion`.
- Como reordenar: arrastar ou setas.
- Estrutura de pastas e esquema exato do banco.
- Script de seed com o conteúdo inicial.
- Validação de upload: tipo e tamanho.
