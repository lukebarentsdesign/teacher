"use client";

import { useEffect, useState } from "react";
import type { TodayResponse } from "@/app/api/today/route";
import { saveTodaySnapshot, loadTodaySnapshot } from "@/lib/offline-cache";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TodayView({ teacherId }: { teacherId: string }) {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/today", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const fresh: TodayResponse = await res.json();
        if (cancelled) return;
        setData(fresh);
        // The service worker's runtime-caching strategy (src/app/sw.ts) can transparently serve a
        // cached response as a normal, non-throwing fetch — so a successful fetch() does NOT mean
        // the data is live. navigator.onLine is the only reliable signal that this response might
        // actually be the service worker's cached copy rather than a fresh server round-trip.
        if (navigator.onLine) {
          setCachedAt(null);
          setIsOffline(false);
          void saveTodaySnapshot(teacherId, fresh);
        } else {
          setCachedAt(fresh.generatedAt);
          setIsOffline(true);
        }
      } catch {
        const cached = await loadTodaySnapshot<TodayResponse>(teacherId);
        if (cancelled) return;
        if (cached) {
          setData(cached.data);
          setCachedAt(cached.cachedAt);
          setIsOffline(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const onOnline = () => load();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [teacherId]);

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My day</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Today &amp; tomorrow&apos;s lessons, view-only — works with no connection once loaded here
          at least once. Attendance, notes, and billing all need a live connection.
        </p>
      </div>

      {isOffline && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You&apos;re offline — showing cached data
          {cachedAt && ` as of ${new Date(cachedAt).toLocaleString("en-GB")}`}.
        </p>
      )}

      {loading && <p className="text-sm text-neutral-500">Loading…</p>}

      {!loading && data && data.lessons.length === 0 && (
        <p className="text-sm text-neutral-500">No lessons today or tomorrow.</p>
      )}

      {!loading && data && data.lessons.length > 0 && (
        <div className="space-y-3">
          {data.lessons.map((lesson) => {
            const d = new Date(lesson.scheduledAt);
            return (
              <div key={lesson.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-neutral-900">{lesson.studentName}</p>
                  <p className="text-sm text-neutral-500">
                    {DAY_LABELS[d.getDay()]}{" "}
                    {d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {lesson.discipline} · {lesson.schoolName}
                  {lesson.roomLabel ? ` · ${lesson.roomLabel}` : ""}
                </p>
                {lesson.payers.length > 0 && (
                  <p className="mt-2 text-xs text-neutral-400">
                    {lesson.payers
                      .map((p) => [p.name, p.phone].filter(Boolean).join(" "))
                      .join(" · ")}
                  </p>
                )}
                {lesson.lastNote && (
                  <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                    {lesson.lastNote}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && !data && (
        <p className="text-sm text-neutral-500">
          No data available offline yet — open this page once while online to cache it.
        </p>
      )}
    </div>
  );
}
