"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type CalendarEvent = { id: string; title: string; start: string; end: string };
type ColoredCalendarEvent = CalendarEvent & { color: string };

export function GhostCalendar({
  ghostEvents,
  proposedEvents,
  conflictEvents,
}: {
  ghostEvents: CalendarEvent[];
  proposedEvents: ColoredCalendarEvent[];
  conflictEvents: CalendarEvent[];
}) {
  const events = [
    ...ghostEvents.map((e) => ({ ...e, display: "background", backgroundColor: "#a3a3a3" })),
    ...proposedEvents.map((e) => ({ ...e, backgroundColor: e.color, borderColor: e.color })),
    ...conflictEvents.map((e) => ({ ...e, backgroundColor: "#dc2626", borderColor: "#dc2626" })),
  ];

  return (
    <div className="rounded-xl bg-white p-2 shadow-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        events={events}
        height="auto"
        editable={false}
        selectable={false}
      />
    </div>
  );
}
