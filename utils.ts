/** Parse "1-3,5,8-" into zero-based page indexes. Throws a readable error on bad input. */
export function parseRanges(input: string, total: number): number[] {
  const out: number[] = [];
  for (const part of input.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = part.match(/^(\d*)-(\d*)$/);
    if (m) {
      let a = Number(m[1]) || 1;
      let b = Number(m[2]) || total;
      if (a > b) [a, b] = [b, a];
      for (let i = a; i <= b; i++) {
        if (i < 1 || i > total) throw new Error(`Page ${i} is out of range (1-${total}).`);
        out.push(i - 1);
      }
    } else {
      const n = Number(part);
      if (!Number.isInteger(n) || n < 1 || n > total) throw new Error(`"${part}" is not a valid page (1-${total}).`);
      out.push(n - 1);
    }
  }
  return out;
}

export const need = (a: number[]) => {
  if (!a.length) throw new Error('Enter at least one valid page number.');
  return a;
};

export const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function downloadFile(name: string, data: Uint8Array) {
  const type = name.endsWith('.zip') ? 'application/zip' : 'application/pdf';
  const url = URL.createObjectURL(new Blob([data as unknown as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
