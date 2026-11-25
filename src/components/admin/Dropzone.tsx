"use client";
import { useEffect, useId, useRef, useState } from "react";
import { checkFileSize, type UploadKind } from "@/lib/uploadLimits";

// Envio de arquivo: o <input type=file> real segue no formulário (FormData); a área só soma arrastar e a miniatura.
export default function Dropzone({ label, name, accept, currentUrl, kind, onFile, onRemove, error, hint }: {
  label: string;
  name: string;
  accept: string;
  currentUrl: string | null;
  kind: UploadKind;
  onFile: (f: File | null) => void;
  onRemove: (removed: boolean) => void;
  error?: string;
  hint?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  // A URL temporária vive enquanto o arquivo vive: revoga ao trocar e ao desmontar.
  useEffect(() => {
    if (!file || kind !== "image") {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  function pick(f: File | null) {
    const tooBig = f ? checkFileSize(f, kind) : null;
    setSizeError(tooBig);
    if (tooBig) {
      if (input.current) input.current.value = ""; // não deixa o arquivo grande ir no envio
      setFile(null);
      onFile(null); // o pai fica igual ao campo vazio
      return;
    }
    setFile(f);
    onFile(f);
    if (f) onRemove(false); // o "remover" some junto com o arquivo atual
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return; // texto ou link: ignora
    if (input.current) {
      try {
        input.current.files = e.dataTransfer.files; // para o arquivo ir no FormData
      } catch {
        /* ambiente sem suporte: só o estado recebe o arquivo */
      }
    }
    pick(f);
  }

  const shown = preview ?? (kind === "image" && !file ? currentUrl : null);

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label htmlFor={id}>{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-2 rounded-lg border border-dashed bg-[var(--surface)] p-4 text-center ${over ? "border-[var(--accent)]" : "border-[var(--border)]"}`}
      >
        {shown && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Miniatura" className="max-h-32 rounded-md" />
        )}
        {file && kind === "pdf" && <span>{file.name}</span>}
        <input
          ref={input}
          id={id}
          type="file"
          name={name}
          accept={accept}
          className="w-full text-xs"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        <span className="text-xs text-[var(--muted)]">Arraste um arquivo aqui ou escolha acima</span>
      </div>
      {hint && <span className="text-xs text-[var(--muted)]">{hint}</span>}
      {currentUrl && !file && (
        <span className="flex flex-wrap items-center gap-3 text-xs">
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="underline">ver arquivo atual</a>
          <label className="flex items-center gap-1">
            <input type="checkbox" name={`remove_${name}`} onChange={(e) => onRemove(e.target.checked)} />
            remover
          </label>
        </span>
      )}
      {(sizeError || error) && <span role="alert" className="text-xs text-[var(--danger)]">{sizeError ?? error}</span>}
    </div>
  );
}
