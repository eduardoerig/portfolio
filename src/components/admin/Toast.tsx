"use client";

import { useAdminStatus } from "./AdminStatus";

// A região fica sempre montada (vazia) para os leitores de tela anunciarem o aviso.
export default function Toast() {
  const { message } = useAdminStatus();
  return (
    <div role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      {message && (
        <span className="block rounded-full border border-[var(--accent)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--fg)] shadow-lg">
          {message}
        </span>
      )}
    </div>
  );
}
