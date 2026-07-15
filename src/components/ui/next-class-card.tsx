"use client";

import { MapPin } from "lucide-react";

export interface NextClassData {
  id: string;
  studentName: string;
  discipline: string;
  scheduledAt: Date;
  durationMins: number;
  locationName: string;
  roomName?: string | null;
  grade?: string;
  assignmentTitle?: string | null;
  homeworkStatus?: string | null;
}

interface NextClassCardProps {
  lesson: NextClassData | null;
  onCallRoll?: (id: string) => void;
  onViewReport?: (id: string) => void;
}

export function NextClassCard({ lesson, onCallRoll, onViewReport }: NextClassCardProps) {
  if (!lesson) {
    return (
      <div className="surface-card p-5">
        <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">Next class</p>
        <p className="text-sm text-neutral-500 py-4 text-center">No more classes scheduled for today.</p>
      </div>
    );
  }

  // Format times nicely (e.g. 03:00 pm - 04:00 pm)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  };

  const startTimeStr = formatTime(lesson.scheduledAt);
  const endTime = new Date(lesson.scheduledAt.getTime() + lesson.durationMins * 60_000);
  const endTimeStr = formatTime(endTime);

  const gradeText = lesson.grade || "1:1";
  const assignmentText = lesson.assignmentTitle || "Introduction & Setup";
  const homeworkText = lesson.homeworkStatus || "No Homework due";

  return (
    <div className="surface-card p-5 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Next class</p>
        
        {/* Class Main Row */}
        <div className="flex items-start gap-4 mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-sm border border-teal-100">
            {gradeText}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-neutral-900 text-base truncate leading-tight">
              {lesson.discipline}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1 font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              {lesson.locationName}{lesson.roomName ? ` · ${lesson.roomName}` : ""}
            </p>
          </div>
          <div className="ml-auto text-right text-xs font-semibold text-neutral-700 whitespace-nowrap bg-neutral-100 px-2 py-1 rounded-md">
            {startTimeStr} - {endTimeStr}
          </div>
        </div>

        {/* Dynamic Assignment / Homework section */}
        <div className="space-y-3.5 mb-5 border-t border-neutral-100 pt-4">
          <div>
            <div className="inline-block bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
              Assignment
            </div>
            <p className="text-xs font-semibold text-neutral-800 leading-normal pl-0.5">
              {assignmentText}
            </p>
          </div>
          
          <div>
            <div className="inline-block bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1">
              Homework
            </div>
            <p className="text-xs text-neutral-500 leading-normal pl-0.5">
              {homeworkText}
            </p>
          </div>
        </div>
      </div>

      {/* Button CTAs */}
      <div className="grid grid-cols-2 gap-3 mt-2 border-t border-neutral-100 pt-4">
        <button
          type="button"
          onClick={() => onCallRoll && onCallRoll(lesson.id)}
          className="rounded-xl border border-neutral-300 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          Call the roll
        </button>
        <button
          type="button"
          onClick={() => onViewReport && onViewReport(lesson.id)}
          className="rounded-xl bg-brand-600 hover:bg-brand-700 py-2.5 text-xs font-semibold text-white transition-colors shadow-sm"
        >
          View report
        </button>
      </div>
    </div>
  );
}
