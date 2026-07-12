import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { SectionForm } from "./section-form";
import { DeleteSectionButton } from "./delete-section-button";
import { PublishToggle } from "./publish-toggle";

export default async function CurriculumTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const template = await prisma.curriculumTemplate.findFirst({
    where: { id, teacherId: session!.user.id },
    include: {
      sections: { orderBy: { order: "asc" } },
      lessonType: true,
      imports: { include: { student: true }, orderBy: { startedDate: "desc" } },
    },
  });
  if (!template) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/dashboard/curriculum-templates" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to curriculum templates
        </Link>
        <div className="mt-2 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{template.title}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {template.subject ?? "No subject"}
              {template.lessonType ? ` · Suggested for ${template.lessonType.name}` : ""}
            </p>
            {template.description && <p className="mt-2 text-sm text-neutral-600">{template.description}</p>}
          </div>
          <PublishToggle templateId={template.id} isPublished={template.isPublished} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-neutral-900">Sections</h2>
        {template.sections.length === 0 ? (
          <p className="mb-3 text-sm text-neutral-500">No sections yet.</p>
        ) : (
          <ul className="mb-3 space-y-2">
            {template.sections.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-neutral-800">{s.title}</span>
                  {s.estimatedLessons && (
                    <span className="ml-2 text-xs text-neutral-500">~{s.estimatedLessons} lessons</span>
                  )}
                  {s.description && <p className="text-xs text-neutral-500">{s.description}</p>}
                </div>
                <DeleteSectionButton sectionId={s.id} templateId={template.id} />
              </li>
            ))}
          </ul>
        )}
        <SectionForm templateId={template.id} />
      </section>

      {template.imports.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-medium text-neutral-900">Students on this plan</h2>
          <ul className="space-y-1.5 text-sm">
            {template.imports.map((imp) => (
              <li key={imp.id}>
                <Link href={`/dashboard/students/${imp.studentId}`} className="text-neutral-900 hover:underline">
                  {imp.student.name}
                </Link>
                <span className="ml-2 text-xs text-neutral-500">{imp.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
