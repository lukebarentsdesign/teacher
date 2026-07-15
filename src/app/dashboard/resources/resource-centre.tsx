"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileText,
  Folder,
  Headphones,
  Image as ImageIcon,
  Music2,
  Pin,
  Plus,
  Search,
  Video,
} from "lucide-react";

type Resource = {
  id: string;
  title: string;
  type: "DOCUMENT" | "AUDIO" | "VIDEO" | "IMAGE";
  url: string;
  description: string | null;
  folder: string | null;
  sourceLabel: string | null;
  tags: string | null;
  thumbnailUrl: string | null;
  pinned: boolean;
  createdAt: string;
  student: { name: string } | null;
};

const TYPE_META = {
  DOCUMENT: { label: "Docs", icon: FileText, tone: "bg-slate-100 text-slate-700 border-slate-200" },
  AUDIO: { label: "Audio", icon: Headphones, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  VIDEO: { label: "Video", icon: Video, tone: "bg-rose-50 text-rose-700 border-rose-100" },
  IMAGE: { label: "Images", icon: ImageIcon, tone: "bg-sky-50 text-sky-700 border-sky-100" },
};

function getTags(resource: Resource) {
  return (resource.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function ResourceIcon({ type }: { type: Resource["type"] }) {
  const Icon = TYPE_META[type].icon;
  return <Icon className="h-5 w-5" />;
}

export function ResourceCentre({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedResourceId, setSelectedResourceId] = useState(resources[0]?.id ?? "");

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    resources.forEach((resource) => {
      const folder = resource.folder || "General library";
      counts.set(folder, (counts.get(folder) ?? 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [resources]);

  const filtered = resources.filter((resource) => {
    const text = [resource.title, resource.description, resource.folder, resource.sourceLabel, resource.tags, resource.student?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const folder = resource.folder || "General library";
    return (
      text.includes(query.toLowerCase()) &&
      (selectedFolder === "All" || folder === selectedFolder) &&
      (selectedType === "All" || resource.type === selectedType)
    );
  });

  const selected = resources.find((resource) => resource.id === selectedResourceId) ?? filtered[0] ?? resources[0];
  const pinned = resources.filter((resource) => resource.pinned).slice(0, 5);

  return (
    <div className="min-h-[720px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="grid min-h-[720px] lg:grid-cols-[230px_1fr_280px]">
        <aside className="border-b border-neutral-200 bg-neutral-50/80 p-5 lg:border-b-0 lg:border-r">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-900 text-white">
                <Music2 className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-black text-neutral-900">Resource centre</div>
                <div className="text-[10px] font-semibold text-neutral-400">Lesson-ready library</div>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            <button type="button" onClick={() => setSelectedFolder("All")} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${selectedFolder === "All" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:bg-white/70"}`}>
              <span>All resources</span>
              <span className="text-xs text-neutral-400">{resources.length}</span>
            </button>
            {folders.map(([folder, count]) => (
              <button key={folder} type="button" onClick={() => setSelectedFolder(folder)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold ${selectedFolder === folder ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:bg-white/70"}`}>
                <span className="flex min-w-0 items-center gap-2"><Folder className="h-4 w-4 shrink-0" /><span className="truncate">{folder}</span></span>
                <span className="text-xs text-neutral-400">{count}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-neutral-900">Teaching resources</h1>
              <p className="mt-1 text-sm font-medium text-neutral-500">Audio, video, links, scans, PDFs and lesson media.</p>
            </div>
            <Link href="/dashboard/resources/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700">
              <Plus className="h-4 w-4" />
              Add resource
            </Link>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative block flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search resources" className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-3 text-sm outline-none transition-colors focus:border-neutral-400" />
            </label>
            <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-600 outline-none focus:border-neutral-400">
              <option value="All">All types</option>
              <option value="DOCUMENT">Documents</option>
              <option value="IMAGE">Images</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-10 text-center text-sm font-semibold text-neutral-500">No matching resources.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((resource) => {
                const meta = TYPE_META[resource.type];
                const selectedCard = selected?.id === resource.id;
                return (
                  <button key={resource.id} type="button" onClick={() => setSelectedResourceId(resource.id)} className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${selectedCard ? "border-brand-400 ring-2 ring-brand-100" : "border-neutral-200"}`}>
                    <div className="relative h-28 bg-gradient-to-br from-neutral-50 to-neutral-200">
                      {resource.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- external teacher-managed thumbnails are arbitrary URLs.
                        <img src={resource.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-neutral-400"><ResourceIcon type={resource.type} /></div>
                      )}
                      {resource.pinned && <Pin className="absolute right-3 top-3 h-4 w-4 text-neutral-700" />}
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-black text-neutral-900">{resource.title}</h2>
                          <p className="mt-1 truncate text-xs font-semibold text-neutral-400">{resource.sourceLabel || resource.folder || "General library"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.tone}`}>{meta.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getTags(resource).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">{tag}</span>)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        <aside className="border-t border-neutral-200 bg-white p-5 lg:border-l lg:border-t-0">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-neutral-900">Info</h2>
            <span className="text-xs font-bold text-neutral-400">{filtered.length} shown</span>
          </div>

          {selected ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-200 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-neutral-900">
                  <ResourceIcon type={selected.type} />
                  <span className="truncate">{selected.title}</span>
                </div>
                <dl className="space-y-2 text-xs font-semibold text-neutral-500">
                  <div className="flex justify-between gap-4"><dt>Type</dt><dd className="text-neutral-900">{TYPE_META[selected.type].label}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Folder</dt><dd className="truncate text-neutral-900">{selected.folder || "General"}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Source</dt><dd className="truncate text-neutral-900">{selected.sourceLabel || "Link"}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Attached</dt><dd className="truncate text-neutral-900">{selected.student?.name || "General"}</dd></div>
                </dl>
                {selected.description && <p className="mt-4 text-xs font-medium leading-relaxed text-neutral-500">{selected.description}</p>}
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700">
                  Open resource <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {pinned.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-black uppercase tracking-wide text-neutral-400">Pinned items</h3>
                  <div className="space-y-2">
                    {pinned.map((resource) => (
                      <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">
                        <Pin className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="truncate">{resource.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-neutral-500">Add a resource to start building your library.</p>
          )}
        </aside>
      </div>
    </div>
  );
}