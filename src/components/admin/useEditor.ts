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
  autosave: boolean; // item existente e perfil gravam sozinhos; item novo espera o "Criar"
};
export type SaveStatus = "idle" | "waiting" | "saving" | "saved" | "invalid" | "error";

const DELAY = 800; // pausa na digitação antes de gravar
const pathOf = (d: Draft, name: string) => String(d[`${name}Path`] ?? "");

// Estado do editor: rascunho, imagens, idioma, gravação (sozinha ou no "Criar") e avisos de saída.
export function useEditor({ kind, row, save, onSaved, autosave }: Options) {
  const { setDirty } = useAdminStatus();
  const [draft, setDraftState] = useState<Draft>(() => rowToDraft(row, kind));
  const [locale, setLocale] = useState<Locale>("pt");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [dirty, setLocalDirty] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({}); // prévia do arquivo escolhido
  const [undoSnap, setUndoSnap] = useState<Draft | null>(null);

  // A gravação é assíncrona e pode rodar depois de desmontar: lê sempre os refs, não o render.
  const draftRef = useRef(draft);
  const files = useRef<Record<string, File>>({}); // escolhidos e ainda não gravados
  const removed = useRef<string[]>([]);
  const restore = useRef<Record<string, string>>({}); // chave antiga reanexada pelo desfazer
  const lastSaved = useRef(draft); // o que está no banco: vira o desfazer do próximo salvamento
  const uploaded = useRef(new WeakMap<File, string>()); // enviado antes de outro arquivo falhar: não sobe de novo
  const inflight = useRef<Promise<boolean> | null>(null); // um salvamento por vez
  const again = useRef(false); // pediram outro salvamento durante o atual
  const locked = useRef(false); // item novo criado: trava até a tela trocar, senão um segundo envio criaria outro item
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const setDraft = (fn: (d: Draft) => Draft) => {
    draftRef.current = fn(draftRef.current);
    setDraftState(draftRef.current);
  };

  const edits = useRef(0); // conta alterações: o envio só limpa o "não salvo" se nada mudou durante ele
  const savedAt = useRef(0); // valor de edits no último salvamento ok
  const touch = useCallback(() => {
    edits.current++;
    setLocalDirty(true);
    setDirty(true);
  }, [setDirty]);

  // Um envio: arquivos ao armazenamento, depois o formulário só com as chaves. true = gravou.
  async function saveOnce(): Promise<boolean> {
    const at = edits.current;
    const sent = draftRef.current;
    const sentFiles = { ...files.current };
    const sentRemoved = [...removed.current];
    const sentRestore = { ...restore.current };
    setStatus("saving");
    setPending(true);
    try {
      // 1) Arquivos novos vão direto ao armazenamento; se algum falhar, nada é salvo e nada se perde.
      const keys: Record<string, string> = { ...sentRestore };
      const uploadErrors: Record<string, string> = {};
      const list = Object.entries(sentFiles);
      if (list.length) setUploading(true);
      for (const [name, file] of list) {
        const known = uploaded.current.get(file);
        if (known) {
          keys[name] = known;
          continue;
        }
        const up = await uploadFile(file, "image");
        if (up.ok) {
          uploaded.current.set(file, up.key);
          keys[name] = up.key;
        } else uploadErrors[name] = up.error;
      }
      setUploading(false);
      if (Object.keys(uploadErrors).length) {
        setErrors(uploadErrors);
        setFailed(false);
        setStatus("invalid");
        return false;
      }
      // 2) O formulário leva só as chaves.
      const result = await save(draftToFormData(sent, keys, sentRemoved));
      // Salvar falhou: o servidor pode ter apagado um arquivo recusado, então o próximo envio manda de novo.
      if (!result.ok) uploaded.current = new WeakMap();
      const errs = result.errors ?? {};
      setErrors(errs);
      // erro só no outro idioma: vai para ele, senão o campo com a mensagem fica escondido
      const langs = Object.keys(errs).map((k): Locale => (k.endsWith("En") ? "en" : "pt"));
      if (langs.length && !langs.includes(localeRef.current)) setLocale(langs[0]);
      setFailed(false);
      if (!result.ok) {
        setStatus("invalid");
        return false;
      }
      // O caminho no rascunho passa a ser o gravado: a prévia e o desfazer partem dele.
      const paths: Draft = {};
      for (const [name, key] of Object.entries(keys)) paths[`${name}Path`] = key;
      for (const name of sentRemoved) if (!(name in keys)) paths[`${name}Path`] = "";
      setDraft((d) => ({ ...d, ...paths }));
      setUndoSnap(lastSaved.current);
      lastSaved.current = { ...sent, ...paths };
      // só tira o que foi enviado: arquivos e remoções feitos durante o envio ficam
      for (const [name, f] of Object.entries(sentFiles)) if (files.current[name] === f) delete files.current[name];
      removed.current = removed.current.filter((n) => !sentRemoved.includes(n));
      for (const name of Object.keys(sentRestore)) delete restore.current[name];
      savedAt.current = at;
      if (edits.current === at) {
        setLocalDirty(false);
        setDirty(false);
      }
      setStatus(timer.current || again.current ? "waiting" : "saved");
      if (row === null) locked.current = true;
      onSaved();
      return true;
    } catch {
      uploaded.current = new WeakMap(); // não dá para saber se o servidor apagou o arquivo: envia de novo
      setUploading(false);
      setFailed(true); // rascunho, arquivos e etiquetas ficam como estão
      setStatus("error");
      return false;
    } finally {
      if (!locked.current) setPending(false);
    }
  }

  // Grava já. Com um envio no ar, o autosave enfileira mais um; o "Criar" só espera o atual.
  // true = tudo gravado (o Voltar só sai nesse caso).
  function run(): Promise<boolean> {
    if (locked.current) return Promise.resolve(true);
    if (inflight.current) {
      if (autosave) again.current = true;
      return inflight.current;
    }
    const p = (async () => {
      let ok = true;
      do {
        again.current = false;
        ok = await saveOnce();
      } while (ok && again.current && !locked.current);
      return ok;
    })().finally(() => (inflight.current = null));
    inflight.current = p;
    return p;
  }
  const cancelTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const submit = () => {
    cancelTimer();
    return run();
  };
  // Grava o que estiver pendente (Voltar, Ctrl+S); sem nada pendente, só espera o envio em curso.
  const flush = () => {
    cancelTimer();
    const pendingWork = edits.current !== savedAt.current || Object.keys(files.current).length || removed.current.length;
    if (!pendingWork) return inflight.current ?? Promise.resolve(status !== "invalid" && status !== "error");
    return run();
  };
  const later = () => {
    if (!autosave) return;
    cancelTimer();
    setStatus("waiting");
    timer.current = setTimeout(() => {
      timer.current = null;
      void run();
    }, DELAY);
  };
  const now = () => {
    if (autosave) void submit();
  };

  const set = (name: string, value: string | boolean | string[]) => {
    setDraft((d) => ({ ...d, [name]: value }));
    touch();
    later();
  };

  const setPreview = (name: string, f: File | null) => {
    const url = f && URL.createObjectURL(f); // fora do updater: no StrictMode ele roda duas vezes
    setUrls((p) => {
      if (p[name]) URL.revokeObjectURL(p[name]);
      const next = { ...p };
      if (url) next[name] = url;
      else delete next[name];
      return next;
    });
  };
  const pickImage = (name: string, f: File) => {
    files.current[name] = f;
    removed.current = removed.current.filter((n) => n !== name);
    delete restore.current[name];
    setPreview(name, f);
    touch();
    now();
  };
  const removeImage = (name: string) => {
    delete files.current[name];
    delete restore.current[name];
    // item novo sem imagem salva: só descarta o escolhido
    if (pathOf(draftRef.current, name) && !removed.current.includes(name)) removed.current.push(name);
    setDraft((d) => ({ ...d, [`${name}Path`]: "" })); // a prévia some na hora
    setPreview(name, null);
    touch();
    now();
  };

  // Volta ao rascunho de antes do último salvamento e grava. Depois dele, o desfazer vira o refazer.
  const undo = undoSnap
    ? () => {
        const snap = undoSnap;
        for (const key of Object.keys(snap)) {
          if (!key.endsWith("Path")) continue;
          const name = key.slice(0, -4);
          const old = pathOf(snap, name);
          if (old === pathOf(lastSaved.current, name)) continue;
          delete files.current[name];
          setPreview(name, null);
          if (old) restore.current[name] = old; // o servidor aceita reanexar a chave antiga
          else if (!removed.current.includes(name)) removed.current.push(name);
        }
        setDraft(() => snap);
        touch();
        void submit();
      }
    : null;

  const imageUrl = (name: string) => urls[name] ?? fileUrl(pathOf(draft, name));

  // Ctrl+S / Cmd+S e a saída usam sempre as funções mais recentes.
  const latest = useRef({ flush, timerOn: () => timer.current !== null });
  latest.current = { flush, timerOn: () => timer.current !== null };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); // sem o "salvar página" do navegador
        // com foco num campo: tira o foco (texto pendente de etiqueta entra no rascunho) e grava no próximo ciclo
        const el = document.activeElement;
        if (el instanceof HTMLInputElement) {
          el.blur();
          setTimeout(() => void latest.current.flush(), 0);
        } else void latest.current.flush();
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
  // Saiu com digitação esperando o debounce: grava mesmo assim.
  useEffect(() => () => void (latest.current.timerOn() && latest.current.flush()), []);
  const urlsRef = useRef(urls);
  urlsRef.current = urls;
  useEffect(() => () => Object.values(urlsRef.current).forEach((u) => URL.revokeObjectURL(u)), []);

  return { draft, set, touch, locale, setLocale, errors, failed, pending, uploading, submit, status, flush, undo, imageUrl, pickImage, removeImage };
}

export type Editor = ReturnType<typeof useEditor>;
