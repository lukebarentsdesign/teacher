"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, MapPin, X } from "lucide-react";

export type LessonEvent = {
  id: string;
  title: string;
  discipline: string;
  start: string;
  end: string;
  color: string;
  locationName: string;
  roomName: string | null;
  durationMins: number;
  studentId: string;
  noShowConfirmed: boolean;
  status: string;
  presentCount: number;
  absentCount: number;
};



interface TeacherCalendarProps {
  selectedDateStr: string;
  lessonEvents: LessonEvent[];
}

export function TeacherCalendar({
  selectedDateStr,
  lessonEvents,
}: TeacherCalendarProps) {
  const router = useRouter();
  const selectedDate = new Date(selectedDateStr);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [activeLesson, setActiveLesson] = useState<LessonEvent | null>(null);

  // Compute Monday of the week containing selectedDate
  const day = selectedDate.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(selectedDate.getTime() + diffToMon * 24 * 3600 * 1000);

  // Generate 5 days of the week (Mon - Fri)
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    return new Date(monday.getTime() + i * 24 * 3600 * 1000);
  });

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate.getTime() - 7 * 24 * 3600 * 1000);
    const offset = prev.getTimezoneOffset();
    const corrected = new Date(prev.getTime() - offset * 60 * 1000);
    router.push(`/dashboard?date=${corrected.toISOString().split("T")[0]}`);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate.getTime() + 7 * 24 * 3600 * 1000);
    const offset = next.getTimezoneOffset();
    const corrected = new Date(next.getTime() - offset * 60 * 1000);
    router.push(`/dashboard?date=${corrected.toISOString().split("T")[0]}`);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getLessonsForDate = (targetDate: Date) => {
    return lessonEvents.filter((event) => {
      const d = new Date(event.start);
      return isSameDay(d, targetDate);
    });
  };

  const formatEventTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header with Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-neutral-800 tracking-tight">Timetable</h2>
        
        <div className="flex items-center gap-3">
          {/* Pill Selector */}
          <div className="flex rounded-xl bg-neutral-200/60 p-1 text-xs font-semibold">
            {(["day", "week", "month"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-lg px-3.5 py-1.5 uppercase tracking-wider transition-all ${
                  viewMode === mode
                    ? "bg-white text-brand-700 shadow-sm font-bold"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-100 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Week Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 min-h-[400px] select-none relative">
        {weekDates.map((date, index) => {
          const active = isSameDay(date, selectedDate);
          const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
          const dayNum = date.getDate().toString().padStart(2, "0");
          const lessons = getLessonsForDate(date);

          return (
            <div
              key={index}
              className={`flex flex-col rounded-2xl border bg-white p-2 transition-all min-h-[120px] md:min-h-[350px] ${
                active
                  ? "border-brand-200 shadow-md ring-1 ring-brand-100"
                  : "border-neutral-200 shadow-sm"
              }`}
            >
              {/* Day Header Column */}
              <div className="text-center pb-3 border-b border-neutral-100 mb-3 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                  {dayName}
                </span>
                <div className="mt-1 flex justify-center">
                  <span
                    onClick={() => {
                      const offset = date.getTimezoneOffset();
                      const corrected = new Date(date.getTime() - offset * 60 * 1000);
                      router.push(`/dashboard?date=${corrected.toISOString().split("T")[0]}`);
                    }}
                    className={`h-7 w-7 flex items-center justify-center rounded-full text-xs font-extrabold cursor-pointer transition-all ${
                      active
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>
              </div>

              {/* Lesson Items */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[450px] pr-0.5 scrollbar-thin">
                {lessons.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-10">
                    <span className="text-[10px] text-neutral-350 font-medium">Empty</span>
                  </div>
                ) : (
                  lessons.map((event) => {
                    const startStr = formatEventTime(event.start);
                    const endStr = formatEventTime(event.end);
                    
                    return (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveLesson(event);
                        }}
                        style={{ borderLeftColor: event.color }}
                        className="group flex flex-col justify-between p-2.5 rounded-xl border border-neutral-150 bg-neutral-50/50 hover:bg-white hover:shadow-card hover:border-neutral-250 cursor-pointer border-l-4 transition-all duration-150 relative min-h-[90px]"
                      >
                        {/* Time & Class Row */}
                        <div className="flex items-center justify-between text-[9px] font-bold text-neutral-400">
                          <span>{startStr} - {endStr}</span>
                          <span className="bg-neutral-150/60 px-1.5 py-0.5 rounded text-[8px] tracking-wide text-neutral-600 font-extrabold uppercase">
                            1:1
                          </span>
                        </div>
                        {/* Title Row */}
                        <div className="mt-2 text-xs font-bold text-neutral-800 leading-tight group-hover:text-brand-700 transition-colors">
                          {event.discipline || "Music Lesson"}
                        </div>
                        {/* Subtitle Row */}
                        <div className="mt-1 flex items-center justify-between text-[9px] text-neutral-400 font-medium truncate">
                          <span className="truncate max-w-[70px]">{event.title}</span>
                          <span
                            style={{ backgroundColor: event.color }}
                            className="h-1.5 w-1.5 rounded-full shrink-0 shadow-sm"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Modal / Popup Detail Card Overlay */}
        {activeLesson && (
          <div className="fixed inset-0 bg-neutral-900/30 backdrop-blur-[1.5px] flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl p-5 w-full max-w-[340px] animate-fade-in relative">
              <button
                type="button"
                onClick={() => setActiveLesson(null)}
                className="absolute right-3.5 top-3.5 p-1 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Popup Header */}
              <div className="flex items-start gap-3.5 mb-4 pr-6">
                <div
                  style={{ backgroundColor: activeLesson.color }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs shadow-sm"
                >
                  1:1
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm leading-normal">
                    {activeLesson.discipline || "Music Lesson"}
                  </h3>
                  <p className="text-xs text-neutral-500 font-semibold mt-0.5">
                    with {activeLesson.title}
                  </p>
                </div>
              </div>

              {/* Popup Details */}
              <div className="space-y-3 border-t border-b border-neutral-100 py-3.5 mb-4 text-xs font-semibold text-neutral-700">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span>
                    {new Date(activeLesson.start).toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    , {formatEventTime(activeLesson.start)} - {formatEventTime(activeLesson.end)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <span>
                    {activeLesson.locationName}
                    {activeLesson.roomName ? ` · ${activeLesson.roomName}` : ""}
                  </span>
                </div>
              </div>

              {/* Popup Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  Assignment
                </span>
                <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  Homework
                </span>
              </div>

              {/* Attendance Progress bar section */}
              <div className="mb-5 bg-neutral-50 p-3 rounded-xl border border-neutral-150">
                <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 mb-1.5">
                  <span className="text-teal-600">{activeLesson.presentCount} present</span>
                  <span className="text-rose-500">{activeLesson.absentCount} absent</span>
                </div>
                {/* Attendance ratio visualizer */}
                {activeLesson.presentCount + activeLesson.absentCount > 0 ? (
                  <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-neutral-200">
                    <div
                      style={{
                        width: `${
                          (activeLesson.presentCount /
                            (activeLesson.presentCount + activeLesson.absentCount)) *
                          100
                        }%`,
                      }}
                      className="bg-teal-500 h-full"
                    />
                    <div className="bg-rose-400 flex-1 h-full" />
                  </div>
                ) : (
                  <div className="h-1.5 w-full rounded-full bg-teal-500" />
                )}
              </div>

              {/* Action Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveLesson(null);
                    router.push(`/dashboard/lessons`);
                  }}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 hover:underline"
                >
                  View class report <span className="font-normal">&gt;</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
