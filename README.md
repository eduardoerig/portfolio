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
| Conteúdo (textos, ordem, visibilidade) | banco SQLite, `prisma/dev.db` (`DATABASE_URL`) |
| Uploads (foto, imagens, CV) | `storage/uploads` |
| Segredos | `.env` |

Ficam **fora do git**: `*.db`, `storage/` e `.env`. Faça backup do banco e de `storage/` por conta própria.

Bancos antigos (criados antes do campo de nível das habilidades): rode `npm run backfill:skill-level` **uma vez**, depois do `db push`. Banco novo não precisa.

## Publicando depois

O site grava em disco (SQLite e uploads), então precisa de um servidor com **disco persistente** (VPS ou Docker com volume). Hospedagem serverless não serve.

- `npm run build` e depois `npm start`, com `.env`, banco e `storage/` no volume.
- Proxy reverso (nginx etc.): libere corpo de requisição de **pelo menos 9 MB**, senão os uploads falham.
- Defina `metadataBase` com o domínio real, para os links `hreflang` (PT/EN) saírem certos.
- Use um `SESSION_SECRET` próprio de produção e HTTPS.
