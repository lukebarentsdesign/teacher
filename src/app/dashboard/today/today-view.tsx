"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Clock, Check, Phone, ShieldCheck, RefreshCw,
  Download, Play, AlertCircle
} from "lucide-react";
import type { TodayResponse, TodayLesson, TodayNotification } from "@/app/api/today/route";
import { saveTodaySnapshot, loadTodaySnapshot } from "@/lib/offline-cache";

function cancelTodayHref(): string {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const params = new URLSearchParams({
    start: now.toISOString(),
    end: endOfToday.toISOString(),
    reason: "Illness/emergency",
  });
  return `/dashboard/unavailability/preview?${params.toString()}`;
}

export function TodayView({ teacherId }: { teacherId: string }) {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Accept/Reject loading state
  const [handlingNotif, setHandlingNotif] = useState<Record<string, "accepted" | "rejected" | null>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/today", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const fresh: TodayResponse = await res.json();
        if (cancelled) return;
        setData(fresh);
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

  const isLessonCompleted = (lesson: TodayLesson) => {
    return new Date(lesson.scheduledAt).getTime() + lesson.durationMins * 60_000 < Date.now();
  };

  const handleNotificationAction = (id: string, action: "accepted" | "rejected") => {
    setHandlingNotif(prev => ({ ...prev, [id]: action }));
    setTimeout(() => {
      if (data) {
        setData({
          ...data,
          notifications: data.notifications.filter(n => n.id !== id)
        });
      }
    }, 800);
  };

  // Group lessons by date string (e.g., "20.06.2024")
  const lessonsList = data?.lessons ?? [];
  
  // Find current active lesson (ongoing or next immediate)
  const activeLesson = lessonsList.find(l => !isLessonCompleted(l)) || lessonsList[0];
  
  // Find "Up Next" lesson
  const upNextLesson = lessonsList.find(l => l.id !== activeLesson?.id && !isLessonCompleted(l));

  // Timeline list (all excluding the current active one)
  const timelineLessons = lessonsList.filter(l => l.id !== activeLesson?.id);



  const getFormattedTime = (scheduledAt: string) => {
    const d = new Date(scheduledAt);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toLowerCase();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 flex items-center gap-2">
            Live workspace
            {isOffline && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-md">
                Offline Mode
              </span>
            )}
          </h1>
          <p className="text-xs text-neutral-500 font-semibold mt-1">
            Realtime schedule oversight, feedback archives, shared materials, and student request logs.
            {isOffline && cachedAt && ` (Cached data: ${new Date(cachedAt).toLocaleTimeString("en-GB")})`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isOffline && (
            <Link
              href={cancelTodayHref()}
              className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Cancel Remaining Lessons
            </Link>
          )}
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 transition-all shadow-sm"
          >
            Go to Calendar
          </Link>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="text-xs font-semibold">Syncing workspace logs...</span>
        </div>
      )}

      {/* 2-Column Responsive Workspace */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Workspace Column (70%) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Active Lesson (Now) */}
            {activeLesson ? (
              <div className="bg-white border-2 border-brand-500 rounded-[2rem] p-6 shadow-md relative overflow-hidden">
                {/* Visual top indicator */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-500 to-indigo-500" />
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <span className="h-1.5 w-1.5 bg-brand-600 rounded-full" />
                    Lesson Active
                  </span>
                  <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {getFormattedTime(activeLesson.scheduledAt)} ({activeLesson.durationMins} mins)
                  </span>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-black text-neutral-900">{activeLesson.studentName}</h2>
                    <p className="text-xs text-neutral-500 font-bold mt-1 uppercase tracking-wide">
                      {activeLesson.discipline} · {activeLesson.locationName}
                      {activeLesson.roomLabel ? ` · Room ${activeLesson.roomLabel}` : ""}
                    </p>
                  </div>
                  {activeLesson.payers.length > 0 && (
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-[10px] text-neutral-500 font-semibold space-y-1">
                      <p className="font-bold text-[9px] text-neutral-400 uppercase tracking-wide">Payer Contacts</p>
                      {activeLesson.payers.map((p, idx) => (
                        <p key={idx} className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" />
                          {p.name}: {p.phone || "No phone"}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subgrid: Feedback & Shared Materials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Feedback form previous lesson */}
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs">
                    <h3 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wide mb-1.5">
                      Last Lesson Notes
                    </h3>
                    <p className="text-neutral-600 leading-relaxed font-semibold">
                      {activeLesson.lastNote || "No notes logged from previous class."}
                    </p>
                  </div>

                  {/* Materials / Resources shared */}
                  <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-xs flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[10px] text-neutral-400 uppercase tracking-wide mb-2">
                        Lesson Materials
                      </h3>
                      {activeLesson.resources.length === 0 ? (
                        <p className="text-neutral-400 font-medium italic">
                          No resources currently shared with student.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeLesson.resources.map((res) => (
                            <a
                              key={res.id}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-lg bg-white border border-neutral-200/60 hover:border-brand-300 transition-all font-semibold"
                            >
                              <span className="truncate pr-2 font-bold text-neutral-800 text-[11px]">
                                {res.title}
                              </span>
                              <Download className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-8 shadow-sm text-center">
                <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-neutral-800 uppercase">No active classes</h3>
              </div>
            )}

            {/* 2. Up Next */}
            {upNextLesson && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Up Next</h3>
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center border border-brand-100">
                      <Play className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-sm">{upNextLesson.studentName}</h4>
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider mt-0.5">
                        {upNextLesson.discipline}
                      </p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Start Time</p>
                    <p className="text-xs font-bold text-neutral-800 flex items-center gap-1 justify-end">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {getFormattedTime(upNextLesson.scheduledAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Remaining Lessons list timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Today&apos;s Schedule Timeline</h3>
              {timelineLessons.length === 0 ? (
                <p className="text-xs font-semibold text-neutral-500 rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-sm text-center">
                  No other classes scheduled.
                </p>
              ) : (
                <div className="space-y-2">
                  {timelineLessons.map((lesson) => {
                    const comp = isLessonCompleted(lesson);
                    return (
                      <div 
                        key={lesson.id} 
                        className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            comp ? "bg-teal-50 text-teal-700 border border-teal-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {comp ? "Completed" : "Scheduled"}
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-neutral-900">{lesson.studentName}</h4>
                            <p className="text-[9px] text-neutral-500 font-semibold mt-0.5">
                              {lesson.discipline} · {lesson.locationName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Start</p>
                          <p className="text-xs font-bold text-neutral-800">{getFormattedTime(lesson.scheduledAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Side Panel Column: Safety & System Alerts (30%) */}
          <div className="space-y-6">

            {/* Safety safety lone-worker card */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  Lone Worker Safety
                </h3>
              </div>
              <div className="text-xs text-neutral-700 font-semibold space-y-2">
                <p className="flex items-center justify-between">
                  <span className="text-neutral-400">Emergency contact:</span>
                  <span>{data.teacher.emergencyContactName || "Not configured"}</span>
                </p>
                {data.teacher.emergencyContactPhone && (
                  <p className="flex items-center justify-between">
                    <span className="text-neutral-400">Phone:</span>
                    <span>{data.teacher.emergencyContactPhone}</span>
                  </p>
                )}
                {data.teacher.emergencyContactEmail && (
                  <p className="flex items-center justify-between">
                    <span className="text-neutral-400">Email:</span>
                    <span className="truncate max-w-[150px]">{data.teacher.emergencyContactEmail}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Notifications & Booking Alerts list */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Live Alerts & Booking Requests</h3>
              {data.notifications.length === 0 ? (
                <p className="text-xs font-semibold text-neutral-500 rounded-2xl bg-white border border-neutral-200/80 p-5 shadow-sm text-center">
                  No pending requests or alerts.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.notifications.map((notif: TodayNotification) => {
                    const state = handlingNotif[notif.id];
                    return (
                      <div 
                        key={notif.id}
                        className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm flex items-start gap-3 relative transition-all"
                      >
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                          {notif.title[0]?.toUpperCase() || "A"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-[10px] font-bold text-neutral-900 truncate">
                              {notif.title}
                            </span>
                            <span className="text-[8px] font-semibold text-neutral-400 whitespace-nowrap">
                              {new Date(notif.time).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-medium leading-normal mt-1 pr-1">
                            {notif.description}
                          </p>

                          {/* Actionable buttons */}
                          {notif.actionable && !state && (
                            <div className="flex gap-2 mt-3.5">
                              <button
                                type="button"
                                onClick={() => handleNotificationAction(notif.id, "rejected")}
                                className="flex-1 rounded-xl border border-neutral-300 py-1.5 text-[10px] font-bold text-neutral-600 hover:bg-neutral-50 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleNotificationAction(notif.id, "accepted")}
                                className="flex-1 rounded-xl bg-teal-500 hover:bg-teal-600 text-white py-1.5 text-[10px] font-bold transition-colors shadow-sm"
                              >
                                Accept
                              </button>
                            </div>
                          )}

                          {state && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-teal-600">
                              <Check className="h-3.5 w-3.5" />
                              <span>Request {state === "accepted" ? "approved" : "rejected"}!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
