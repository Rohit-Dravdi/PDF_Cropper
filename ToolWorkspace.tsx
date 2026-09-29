'use client';

import { useEffect, useState } from 'react';
import type { Tool } from '@/lib/tools';
import { runners, type Result } from '@/lib/pdf/runners';
import { downloadFile, formatSize } from '@/lib/pdf/utils';
import { getPdfjs } from '@/lib/pdf/pdfjs';

const MAX_MB = 100;

export default function ToolWorkspace({ tool }: { tool: Tool }) {
  const [files, setFiles] = useState<File[]>([]);
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(tool.fields.map((f) => [f.key, f.default ?? f.options?.[0]?.[0] ?? ''])),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState<Result | null>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [hot, setHot] = useState(false);
  const first = files[0];

  // Page previews for the first PDF (rendered in the browser with pdf.js).
  useEffect(() => {
    setThumbs([]);
    if (!first || tool.accept !== 'pdf') return;
    let dead = false;
    (async () => {
      try {
        const pdfjs = await getPdfjs();
        const doc = await pdfjs.getDocument({ data: new Uint8Array(await first.arrayBuffer()) }).promise;
        for (let i = 1; i <= Math.min(doc.numPages, 60); i++) {
          const page = await doc.getPage(i);
          if (dead) return;
          const viewport = page.getViewport({ scale: 0.35 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
          if (dead) return;
          const url = canvas.toDataURL('image/jpeg', 0.7);
          setThumbs((t) => [...t, url]);
        }
      } catch {
        /* Preview is optional. Errors such as passwords are reported when you run the tool. */
      }
    })();
    return () => {
      dead = true;
    };
  }, [first, tool.accept]);

  const add = (list: File[]) => {
    const ok = list.filter((f) =>
      tool.accept === 'pdf' ? f.type === 'application/pdf' || /\.pdf$/i.test(f.name) : /^image\/(png|jpeg)$/.test(f.type),
    );
    if (!ok.length) return setErr(tool.accept === 'pdf' ? 'Please choose a PDF file.' : 'Please choose JPG or PNG images.');
    if (ok.some((f) => f.size > MAX_MB * 1024 * 1024)) return setErr(`Files must be smaller than ${MAX_MB} MB.`);
    setErr('');
    setRes(null);
    setFiles((p) => (tool.multi ? [...p, ...ok] : [ok[0]]));
  };

  const move = (i: number, d: number) =>
    setFiles((p) => {
      const j = i + d;
      if (j < 0 || j >= p.length) return p;
      const n = [...p];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const run = async () => {
    const min = tool.min ?? 1;
    if (files.length < min) return setErr(`Add at least ${min} file${min > 1 ? 's' : ''}.`);
    setBusy(true);
    setErr('');
    setRes(null);
    try {
      await new Promise((r) => setTimeout(r, 30)); // let the button state paint first
      setRes(await runners[tool.slug](files, vals));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(/encrypt|password/i.test(m) ? 'This PDF is password-protected. Remove the password, then try again.' : m);
    } finally {
      setBusy(false);
    }
  };

  const isCrop = tool.slug === 'crop-pdf';
  const mask = {
    top: `${vals.top || 0}%`, bottom: `${vals.bottom || 0}%`, left: `${vals.left || 0}%`, right: `${vals.right || 0}%`,
  };

  return (
    <div className="panel">
      <label
        className={`drop ${hot ? 'hot' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setHot(true); }}
        onDragLeave={() => setHot(false)}
        onDrop={(e) => { e.preventDefault(); setHot(false); add(Array.from(e.dataTransfer.files)); }}
      >
        <input
          type="file"
          hidden
          multiple={tool.multi}
          accept={tool.accept === 'pdf' ? 'application/pdf' : 'image/png,image/jpeg'}
          onChange={(e) => { add(Array.from(e.target.files || [])); e.target.value = ''; }}
        />
        <strong>Drop {tool.accept === 'pdf' ? 'a PDF' : 'images'} here</strong>
        <span className="muted"> or click to choose{tool.multi ? ' (you can add more than one)' : ''}</span>
      </label>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded border px-3 py-2" style={{ borderColor: 'var(--line)' }}>
              <span className="truncate">{f.name} <span className="muted text-sm">{formatSize(f.size)}</span></span>
              <span className="flex shrink-0 gap-1">
                {tool.multi && (
                  <>
                    <button className="btn btn-quiet !px-2 !py-1" onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                    <button className="btn btn-quiet !px-2 !py-1" onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  </>
                )}
                <button className="btn btn-quiet !px-2 !py-1" onClick={() => { setFiles((p) => p.filter((_, k) => k !== i)); setRes(null); }} aria-label="Remove file">✕</button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && tool.fields.length > 0 && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {tool.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1 text-sm font-semibold">
              {f.label}
              {f.type === 'select' ? (
                <select className="input" value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}>
                  {f.options!.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : f.type === 'range' ? (
                <span className="flex items-center gap-3">
                  <input type="range" min={0} max={45} className="w-full" value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
                  <output className="w-10 text-right">{vals[f.key]}%</output>
                </span>
              ) : (
                <input className="input" type={f.type} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
              )}
            </label>
          ))}
        </div>
      )}

      {thumbs.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {thumbs.map((src, i) => (
            <div className="thumb" key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Page ${i + 1}`} />
              {isCrop && <i className="crop-mask" style={{ top: mask.top, bottom: mask.bottom, left: mask.left, right: mask.right }} />}
              <span>{i + 1}</span>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6">
          <button className="btn" disabled={busy} onClick={run}>{busy ? 'Working…' : tool.name}</button>
        </div>
      )}

      <p role="alert" className="mt-3 min-h-[1.5rem] font-semibold" style={{ color: 'var(--danger)' }}>{err}</p>

      {res && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border p-4" style={{ borderColor: 'var(--brand)' }}>
          <span><strong>{res.name}</strong> is ready ({formatSize(res.data.length)}).</span>
          <span className="flex gap-2">
            <button className="btn" onClick={() => downloadFile(res.name, res.data)}>Download</button>
            <button className="btn btn-quiet" onClick={() => { setFiles([]); setRes(null); }}>Start over</button>
          </span>
        </div>
      )}
    </div>
  );
}
