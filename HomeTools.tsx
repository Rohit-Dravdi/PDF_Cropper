'use client';

import Link from 'next/link';
import { useState } from 'react';
import { categories, tools } from '@/lib/tools';

export default function HomeTools() {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const match = (t: (typeof tools)[number]) => !term || `${t.name} ${t.short} ${t.category}`.toLowerCase().includes(term);

  return (
    <div>
      <input
        className="input max-w-xl !py-3 text-lg"
        type="search"
        placeholder="What do you want to do? Try “crop” or “merge”"
        aria-label="Search tools"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="mt-10 space-y-10">
        {categories.map((c) => {
          const list = tools.filter((t) => t.category === c && match(t));
          if (!list.length) return null;
          return (
            <section key={c}>
              <h2 className="mb-1 text-xl font-bold">{c}</h2>
              <div className="grid gap-x-10 md:grid-cols-2">
                {list.map((t) => (
                  <Link key={t.slug} href={`/${t.slug}`} className="tool-row no-underline">
                    <span className="text-2xl" aria-hidden>{t.icon}</span>
                    <span>
                      <span className="block font-semibold">{t.name}</span>
                      <span className="muted block text-sm">{t.short}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        {!tools.some(match) && <p className="muted">No tool matches “{q}”. Try a word like split, rotate or images.</p>}
      </div>
    </div>
  );
}
