"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/(admin)/admin/actions";
import type { Locale } from "@/i18n/locales";
import { type Draft, type EditorKind, draftToFormData, rowToDraft } from "@/lib/adminDraft";
import { fileUrl } from "@/lib/fileUrl";
import { uploadFile } from "@/lib/uploadClient";
import { useAdminStatus } from "./AdminStatus";

type Options = {
  kind: EditorKind;
  row: Record<string, unknown> | null;
  save: (fd: FormData) => Promise<FormState>;
  onSaved: () => void;
};

// Estado do editor: rascunho, arquivos, idioma, envio e avisos de saída.
export function useEditor({ kind, row, save, onSaved }: Options) {
  const { setDirty } = useAdminStatus();
  const [draft, setDraft] = useState<Draft>(() => rowToDraft(row, kind));
  const [locale, setLocale] = useState<Locale>("pt");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [removed, setRemovedList] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<Record<string, File>>({}); // enviados e salvos: a prévia não volta à imagem antiga
  const [dirty, setLocalDirty] = useState(false);
  const busy = useRef(false); // o estado só muda no próximo render: o ref barra o segundo clique
  const uploaded = useRef(new WeakMap<File, string>()); // arquivo já enviado não sobe de novo num novo Salvar
  const [uploading, setUploading] = useState(false);

  const edits = useRef(0); // conta alterações: o envio só limpa o "não salvo" se nada mudou durante ele
  const touch = useCallback(() => {
    edits.current++;
    setLocalDirty(true);
    setDirty(true);
  }, [setDirty]);

  const set = (name: string, value: string | boolean | string[]) => {
    setDraft((d) => ({ ...d, [name]: value }));
    touch();
  };
  const setFile = (name: string, f: File | null) => {
    setFiles((p) => ({ ...p, [name]: f }));
    touch();
  };
  const setRemoved = (name: string, on: boolean) => {
    // marcar "remover" esvazia o caminho no rascunho: a prévia some com a imagem na hora
    setDraft((d) => ({ ...d, [`${name}Path`]: on ? "" : String(row?.[`${name}Path`] ?? "") }));
    setRemovedList((p) => (on ? [...p.filter((n) => n !== name), name] : p.filter((n) => n !== name)));
    touch();
  };

  async function submit() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const at = edits.current;
    let leaving = false;
    try {
      // 1) Arquivos novos vão direto ao armazenamento; se algum falhar, nada é salvo e nada se perde.
      const keys: Record<string, string> = {};
      const uploadErrors: Record<string, string> = {};
      const pendingFiles = Object.entries(files).filter((e): e is [string, File] => e[1] instanceof File);
      if (pendingFiles.length) setUploading(true);
      for (const [name, file] of pendingFiles) {
        const known = uploaded.current.get(file);
        if (known) {
          keys[name] = known;
          continue;
        }
        const up = await uploadFile(file, name === "cv" ? "pdf" : "image");
        if (up.ok) {
          uploaded.current.set(file, up.key);
          keys[name] = up.key;
        } else uploadErrors[name] = up.error;
      }
      setUploading(false);
      if (Object.keys(uploadErrors).length) {
        setErrors(uploadErrors);
        setFailed(false);
        return;
      }
      // 2) O formulário leva só as chaves.
      const result = await save(draftToFormData(draft, keys, removed));
      const errs = result.errors ?? {};
      setErrors(errs);
      // erro só no outro idioma: vai para ele, senão o campo com a mensagem fica escondido
      const langs = Object.keys(errs).map((k): Locale => (k.endsWith("En") ? "en" : "pt"));
      if (langs.length && !langs.includes(locale)) setLocale(langs[0]);
      setFailed(false);
      if (result.ok) {
        setSaved((prev) => {
          const next = { ...prev };
          for (const [k, f] of Object.entries(files)) if (f) next[k] = f;
          for (const k of removed) delete next[k];
          return next;
        });
        // só tira o que foi enviado: arquivos e remoções novos feitos durante o envio ficam
        setFiles((p) => Object.fromEntries(Object.entries(p).filter(([k, f]) => f !== files[k])));
        setRemovedList((p) => p.filter((n) => !removed.includes(n)));
        if (edits.current === at) {
          setLocalDirty(false);
          setDirty(false);
        }
        // item novo: trava até a tela trocar, senão um segundo envio criaria outro item
        leaving = row === null;
        onSaved();
      }
    } catch {
      setUploading(false);
      setFailed(true); // rascunho, arquivos e etiquetas ficam como estão
    } finally {
      if (!leaving) {
        busy.current = false;
        setPending(false);
      }
    }
  }

  // Ctrl+S / Cmd+S e o aviso do navegador usam sempre o submit mais recente.
  const latest = useRef(submit);
  latest.current = submit;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); // sem o "salvar página" do navegador
        // com foco num campo: tira o foco (texto pendente de etiqueta entra no rascunho) e envia no próximo ciclo
        const el = document.activeElement;
        if (el instanceof HTMLInputElement) {
          el.blur();
          setTimeout(() => void latest.current(), 0);
        } else void latest.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => () => setDirty(false), [setDirty]);

  // Arquivo a mostrar na prévia (o escolhido agora ou o já salvo) e o link do arquivo atual.
  const shown = { ...saved, ...files };
  const currentUrl = (name: string) => {
    const path = String(draft[`${name}Path`] ?? "") || (removed.includes(name) ? String(row?.[`${name}Path`] ?? "") : "");
    return fileUrl(path);
  };

  return { draft, set, touch, locale, setLocale, files, shown, currentUrl, setFile, removed, setRemoved, errors, failed, pending, uploading, submit };
}

export type Editor = ReturnType<typeof useEditor>;
