import { generateLessonIcs } from "@/lib/ics";

describe("generateLessonIcs", () => {
  test("produces a valid VEVENT block with the given fields", () => {
    const ics = generateLessonIcs({
      uid: "lesson-123",
      title: "Flute with Alice",
      description: "Join here: https://zoom.us/j/123",
      start: new Date(Date.UTC(2026, 0, 10, 16, 0)),
      end: new Date(Date.UTC(2026, 0, 10, 16, 45)),
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:lesson-123");
    expect(ics).toContain("DTSTART:20260110T160000Z");
    expect(ics).toContain("DTEND:20260110T164500Z");
    expect(ics).toContain("SUMMARY:Flute with Alice");
    expect(ics).toContain("DESCRIPTION:Join here: https://zoom.us/j/123");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  test("escapes commas, semicolons, and newlines in text fields", () => {
    const ics = generateLessonIcs({
      uid: "lesson-1",
      title: "Piano, Grade 2; recital",
      start: new Date(),
      end: new Date(),
    });
    expect(ics).toContain("SUMMARY:Piano\\, Grade 2\\; recital");
  });
});
