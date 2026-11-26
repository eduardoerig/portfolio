"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Status = {
  dirty: boolean;
  setDirty(b: boolean): void;
  crumb: string | null;
  setCrumb(s: string | null): void;
  notify(msg: string): void;
  /** Aviso atual do Toast (null quando não há). */
  message: string | null;
  /** Gaveta do menu lateral no celular. */
  menuOpen: boolean;
  setMenuOpen(b: boolean): void;
  /** Editor com salvar sozinho aberto: grava o pendente antes de sair; true = tudo gravado. */
  leave: (() => Promise<boolean>) | null;
  setLeave(fn: (() => Promise<boolean>) | null): void;
};

const Ctx = createContext<Status | null>(null);

// Estado compartilhado do painel: edições pendentes, migalha e avisos rápidos.
export function AdminStatusProvider({ children }: { children: React.ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [crumb, setCrumb] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leave, setLeaveState] = useState<(() => Promise<boolean>) | null>(null);
  const setLeave = useCallback((fn: (() => Promise<boolean>) | null) => setLeaveState(() => fn), []);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(null), 2500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(
    () => ({ dirty, setDirty, crumb, setCrumb, notify, message, menuOpen, setMenuOpen, leave, setLeave }),
    [dirty, crumb, notify, message, menuOpen, leave, setLeave],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStatus(): Status {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStatus precisa estar dentro de <AdminStatusProvider>");
  return ctx;
}
