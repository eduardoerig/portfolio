"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastAction = { label: string; run(): void };

type Status = {
  dirty: boolean;
  setDirty(b: boolean): void;
  crumb: string | null;
  setCrumb(s: string | null): void;
  notify(msg: string, action?: ToastAction): void;
  /** Aviso atual do Toast (null quando não há). */
  message: string | null;
  /** Botão do aviso atual (ex.: Desfazer). */
  toastAction: ToastAction | null;
  /** Gaveta do menu lateral no celular. */
  menuOpen: boolean;
  setMenuOpen(b: boolean): void;
  /** Editor com salvar sozinho aberto: grava o pendente antes de sair; true = tudo gravado. */
  leave: (() => Promise<boolean>) | null;
  setLeave(fn: (() => Promise<boolean>) | null): void;
  /** Linhas da lista escondidas enquanto a exclusão espera o Desfazer. */
  hidden: ReadonlySet<string>;
  /** Esconde a linha na hora e só apaga depois do aviso com Desfazer. */
  scheduleDelete(key: string, commit: () => Promise<void>): void;
};

const Ctx = createContext<Status | null>(null);
const DELETE_DELAY = 8000;

// Estado compartilhado do painel: edições pendentes, migalha, avisos rápidos e exclusões com Desfazer.
export function AdminStatusProvider({ children }: { children: React.ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [crumb, setCrumb] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<ToastAction | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leave, setLeaveState] = useState<(() => Promise<boolean>) | null>(null);
  const setLeave = useCallback((fn: (() => Promise<boolean>) | null) => setLeaveState(() => fn), []);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const deletes = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const notify = useCallback((msg: string, action?: ToastAction) => {
    clearTimeout(timer.current);
    setMessage(msg);
    setToastAction(action ?? null);
    timer.current = setTimeout(() => {
      setMessage(null);
      setToastAction(null);
    }, action ? DELETE_DELAY : 5000); // 5 s: dá tempo de ler (e de o leitor de tela anunciar)
  }, []);

  const show = useCallback((key: string, on: boolean) => {
    setHidden((h) => {
      const next = new Set(h);
      if (on) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // shortcut: fechar a aba nos 8 s cancela a exclusão (o item volta); o aviso de saída cobre o caso comum.
  const scheduleDelete = useCallback(
    (key: string, commit: () => Promise<void>) => {
      show(key, false);
      const t = setTimeout(async () => {
        deletes.current.delete(key);
        try {
          await commit();
          // a resposta da action já tirou a linha da lista; o id pode voltar a existir num item novo
          setTimeout(() => show(key, true), 2000);
        } catch {
          show(key, true);
          notify("Não deu para excluir. Tente de novo.");
        }
      }, DELETE_DELAY);
      deletes.current.set(key, t);
      notify("Item excluído.", {
        label: "Desfazer",
        run: () => {
          clearTimeout(t);
          deletes.current.delete(key);
          show(key, true);
          notify("Exclusão desfeita.");
        },
      });
    },
    [notify, show],
  );

  // Sair com exclusão esperando: o navegador avisa (ela ainda não foi feita).
  useEffect(() => {
    if (hidden.size === 0) return;
    const warn = (e: BeforeUnloadEvent) => {
      if (deletes.current.size === 0) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hidden]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(
    () => ({ dirty, setDirty, crumb, setCrumb, notify, message, toastAction, menuOpen, setMenuOpen, leave, setLeave, hidden, scheduleDelete }),
    [dirty, crumb, notify, message, toastAction, menuOpen, leave, setLeave, hidden, scheduleDelete],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStatus(): Status {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStatus precisa estar dentro de <AdminStatusProvider>");
  return ctx;
}
