import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ageInYears } from "@/lib/age";

export type SearchResults = {
  students: { id: string; name: string; age: number | null; school: string | null; payers: string[] }[];
  payers: { id: string; name: string; phone: string | null; pupils: string[]; isEmergencyContactOnly: boolean }[];
  schools: { id: string; name: string; enrolledCount: number }[];
};

/**
 * Cross-entity search. `scope=payers` narrows to just payers (used by the new-student wizard's
 * search-before-create typeahead). Partial/case-insensitive name match; a name that coincidentally
 * hits a Payer AND an unrelated Student surfaces both — a name match never implies a family link
 * (only StudentPayerLink does), so the two are returned in separate groups, never merged.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const teacherId = session.user.id;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const scope = searchParams.get("scope");

  if (q.length < 2) {
    return NextResponse.json({ students: [], payers: [], schools: [] } satisfies SearchResults);
  }

  const insensitive = { contains: q, mode: "insensitive" as const };

  const [students, payers, schools] = await Promise.all([
    scope === "payers"
      ? Promise.resolve([])
      : prisma.student.findMany({
          where: { teacherId, name: insensitive },
          include: { school: true, payerLinks: { include: { payer: true } } },
          orderBy: { name: "asc" },
          take: 8,
        }),
    prisma.payer.findMany({
      where: {
        teacherId,
        OR: [{ name: insensitive }, { phone: insensitive }, { email: insensitive }],
      },
      include: { studentLinks: { include: { student: true } } },
      orderBy: { name: "asc" },
      take: 8,
    }),
    scope === "payers"
      ? Promise.resolve([])
      : prisma.school.findMany({
          where: { name: insensitive, teacherLinks: { some: { teacherId } } },
          include: { _count: { select: { students: true } } },
          orderBy: { name: "asc" },
          take: 8,
        }),
  ]);

  const results: SearchResults = {
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      age: s.dob ? ageInYears(s.dob) : null,
      school: s.school?.name ?? null,
      payers: s.payerLinks.map((l) => l.payer.name),
    })),
    payers: payers.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.phone,
      pupils: p.studentLinks.map((l) => l.student.name),
      isEmergencyContactOnly: p.isEmergencyContactOnly,
    })),
    schools: schools.map((sc) => ({ id: sc.id, name: sc.name, enrolledCount: sc._count.students })),
  };

  return NextResponse.json(results);
}
