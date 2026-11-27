import type { EditorKind } from "@/lib/adminDraft";

// Modelo único dos formulários do admin: a tela (FormFields), a validação (formSchema, no servidor e no
// navegador) e o rascunho (adminDraft) saem daqui. Campo novo = uma linha aqui (e a coluna no banco).

export type FieldType = "text" | "textarea" | "url" | "email" | "tags" | "lines" | "select" | "switch" | "image";
export type Option = readonly [value: string, text: string];

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  /** Tem o par `${name}En`: PT e EN lado a lado; o inglês vazio cai no português. */
  i18n?: boolean;
  required?: boolean;
  /** Limite duro (servidor e navegador). */
  max?: number;
  /** A partir daqui o contador fica em destaque. */
  recommended?: number;
  placeholder?: string;
  hint?: string;
  options?: readonly Option[];
  /** select: vazio vira null (sem rótulo). */
  nullable?: boolean;
  /** select numérico (ex.: barra 1 a 5). */
  numeric?: { min: number; max: number; message: string };
  /** Mensagem quando o valor do select não está na lista. */
  invalid?: string;
  /** Vai para o cabeçalho do formulário (ex.: "Visível no site"), não para as seções. */
  header?: boolean;
};

export type Section = { title: string; description?: string; fields: FieldDef[] };

const visible = (label = "Visível no site"): FieldDef => ({ name: "visible", label, type: "switch", header: true });
const period: FieldDef = { name: "period", label: "Período", type: "text", i18n: true, required: true, max: 60, recommended: 30, placeholder: "2023 – atual" };

const SKILL_LEVELS: Option[] = [["", "—"], ["intermediate", "Intermediário"], ["learning", "Aprendendo"]];
const PROFICIENCY: Option[] = [["1", "1 · básico"], ["2", "2"], ["3", "3 · intermediário"], ["4", "4"], ["5", "5 · fluente/nativo"]];

export const FORMS: Record<EditorKind, Section[]> = {
  profile: [
    {
      title: "Identidade",
      description: "O que aparece no topo do site.",
      fields: [
        { name: "name", label: "Nome", type: "text", required: true, max: 80, recommended: 40, placeholder: "Eduardo Erig" },
        { name: "role", label: "Cargo", type: "text", i18n: true, required: true, max: 120, recommended: 60, placeholder: "Desenvolvedor Full Stack" },
        { name: "summary", label: "Resumo", type: "textarea", i18n: true, required: true, max: 1200, recommended: 500, hint: "Duas ou três frases sobre o que você faz e o que procura." },
        { name: "openToWork", label: "Aberto a oportunidades", type: "switch" },
      ],
    },
    {
      title: "Contato",
      fields: [
        { name: "email", label: "E-mail", type: "email", required: true, max: 120, placeholder: "voce@exemplo.com" },
        { name: "githubUrl", label: "Link do GitHub", type: "url", required: true, max: 300, placeholder: "https://github.com/usuario" },
        { name: "linkedinUrl", label: "Link do LinkedIn", type: "url", required: true, max: 300, placeholder: "https://www.linkedin.com/in/usuario" },
      ],
    },
    { title: "Foto", fields: [{ name: "photo", label: "Foto", type: "image", hint: "JPG, PNG ou WebP. Fotos grandes são reduzidas automaticamente." }] },
    {
      title: "Currículo",
      description: "Só aparece no PDF gerado a partir deste painel.",
      fields: [
        { name: "fullName", label: "Nome completo", type: "text", max: 120, recommended: 60, placeholder: "Nome e sobrenomes" },
        { name: "location", label: "Cidade", type: "text", i18n: true, max: 80, recommended: 40, placeholder: "Cidade, UF" },
        { name: "phone", label: "Telefone", type: "text", max: 40, placeholder: "+55 45 90000-0000", hint: "Só no PDF, nunca no site." },
        { name: "cvClosing", label: "Frase final", type: "textarea", i18n: true, max: 300, recommended: 160, hint: "Vai no fim do resumo. Use **texto** para deixar em negrito." },
      ],
    },
  ],
  project: [
    {
      title: "Sobre o projeto",
      fields: [
        visible(),
        { name: "title", label: "Título", type: "text", i18n: true, required: true, max: 120, recommended: 50, placeholder: "Sistema de pedidos" },
        { name: "description", label: "Descrição", type: "textarea", i18n: true, required: true, max: 600, recommended: 220, hint: "O problema, o que você fez e o resultado, em uma ou duas frases." },
      ],
    },
    {
      title: "Detalhes",
      fields: [
        { name: "stack", label: "Tecnologias", type: "tags", i18n: true, hint: "Pressione Enter para adicionar." },
        { name: "url", label: "Link", type: "url", max: 300, placeholder: "https://github.com/usuario/projeto" },
        { name: "metric", label: "Métrica", type: "text", i18n: true, max: 120, recommended: 70, placeholder: "−40% no tempo de atendimento", hint: "Um número que mostra o resultado." },
      ],
    },
    { title: "Imagem", fields: [{ name: "image", label: "Imagem", type: "image", hint: "JPG, PNG ou WebP. Fotos grandes são reduzidas automaticamente." }] },
  ],
  experience: [
    {
      title: "Cargo",
      fields: [
        visible(),
        { name: "role", label: "Cargo", type: "text", i18n: true, required: true, max: 120, recommended: 50, placeholder: "Desenvolvedor Full Stack" },
        { name: "company", label: "Empresa", type: "text", required: true, max: 120, recommended: 50 },
        { name: "location", label: "Local", type: "text", i18n: true, required: true, max: 80, recommended: 40, placeholder: "Cidade, UF · remoto" },
        period,
        { name: "current", label: "Emprego atual", type: "switch" },
      ],
    },
    {
      title: "Realizações",
      description: "Uma por linha, começando por um verbo.",
      fields: [{ name: "bullets", label: "Realizações", type: "lines", i18n: true }],
    },
  ],
  skill: [
    {
      title: "Competência",
      fields: [
        visible(),
        { name: "name", label: "Nome", type: "text", i18n: true, required: true, max: 60, recommended: 30, placeholder: "TypeScript" },
        { name: "group", label: "Grupo", type: "text", i18n: true, required: true, max: 60, recommended: 30, placeholder: "Front-end", hint: "Competências com o mesmo grupo ficam juntas no site." },
        { name: "level", label: "Nível", type: "select", options: SKILL_LEVELS, nullable: true, invalid: "Nível inválido", hint: "Deixe em branco para não mostrar rótulo." },
      ],
    },
  ],
  education: [
    {
      title: "Formação",
      fields: [
        visible(),
        { name: "course", label: "Curso", type: "text", i18n: true, required: true, max: 120, recommended: 50 },
        { name: "school", label: "Instituição", type: "text", required: true, max: 120, recommended: 50 },
        period,
        { name: "note", label: "Observação", type: "text", i18n: true, max: 200, recommended: 80, placeholder: "Trancado · conclusão prevista em 2027" },
      ],
    },
  ],
  language: [
    {
      title: "Idioma",
      description: "Idiomas aparecem só no currículo em PDF.",
      fields: [
        visible("Visível no currículo"),
        { name: "name", label: "Idioma", type: "text", i18n: true, required: true, max: 40, recommended: 20, placeholder: "Inglês" },
        { name: "level", label: "Nível", type: "text", i18n: true, required: true, max: 120, recommended: 60, placeholder: "Intermediário: leitura técnica", hint: "No currículo, aparece só o texto antes dos dois-pontos." },
        { name: "proficiency", label: "Barra no currículo", type: "select", options: PROFICIENCY, numeric: { min: 1, max: 5, message: "Nível de 1 a 5" } },
      ],
    },
  ],
};

export const allFields = (kind: EditorKind): FieldDef[] => FORMS[kind].flatMap((s) => s.fields);

// Nomes que o formulário envia (o par En dos traduzíveis; imagem vai pela chave, fora daqui).
export function fieldNames(kind: EditorKind): string[] {
  return allFields(kind).flatMap((f) => (f.type === "image" ? [] : f.i18n ? [f.name, `${f.name}En`] : [f.name]));
}
