// Foto de celular costuma passar do limite de envio: reduz no navegador antes de mandar.
const MAX_SIDE = 2000;
const KEEP_BELOW = 1.5 * 1024 * 1024; // abaixo disso envia como veio
const ACCEPTED = ["image/jpeg", "image/webp"];

export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= KEEP_BELOW || typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    // PNG pode ter transparência: WebP a mantém; o resto vira JPEG.
    const wanted = file.type === "image/png" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, wanted, 0.85));
    // Navegador sem o formato pedido devolve PNG: aí não compensa.
    if (!blob || !ACCEPTED.includes(blob.type) || blob.size >= file.size) return file;
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${ext}`, { type: blob.type });
  } catch {
    return file; // formato que o navegador não lê: o aviso de tamanho cuida
  }
}
