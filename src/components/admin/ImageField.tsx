"use client";
import { useId, useRef, useState } from "react";
import { shrinkImage } from "@/lib/shrinkImage";
import { checkFileSize } from "@/lib/uploadLimits";

// Campo de imagem só de apresentação: miniatura + Trocar/Remover, ou área para arrastar/escolher.
export default function ImageField({ label, hint, url, busy, error, onPick, onRemove }: {
  label: string;
  hint?: string;
  url: string | null;
  busy: boolean;
  error?: string;
  onPick: (f: File) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const labelId = `${id}-rotulo`;
  const input = useRef<HTMLInputElement>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  async function pick(f: File | undefined) {
    if (input.current) input.current.value = ""; // permite escolher o mesmo arquivo de novo
    if (!f) return;
    const small = await shrinkImage(f);
    const tooBig = checkFileSize(small, "image");
    setSizeError(tooBig);
    if (!tooBig) onPick(small);
  }

  const open = () => input.current?.click();

  return (
    <div
      className="flex flex-col gap-1 text-sm"
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) void pick(e.dataTransfer.files[0]); }}
    >
      {/* O input de arquivo fica escondido: os botões abrem ele e levam o rótulo do campo junto. */}
      <span id={labelId}>{label}</span>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-labelledby={labelId}
        disabled={busy}
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      {url ? (
        <div className={`flex flex-col items-start gap-2 rounded-lg border border-dashed bg-[var(--surface)] p-3 ${over ? "border-[var(--accent)]" : "border-[var(--border)]"}`}>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${label} atual`} className={`max-h-32 rounded-md ${busy ? "opacity-50" : ""}`} />
            {busy && <span className="absolute inset-0 flex items-center justify-center text-xs">Enviando…</span>}
          </div>
          <span className="flex gap-2">
            <button type="button" className="btn" disabled={busy} onClick={open} aria-describedby={labelId}>Trocar</button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={onRemove} aria-describedby={labelId}>Remover</button>
          </span>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={open}
          aria-describedby={labelId}
          className={`rounded-lg border border-dashed bg-[var(--surface)] p-6 text-center text-xs text-[var(--muted)] ${over ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
        >
          {busy ? "Enviando…" : "Arraste uma imagem ou clique para escolher"}
        </button>
      )}
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {(sizeError || error) && <span role="alert" className="text-xs text-[var(--danger)]">{sizeError ?? error}</span>}
    </div>
  );
}
