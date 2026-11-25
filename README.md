# Portfólio

Site pessoal bilíngue (português em `/`, inglês em `/en`) com um painel em `/admin` para editar tudo sem mexer no código.

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind 4, Prisma 6 + SQLite, zod, jose (sessão), bcryptjs (senha), simple-icons e Vitest.

## Rodando localmente

```bash
npm i
cp .env.example .env            # no Windows: copy .env.example .env
npm run hash-password -- minha-senha
npx prisma db push
npx prisma db seed
npm run dev
```

1. `hash-password` imprime uma linha `ADMIN_PASSWORD_HASH=...` já pronta: cole no `.env`. Todo `$` do hash precisa virar `\$` (o Next trata `$` como variável) e sem aspas. O comando já faz isso.
2. Preencha também `SESSION_SECRET` (o comando para gerar está no `.env.example`).
3. O seed só preenche um banco **vazio**. Ele nunca sobrescreve o que você editou.
4. Abra http://localhost:3000 (PT), http://localhost:3000/en (EN) e http://localhost:3000/admin.

Outros comandos: `npm test`, `npm run lint`, `npm run build`, `npm start`.

## Painel `/admin`

- Entre com a senha cujo hash está no `.env`. Hash vazio = ninguém entra.
- Edite cada seção em **PT e EN** (perfil, projetos, experiência, habilidades, formação).
- Controle a **ordem** e a **visibilidade** de cada item (escondido some do site público).
- Habilidades têm nível: *aprendendo* ou *intermediário*.
- Envie a **foto**, as **imagens dos projetos** e o **currículo (CV)**. Os arquivos são servidos em `/files/...`.

## Onde ficam os dados

| O quê | Onde |
| --- | --- |
| Conteúdo (textos, ordem, visibilidade) | banco libSQL/SQLite: local em `prisma/dev.db`, em produção num banco libSQL remoto (`DATABASE_URL`) |
| Uploads (foto, imagens, CV) | bucket compatível com S3 (Cloudflare R2). O banco guarda só a chave; a URL vem de `NEXT_PUBLIC_FILES_URL` |
| Segredos | `.env` (local) e variáveis de ambiente da hospedagem |

Ficam **fora do git**: `*.db` e `.env`. Faça backup do banco por conta própria.

Os arquivos vão do navegador **direto para o bucket**, por uma URL pré-assinada que o servidor só gera depois de conferir o login, o tipo e o tamanho. Por isso o bucket precisa de CORS liberando `PUT` vindo do site (e de `http://localhost:3000` em desenvolvimento).

Bancos antigos (criados antes do campo de nível das habilidades): rode `npm run backfill:skill-level` **uma vez**, depois do `db push`. Banco novo não precisa.

## Publicar

O site roda em qualquer hospedagem Node que aceite Next.js, sem disco persistente: banco e arquivos ficam em serviços externos.

1. **Banco:** crie um banco libSQL (Turso) e um token. Ponha no `.env` local `REMOTE_DATABASE_URL` e `REMOTE_DATABASE_AUTH_TOKEN` e rode, uma vez:
   - `npm run db:remote:init`, que cria as tabelas;
   - `npm run db:copy`, que copia o conteúdo do `dev.db`. Ele se recusa a rodar se o destino já tiver dados, e caminhos de arquivo antigos viram vazio.
2. **Arquivos:** crie um bucket R2 com acesso público de leitura, um token de API com leitura e escrita só nesse bucket e o CORS do item anterior.
3. **Variáveis de ambiente** na hospedagem (só no ambiente de produção): veja o `.env.example`. `DATABASE_URL` e `DATABASE_AUTH_TOKEN` são as do banco remoto, e `SITE_URL` é o endereço final do site.
4. Depois de publicar, entre no painel e envie de novo a foto, as imagens e o PDF.

O login bloqueia por alguns minutos depois de 5 senhas erradas seguidas do mesmo IP. Use um `SESSION_SECRET` próprio de produção.
