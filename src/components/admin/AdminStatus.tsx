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
};

const Ctx = createContext<Status | null>(null);

// Estado compartilhado do painel: edições pendentes, migalha e avisos rápidos.
export function AdminStatusProvider({ children }: { children: React.ReactNode }) {
  const [dirty, setDirty] = useState(false);
  const [crumb, setCrumb] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((msg: string) => {
    clearTimeout(timer.current);
    setMessage(msg);
    timer.current = setTimeout(() => setMessage(null), 2500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(
    () => ({ dirty, setDirty, crumb, setCrumb, notify, message, menuOpen, setMenuOpen }),
    [dirty, crumb, notify, message, menuOpen],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminStatus(): Status {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminStatus precisa estar dentro de <AdminStatusProvider>");
  return ctx;
}
