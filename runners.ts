import { need, parseRanges, range } from './utils';
import { getPdfjs } from './pdfjs';

export type Values = Record<string, string>;
export type Result = { name: string; data: Uint8Array };
type Runner = (files: File[], v: Values) => Promise<Result>;

const pdfLib = () => import('pdf-lib');
const open = async (f: File) => (await pdfLib()).PDFDocument.load(await f.arrayBuffer());
const done = async (d: { save(): Promise<Uint8Array> }, name: string): Promise<Result> => ({ name, data: await d.save() });

async function subset(src: Awaited<ReturnType<typeof open>>, indexes: number[]) {
  const { PDFDocument } = await pdfLib();
  const doc = await PDFDocument.create();
  (await doc.copyPages(src, indexes)).forEach((p) => doc.addPage(p));
  return doc;
}

export const runners: Record<string, Runner> = {
  'merge-pdf': async (files) => {
    const { PDFDocument } = await pdfLib();
    const out = await PDFDocument.create();
    for (const f of files) {
      const src = await open(f);
      (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
    }
    return done(out, 'merged.pdf');
  },

  'split-pdf': async (files, v) => {
    const src = await open(files[0]);
    const n = src.getPageCount();
    if (v.mode === 'each') {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      for (let i = 0; i < n; i++) zip.file(`page-${i + 1}.pdf`, await (await subset(src, [i])).save());
      return { name: 'pages.zip', data: await zip.generateAsync({ type: 'uint8array' }) };
    }
    return done(await subset(src, need(parseRanges(v.pages, n))), 'extracted.pdf');
  },

  'crop-pdf': async (files, v) => {
    const src = await open(files[0]);
    const [t, b, l, r] = ['top', 'bottom', 'left', 'right'].map((k) => Number(v[k]) || 0);
    if (l + r >= 95 || t + b >= 95) throw new Error('That crop leaves nothing visible. Reduce the trim values.');
    src.getPages().forEach((p) => {
      const m = p.getMediaBox();
      const x = m.x + (m.width * l) / 100;
      const y = m.y + (m.height * b) / 100;
      const w = m.width * (1 - (l + r) / 100);
      const h = m.height * (1 - (t + b) / 100);
      p.setCropBox(x, y, w, h);
      p.setMediaBox(x, y, w, h);
    });
    return done(src, 'cropped.pdf');
  },

  'rotate-pdf': async (files, v) => {
    const { degrees } = await pdfLib();
    const src = await open(files[0]);
    const n = src.getPageCount();
    const idx = v.pages.trim() ? parseRanges(v.pages, n) : range(n);
    idx.forEach((i) => {
      const p = src.getPage(i);
      p.setRotation(degrees((p.getRotation().angle + Number(v.angle)) % 360));
    });
    return done(src, 'rotated.pdf');
  },

  'delete-pages': async (files, v) => {
    const src = await open(files[0]);
    const idx = Array.from(new Set(need(parseRanges(v.pages, src.getPageCount()))));
    if (idx.length >= src.getPageCount()) throw new Error('You cannot delete every page.');
    idx.sort((a, b) => b - a).forEach((i) => src.removePage(i));
    return done(src, 'edited.pdf');
  },

  'add-pages': async (files, v) => {
    const src = await open(files[0]);
    const n = src.getPageCount();
    const at = Math.min(Math.max(0, Number(v.at) || 0), n);
    if (files[1]) {
      const extra = await open(files[1]);
      (await src.copyPages(extra, extra.getPageIndices())).forEach((p, k) => src.insertPage(at + k, p));
    } else {
      const { width, height } = src.getPage(0).getSize();
      const count = Math.min(200, Math.max(1, Number(v.cnt) || 1));
      for (let k = 0; k < count; k++) src.insertPage(at + k, [width, height]);
    }
    return done(src, 'pages-added.pdf');
  },

  'reorder-pages': async (files, v) => {
    const src = await open(files[0]);
    return done(await subset(src, need(parseRanges(v.pages, src.getPageCount()))), 'reordered.pdf');
  },

  'page-numbers': async (files, v) => {
    const { StandardFonts, rgb } = await pdfLib();
    const src = await open(files[0]);
    const font = await src.embedFont(StandardFonts.Helvetica);
    const size = Number(v.size) || 12;
    const start = Number.isFinite(Number(v.start)) ? Number(v.start) : 1;
    src.getPages().forEach((p, i) => {
      const { width, height } = p.getSize();
      const text = String(start + i);
      const tw = font.widthOfTextAtSize(text, size);
      const x = v.pos[1] === 'c' ? (width - tw) / 2 : v.pos[1] === 'r' ? width - tw - 30 : 30;
      const y = v.pos[0] === 'b' ? 24 : height - 24 - size;
      p.drawText(text, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) });
    });
    return done(src, 'numbered.pdf');
  },

  'watermark-pdf': async (files, v) => {
    const { StandardFonts, rgb, degrees } = await pdfLib();
    const src = await open(files[0]);
    const font = await src.embedFont(StandardFonts.HelveticaBold);
    const size = Number(v.size) || 60;
    const text = v.t || ' ';
    const opacity = Math.min(1, Math.max(0.05, Number(v.op) || 0.25));
    const c = Math.SQRT1_2;
    src.getPages().forEach((p) => {
      const { width, height } = p.getSize();
      const tw = font.widthOfTextAtSize(text, size);
      p.drawText(text, {
        x: width / 2 - (tw / 2) * c + size * 0.3 * c,
        y: height / 2 - (tw / 2) * c - size * 0.3 * c,
        size, font, color: rgb(0.5, 0.5, 0.5), opacity, rotate: degrees(45),
      });
    });
    return done(src, 'watermarked.pdf');
  },

  'edit-metadata': async (files, v) => {
    const src = await open(files[0]);
    if (v.title) src.setTitle(v.title);
    if (v.author) src.setAuthor(v.author);
    if (v.subject) src.setSubject(v.subject);
    if (v.keywords) src.setKeywords(v.keywords.split(',').map((s) => s.trim()).filter(Boolean));
    return done(src, 'metadata-updated.pdf');
  },

  'images-to-pdf': async (files) => {
    const { PDFDocument } = await pdfLib();
    const out = await PDFDocument.create();
    for (const f of files) {
      const bytes = await f.arrayBuffer();
      const img = f.type === 'image/png' ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      out.addPage([img.width, img.height]).drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }
    return done(out, 'images.pdf');
  },

  'pdf-to-images': async (files, v) => {
    const pdfjs = await getPdfjs();
    const JSZip = (await import('jszip')).default;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await files[0].arrayBuffer()) }).promise;
    const zip = new JSZip();
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: Number(v.scale) || 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('Could not render page.'))), 'image/png'));
      zip.file(`page-${i}.png`, await blob.arrayBuffer());
    }
    return { name: 'pages.zip', data: await zip.generateAsync({ type: 'uint8array' }) };
  },
};
