"use client";

import { useAdminStatus } from "./AdminStatus";

// A região fica sempre montada (vazia) para os leitores de tela anunciarem o aviso.
export default function Toast() {
  const { message, toastAction } = useAdminStatus();
  return (
    <div role="status" className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      {message && (
        <span className="pointer-events-auto flex items-center gap-3 rounded-full border border-[var(--accent)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--fg)] shadow-lg">
          {message}
          {toastAction && (
            <button type="button" onClick={toastAction.run} className="font-semibold text-[var(--accent)] underline">
              {toastAction.label}
            </button>
          )}
        </span>
      )}
    </div>
  );
}
