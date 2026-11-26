# Gerador de currículo — design

## Por quê
Hoje o currículo é um PDF feito à mão e enviado pelo admin. Toda mudança (projeto novo, experiência, competência) precisa ser feita duas vezes e o PDF fica desatualizado. O objetivo é que o currículo **saia do mesmo banco do portfólio**: atualizou no admin, o PDF baixado já vem novo.

## Objetivos
- Gerar o PDF na hora do download, a partir do banco, com o mesmo conteúdo visível do site.
- Dois modelos, reproduzindo os PDFs atuais (`Desktop\curriculos`):
  - **Visual**: barra lateral preta (monograma, contato com ícones, competências em chips com tracejado = em aprendizado, formação, idiomas com barra de nível) e coluna principal (nome em duas linhas pesada/leve, cargo em maiúsculas, resumo, experiência em linha do tempo, projetos em grade 2×N).
  - **Simples (ATS)**: uma coluna, fonte padrão, seções Resumo, Experiência, Projetos, Competências, Formação, Idiomas.
- PT e EN. Campos EN vazios caem no PT, igual ao site.
- Não ocupar espaço de armazenamento: nada é salvo, o PDF é montado a cada pedido.
- Limpeza de arquivos soltos no armazenamento (pedido do usuário), para não chegar ao teto do plano grátis.

## Não-objetivos
- Editor de layout ou escolha de cores/temas.
- Mais de dois modelos.
- Guardar versões antigas do currículo.

## Anti-objetivos
- Texto em imagem (o ATS precisa ler o PDF; todo texto é selecionável).
- Download lento a ponto de parecer quebrado (alvo: < 3 s mesmo no primeiro acesso).

## Abordagens
1. **Biblioteca de PDF em JavaScript no servidor (`@react-pdf/renderer`)** — escolhida. Leve, roda na hospedagem grátis, texto selecionável. Custo: os layouts são redesenhados nela; fica muito próximo do atual, não idêntico pixel a pixel.
2. Navegador invisível imprimindo HTML — idêntico ao HTML, mas ~60 MB, perto do limite da hospedagem e 3–8 s por download frio.
3. Página para imprimir com Ctrl+P — não entrega arquivo; descartada.

## Endereços
| Endereço | Conteúdo |
|---|---|
| `/curriculo.pdf` | Visual, PT |
| `/curriculo.pdf?modelo=simples` | Simples, PT |
| `/en/resume.pdf` | Visual, EN |
| `/en/resume.pdf?modelo=simples` | Simples, EN |

- Route handlers em `src/app/(pt)/curriculo.pdf/route.ts` e `src/app/(en)/en/resume.pdf/route.ts`, ambos chamando uma função comum.
- Dados via `getPortfolio(locale)` (já aplica o fallback EN→PT e filtra `visible`), mais os campos novos abaixo.
- `Content-Type: application/pdf`, `Content-Disposition: inline; filename="CV_<Nome>_<PT|EN>[_simples].pdf"`, `Cache-Control: no-store` (mudou no admin, muda no PDF na hora).
- **Site**: o botão "Baixar currículo" do Hero passa a apontar para o modelo visual do idioma da página e aparece sempre (não depende mais de upload).
- **Admin**: na tela de Perfil, quatro links "Ver PDF" (PT/EN × visual/simples). O modelo simples fica só no admin — é para o usuário enviar em portais de vaga.

## Dados novos (admin → Perfil)
| Campo | Uso | EN? |
|---|---|---|
| `fullName` | nome no currículo ("Eduardo Felipe Storck Erig"); vazio → `name` | não |
| `location` | "Marechal Cândido Rondon, PR" | `locationEn` |
| `phone` | só no PDF, nunca no site | não |
| `cvClosing` | frase final do resumo ("Aberto a vagas remotas de…"); trecho entre `**` sai em negrito | `cvClosingEn` |

> [!warning] O telefone fica público para quem baixar o PDF (igual ao PDF de hoje). Só não aparece na página.

**Idiomas** viram um item novo do admin, no mesmo padrão de Formação/Competências: modelo `Language` com `name`/`nameEn`, `level`/`levelEn` (texto: "Nativo", "Intermediário: leitura técnica e documentação"), `proficiency` (1–5, para a barra), `order`, `visible`. Não aparece no site.

**Sai**: o upload de PDF do currículo (`cvPath`) — campo do formulário e usos (`Hero`, `portfolio.ts`, `adminDraft.ts`, `types.ts`, fixtures, `actions.ts`). A coluna fica no schema marcada como obsoleta (mesmo padrão de `Skill.learning`), para o `db push` não apagar dados e o site no ar não quebrar entre rodar o script e publicar. O arquivo já enviado deixa de contar como "em uso" e é apagado pela limpeza abaixo.

**Banco remoto**: o projeto não usa migrations (`db push` local; `scripts/db-remote-init.ts` cria do zero). Precisa de um script que só **acrescenta** no banco de produção (`ALTER TABLE … ADD COLUMN` para os campos novos, `CREATE TABLE Language`, e Português/Inglês como idiomas iniciais se a tabela estiver vazia), podendo rodar mais de uma vez. Rodado pelo usuário com o `.env` dele, **antes** de publicar o código novo. O `prisma/dev.db` local recebe as mesmas mudanças por `db push` (sem reset).

## Regras de conteúdo (iguais aos PDFs atuais)
- Monograma: iniciais do primeiro e do último nome de `fullName` ("EE").
- Nome em duas linhas: primeira metade das palavras (arredondada para cima) em fonte pesada, o resto em leve.
- Cargo (`role`) em maiúsculas.
- Experiência: ponto preenchido quando `current`; período em pílula preta; bullets com "▸".
- Projetos: todos os visíveis, grade de 2 colunas; link sem `https://`.
- Competências: agrupadas por `group`; `level = learning` → chip tracejado; a legenda "Contorno tracejado = em aprendizado" só aparece se houver algum. No simples: "Grupo: itens. Em aprendizado: …".
- Textos fixos de seção (CONTATO, EXPERIÊNCIA…) em PT e EN no dicionário existente.
- Se passar de uma página, quebra para a segunda com a barra lateral repetida; o alvo é caber em uma.

## Fontes
- Visual: o PDF atual usa Segoe UI (Light, Regular, Semibold, Bold, Black), que não pode ser distribuída. Usa **Inter** (OFL), parecida e com os mesmos pesos (300/400/600/700/900). Arquivos de fonte dentro do repositório (sem buscar na internet em tempo de execução).
- Simples: Helvetica embutida no gerador (padrão ATS, zero arquivo).

## Limpeza do armazenamento
Hoje, trocar ou apagar uma foto/imagem já remove o arquivo antigo. O que sobra são envios abandonados (escolheu a imagem e não salvou) e, depois desta mudança, o PDF antigo do currículo.

- Botão no admin **"Limpar arquivos soltos"**: lista o armazenamento, apaga o que não é referenciado por nenhum registro e tem mais de 24 h (para não apagar um envio em andamento), e mostra "N arquivos removidos · X MB liberados · total usado Y MB".
- Novo `listObjects()` em `src/lib/storage.ts`, ao lado de `deleteObject`; reaproveita `isReferenced` de `actions.ts`.
- Sem rotina automática: o plano grátis tem 10 GB e o portfólio usa poucos MB; um botão basta. `shortcut:` se um dia passar de 1000 arquivos, paginar a listagem.

## Testes
- Função de montagem dos dados do currículo (nome dividido, monograma, fallback EN, agrupamento de competências, legenda condicional) com testes unitários.
- Route handler: responde `application/pdf`, PDF começa com `%PDF`, e o texto extraído contém nome, uma experiência e um projeto do fixture (PT e EN, visual e simples).
- Limpeza: com armazenamento simulado, apaga só o não referenciado e com mais de 24 h.
- Hero: botão aponta para `/curriculo.pdf` e `/en/resume.pdf`.

## Fica para quem constrói
- Medidas exatas, tamanhos de fonte e espaçamentos (comparando lado a lado com o PDF atual).
- Desenho dos ícones de contato (SVG simples).
- Ordem dos campos novos no formulário de Perfil.
