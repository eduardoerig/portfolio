"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveItem, type FormState } from "@/app/(admin)/admin/actions";
import { parseList } from "@/lib/lists";
import type { Kind } from "@/lib/tables";
import { fileErrors } from "@/lib/uploadLimits";
import { ActionError, Check, Field, FileField, Pair, Select } from "./fields";

const SKILL_LEVELS = [["", "—"], ["intermediate", "Intermediário"], ["learning", "Aprendendo"]] as const;

type Props = { kind: Kind; row: Record<string, unknown> | null; backHref: string };

export default function ItemForm({ kind, row, backHref }: Props) {
  const [state, setState] = useState<FormState>({});
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const errors = state.errors;

  // Valores iniciais como texto; listas (JSON) viram uma linha por item.
  const v: Record<string, string> = {};
  for (const [k, val] of Object.entries(row ?? {})) {
    v[k] = ["stack", "stackEn", "bullets", "bulletsEn"].includes(k) ? parseList(val as string | null).join("\n") : String(val ?? "");
  }
  const isNew = row === null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const tooBig = fileErrors(data, { image: "image" });
    if (Object.keys(tooBig).length) return setState({ errors: tooBig }); // nem envia: o limite do servidor é o mesmo
    start(async () => {
      try {
        const result = await saveItem(kind, data);
        setState(result);
        setFailed(false);
        if (result.ok) {
          form.querySelectorAll<HTMLInputElement>("input[type=file]").forEach((i) => (i.value = ""));
          router.push(backHref); // volta à lista (e evita salvar duas vezes um item novo)
        }
      } catch {
        setFailed(true); // o formulário não é tocado: o que foi digitado continua lá
      }
    });
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{isNew ? "Novo item" : "Editar item"}</h2>
      <input type="hidden" name="id" value={v.id ?? ""} />

      {kind === "project" && (
        <>
          <Pair label="Título" name="title" row={v} errors={errors} />
          <Pair label="Descrição" name="description" row={v} errors={errors} multiline />
          <Pair label="Tecnologias" name="stack" row={v} errors={errors} multiline hint="Uma por linha. Em inglês vazio, usa o português." />
          <Field label="Link (opcional)" name="url" defaultValue={v.url} error={errors?.url} />
          <Pair label="Métrica (opcional)" name="metric" row={v} errors={errors} />
          <FileField label="Imagem (opcional)" name="image" accept="image/jpeg,image/png,image/webp" current={v.imagePath} error={errors?.image} hint="JPG, PNG ou WebP, até 3 MB." />
        </>
      )}
      {kind === "experience" && (
        <>
          <Pair label="Cargo" name="role" row={v} errors={errors} />
          <Field label="Empresa" name="company" defaultValue={v.company} error={errors?.company} />
          <Pair label="Local" name="location" row={v} errors={errors} />
          <Pair label="Período" name="period" row={v} errors={errors} />
          <Pair label="Realizações" name="bullets" row={v} errors={errors} multiline hint="Uma por linha. Em inglês vazio, usa o português." />
          <Check label="Emprego atual" name="current" defaultChecked={v.current === "true"} />
        </>
      )}
      {kind === "skill" && (
        <>
          <Pair label="Nome" name="name" row={v} errors={errors} />
          <Pair label="Grupo" name="group" row={v} errors={errors} />
          <Select label="Nível" name="level" defaultValue={v.level} error={errors?.level} options={SKILL_LEVELS} />
        </>
      )}
      {kind === "education" && (
        <>
          <Pair label="Curso" name="course" row={v} errors={errors} />
          <Field label="Instituição" name="school" defaultValue={v.school} error={errors?.school} />
          <Pair label="Período" name="period" row={v} errors={errors} />
          <Pair label="Observação (opcional)" name="note" row={v} errors={errors} />
        </>
      )}

      <Check label="Visível no site" name="visible" defaultChecked={isNew || v.visible === "true"} />

      {failed && <ActionError />}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Salvando..." : "Salvar"}</button>
        <Link href={backHref} className="btn">Cancelar</Link>
      </div>
    </form>
  );
}
