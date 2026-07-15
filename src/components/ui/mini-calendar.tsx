"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  selectedDateStr: string;
}

export function MiniCalendar({ selectedDateStr }: MiniCalendarProps) {
  const router = useRouter();
  const selectedDate = new Date(selectedDateStr);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get total days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Get start day index of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Shift so 0 = Mon, ..., 5 = Sat, 6 = Sun
  const firstDayRaw = new Date(year, month, 1).getDay();
  const startDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  // Previous month trailing days
  const prevMonthDays = new Date(year, month, 0).getDate();

  const daysGrid: { day: number; isCurrentMonth: boolean; date: Date }[] = [];

  // Fill in previous month days
  for (let i = startDayOffset - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    daysGrid.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d)
    });
  }

  // Fill in current month days
  for (let d = 1; d <= daysInMonth; d++) {
    daysGrid.push({
      day: d,
      isCurrentMonth: true,
      date: new Date(year, month, d)
    });
  }

  // Fill in next month leading days to complete grid rows
  const remaining = 42 - daysGrid.length; // 6 rows of 7 days
  for (let d = 1; d <= remaining; d++) {
    daysGrid.push({
      day: d,
      isCurrentMonth: false,
      date: new Date(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d)
    });
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Helper to check if date falls in the same calendar week as selectedDate (Mon-Sun week)
  const isSameWeek = (date: Date, targetDate: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const t = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    // Get Monday of week for d
    const dDay = d.getDay();
    const dDistToMon = dDay === 0 ? -6 : 1 - dDay;
    const dMon = new Date(d.getTime() + dDistToMon * 24 * 3600 * 1000);
    
    // Get Monday of week for t
    const tDay = t.getDay();
    const tDistToMon = tDay === 0 ? -6 : 1 - tDay;
    const tMon = new Date(t.getTime() + tDistToMon * 24 * 3600 * 1000);

    return dMon.getTime() === tMon.getTime();
  };

  // Break array into chunks of 7
  const weeks: typeof daysGrid[] = [];
  for (let i = 0; i < daysGrid.length; i += 7) {
    weeks.push(daysGrid.slice(i, i + 7));
  }

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const onDateChange = (date: Date) => {
    // Correct timezone shift issues when saving date string
    const offset = date.getTimezoneOffset();
    const correctedDate = new Date(date.getTime() - offset * 60 * 1000);
    const formatted = correctedDate.toISOString().split("T")[0];
    router.push(`/dashboard?date=${formatted}`);
  };

  return (
    <div className="surface-card p-4">
      {/* Calendar Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-bold text-neutral-800">
          {monthNames[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Headings */}
      <div className="grid grid-cols-7 gap-y-2 mb-2 text-center text-xs font-semibold text-neutral-400">
        {weekdays.map((day) => (
          <div key={day}>{day[0]}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="space-y-1 relative">
        {weeks.map((week, wIdx) => {
          // Check if any day in the week is the selected week
          const hasSelectedWeek = week.some((dayInfo) => isSameWeek(dayInfo.date, selectedDate));
          
          return (
            <div key={wIdx} className="grid grid-cols-7 relative">
              {/* Shaded week strip */}
              {hasSelectedWeek && (
                <div className="absolute inset-0 bg-brand-50/70 rounded-lg pointer-events-none" />
              )}
              
              {week.map((dayInfo, dIdx) => {
                const active = isSameDay(dayInfo.date, selectedDate);
                
                return (
                  <div
                    key={dIdx}
                    className="relative flex justify-center py-1 z-10"
                  >
                    <button
                      type="button"
                      onClick={() => onDateChange(dayInfo.date)}
                      className={`h-7 w-7 flex items-center justify-center rounded-full text-[11px] transition-all font-semibold ${
                        active
                          ? "bg-brand-600 text-white shadow-sm"
                          : dayInfo.isCurrentMonth
                          ? "text-neutral-700 hover:bg-neutral-200/50"
                          : "text-neutral-350 hover:bg-neutral-100"
                      }`}
                    >
                      {dayInfo.day}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
