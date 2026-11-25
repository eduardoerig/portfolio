"use client";

import { useState, useTransition } from "react";
import { updateProfile, type FormState } from "@/app/(admin)/admin/actions";
import { fileErrors } from "@/lib/uploadLimits";
import { ActionError, Check, Field, FileField, Pair } from "./fields";

export default function ProfileForm({ row }: { row: Record<string, string> & { openToWork: boolean } }) {
  const [state, setState] = useState<FormState>({});
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const errors = state.errors;

  // onSubmit em vez de action={...}: o React 19 limparia os campos quando o envio falha.
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const tooBig = fileErrors(data, { photo: "image", cv: "pdf" });
    if (Object.keys(tooBig).length) return setState({ errors: tooBig }); // nem envia: o limite do servidor é o mesmo
    start(async () => {
      try {
        const result = await updateProfile(data);
        setState(result);
        setFailed(false);
        // Limpa os arquivos escolhidos: um segundo salvar não reenvia o mesmo arquivo.
        if (result.ok) form.querySelectorAll<HTMLInputElement>("input[type=file]").forEach((i) => (i.value = ""));
      } catch {
        setFailed(true); // o formulário não é tocado: o que foi digitado continua lá
      }
    });
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <Field label="Nome" name="name" defaultValue={row.name} error={errors?.name} />
      <Pair label="Cargo" name="role" row={row} errors={errors} />
      <Pair label="Resumo" name="summary" row={row} errors={errors} multiline />
      <Field label="E-mail" name="email" defaultValue={row.email} error={errors?.email} />
      <Field label="GitHub (URL)" name="githubUrl" defaultValue={row.githubUrl} error={errors?.githubUrl} />
      <Field label="LinkedIn (URL)" name="linkedinUrl" defaultValue={row.linkedinUrl} error={errors?.linkedinUrl} />
      <Check label="Aberto a oportunidades" name="openToWork" defaultChecked={row.openToWork} />
      <FileField label="Foto" name="photo" accept="image/jpeg,image/png,image/webp" current={row.photoPath} error={errors?.photo} hint="JPG, PNG ou WebP, até 3 MB." />
      <FileField label="Currículo (PDF)" name="cv" accept="application/pdf" current={row.cvPath} error={errors?.cv} hint="PDF, até 5 MB." />
      {failed && <ActionError />}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Salvando..." : "Salvar"}</button>
        {state.ok && <span role="status" className="text-sm text-[var(--muted)]">Salvo.</span>}
      </div>
    </form>
  );
}
