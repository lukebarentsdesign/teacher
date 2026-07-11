"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, GraduationCap, Wallet, Building2 } from "lucide-react";
import type { SearchResults } from "@/app/api/search/route";

const EMPTY: SearchResults = { students: [], payers: [], schools: [] };

export function GlobalSearch({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults(EMPTY);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(href);
  }

  const hasResults =
    results.students.length > 0 || results.payers.length > 0 || results.schools.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search students, payers, schools…"
          className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 z-40 mt-1 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-card">
          {loading && !hasResults && <p className="px-3 py-3 text-sm text-neutral-400">Searching…</p>}
          {!loading && !hasResults && <p className="px-3 py-3 text-sm text-neutral-400">No matches.</p>}

          {results.students.length > 0 && (
            <Group icon={<GraduationCap className="h-3.5 w-3.5" />} label="Students">
              {results.students.map((s) => (
                <ResultRow key={s.id} onClick={() => go(`/dashboard/students/${s.id}#payers`)}>
                  <span className="text-neutral-900">{s.name}</span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {[s.age != null ? `age ${s.age}` : null, s.school ?? "home", s.payers.join(", ") || null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </ResultRow>
              ))}
            </Group>
          )}

          {results.payers.length > 0 && (
            <Group icon={<Wallet className="h-3.5 w-3.5" />} label="Payers">
              {results.payers.map((p) => (
                <ResultRow key={p.id} onClick={() => go(`/dashboard/payers/${p.id}#pupils`)}>
                  <span className="text-neutral-900">{p.name}</span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {[p.phone, p.pupils.join(", ") || null, p.isEmergencyContactOnly ? "contact only" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </ResultRow>
              ))}
            </Group>
          )}

          {results.schools.length > 0 && (
            <Group icon={<Building2 className="h-3.5 w-3.5" />} label="Schools">
              {results.schools.map((sc) => (
                <ResultRow key={sc.id} onClick={() => go(`/dashboard/schools/${sc.id}#enrolled`)}>
                  <span className="text-neutral-900">{sc.name}</span>
                  <span className="ml-2 text-xs text-neutral-400">
                    {sc.enrolledCount} enrolled
                  </span>
                </ResultRow>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-neutral-100 py-1 last:border-0">
      <div className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
    >
      {children}
    </button>
  );
}
