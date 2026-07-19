import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { NewTemplateForm } from "./new-template-form";
import { hasModule } from "@/lib/modules";

export default async function CurriculumTemplatesPage() {
  const session = await auth();
  const moduleEnabled = await hasModule(session!.user.id, "CURRICULUM");

  const [templates, lessonTypes] = await Promise.all([
    prisma.curriculumTemplate.findMany({
      where: { teacherId: session!.user.id },
      include: { _count: { select: { sections: true, imports: true } }, lessonType: true },
      orderBy: { title: "asc" },
    }),
    prisma.lessonType.findMany({
      where: { teacherId: session!.user.id, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Curriculum templates</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Reusable syllabi (e.g. &quot;Flute Grade 1 — standard&quot;) built once and imported onto any
          student following that path. Importing takes an independent snapshot — editing a template
          later never changes a student already partway through.
        </p>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-neutral-500">No curriculum templates yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-100 rounded-xl bg-white shadow-sm">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <Link href={`/dashboard/curriculum-templates/${t.id}`} className="font-medium text-neutral-900 hover:underline">
                  {t.title}
                </Link>
                <p className="text-xs text-neutral-500">
                  {t.subject ?? "No subject"}
                  {t.lessonType ? ` · Suggested for ${t.lessonType.name}` : ""}
                  {!t.isPublished ? " · Draft" : ""}
                </p>
              </div>
              <span className="text-xs text-neutral-400">
                {t._count.sections} section{t._count.sections === 1 ? "" : "s"} · {t._count.imports} import
                {t._count.imports === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {moduleEnabled ? (
        <NewTemplateForm lessonTypes={lessonTypes} />
      ) : (
        <p className="text-sm text-neutral-500">
          The Curriculum &amp; content module isn&apos;t enabled on this account, so new templates
          can&apos;t be created — get in touch if you&apos;d like it switched on.
        </p>
      )}
    </div>
  );
}
