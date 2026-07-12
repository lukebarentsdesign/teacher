import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function GroupClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject: subjectFilter } = await searchParams;
  const session = await auth();

  const [groupClasses, subjects] = await Promise.all([
    prisma.groupClass.findMany({
      where: {
        teacherId: session!.user.id,
        ...(subjectFilter ? { subjectId: subjectFilter } : {}),
      },
      include: { school: true, subject: true, members: { where: { leftAt: null } } },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({ where: { teacherId: session!.user.id }, orderBy: { name: "asc" } }),
  ]);

  const groups = new Map<string, { label: string; classes: typeof groupClasses }>();
  if (!subjectFilter) {
    for (const subject of subjects) groups.set(subject.id, { label: subject.name, classes: [] });
    groups.set("untagged", { label: "Untagged", classes: [] });
    for (const gc of groupClasses) {
      const key = gc.subjectId ?? "untagged";
      groups.get(key)?.classes.push(gc);
    }
  }

  function ClassTable({ rows }: { rows: typeof groupClasses }) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Class</th>
              <th className="px-4 py-3 font-medium">School</th>
              <th className="px-4 py-3 font-medium">Slot</th>
              <th className="px-4 py-3 font-medium">Members</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((gc) => (
              <tr key={gc.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/group-classes/${gc.id}`} className="text-neutral-900 hover:underline">
                    {gc.name}
                  </Link>
                  <span className="ml-2 text-xs text-neutral-500">{gc.discipline}</span>
                </td>
                <td className="px-4 py-3 text-neutral-500">{gc.school.name}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {DAY_LABELS[gc.dayOfWeek]} {gc.startTime}–{gc.endTime}
                </td>
                <td className="px-4 py-3 text-neutral-500">{gc.members.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Group classes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Add or manage a class from its school&apos;s detail page. Tag a class with a subject there
          to group it here alongside the students who share it.
        </p>
      </div>

      {subjects.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/dashboard/group-classes"
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
              !subjectFilter ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            Grouped by subject
          </Link>
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/dashboard/group-classes?subject=${subject.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                subjectFilter === subject.id
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {subject.name}
            </Link>
          ))}
        </div>
      )}

      {groupClasses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {subjectFilter ? "No classes tagged with this subject." : "No group classes yet."}
        </p>
      ) : subjectFilter ? (
        <ClassTable rows={groupClasses} />
      ) : (
        <div className="space-y-8">
          {[...groups.entries()]
            .filter(([, group]) => group.classes.length > 0)
            .map(([key, group]) => (
              <section key={key}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  {group.label} · {group.classes.length}
                </h2>
                <ClassTable rows={group.classes} />
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
