"use client";
import { ActionForm, SubmitButton, fieldError } from "@/components/forms";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { addLesson, addModule, addQuizQuestion, saveCourse } from "@/actions/admin";
import { COURSE_CATEGORIES, COURSE_LEVELS } from "@/lib/constants";

type Course = { id: string; title: string; summary: string | null; description: string | null; category: string; level: string; duration_minutes: number | null; instructor: string | null; pass_score: number; is_premium: boolean; is_published: boolean };

export function CourseForm({ course }: { course?: Course }) {
  return (
    <ActionForm action={saveCourse} resetOnSuccess={!course}>
      {(s) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {course && <input type="hidden" name="id" value={course.id} />}
          <Field label="Titre" htmlFor="c-title" error={fieldError(s, "title")}><Input id="c-title" name="title" defaultValue={course?.title} required /></Field>
          <Field label="Formateur" htmlFor="c-inst"><Input id="c-inst" name="instructor" defaultValue={course?.instructor ?? ""} /></Field>
          <Field label="Catégorie" htmlFor="c-cat"><Select id="c-cat" name="category" defaultValue={course?.category}>{COURSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
          <Field label="Niveau" htmlFor="c-lvl"><Select id="c-lvl" name="level" defaultValue={course?.level}>{COURSE_LEVELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
          <Field label="Durée (min)" htmlFor="c-dur"><Input id="c-dur" name="duration_minutes" inputMode="numeric" defaultValue={course?.duration_minutes ?? ""} /></Field>
          <Field label="Score de réussite (%)" htmlFor="c-pass"><Input id="c-pass" name="pass_score" inputMode="numeric" defaultValue={course?.pass_score ?? 70} /></Field>
          <Field label="Résumé" htmlFor="c-sum" className="sm:col-span-2"><Input id="c-sum" name="summary" defaultValue={course?.summary ?? ""} /></Field>
          <Field label="Description" htmlFor="c-desc" className="sm:col-span-2"><Textarea id="c-desc" name="description" defaultValue={course?.description ?? ""} /></Field>
          <div className="flex gap-4 sm:col-span-2"><Checkbox name="is_premium" label="Premium" defaultChecked={course?.is_premium} /><Checkbox name="is_published" label="Publiée" defaultChecked={course?.is_published} /></div>
          <div className="sm:col-span-2"><SubmitButton>{course ? "Enregistrer" : "Créer la formation"}</SubmitButton></div>
        </div>
      )}
    </ActionForm>
  );
}

export function ModuleForm({ courseId, next }: { courseId: string; next: number }) {
  return (
    <ActionForm action={addModule} resetOnSuccess>
      <div className="flex gap-2"><input type="hidden" name="course_id" value={courseId} /><input type="hidden" name="position" value={next} /><Input name="title" placeholder="Titre du nouveau module" required aria-label="Titre du module" /><SubmitButton size="sm" variant="secondary">+ Module</SubmitButton></div>
    </ActionForm>
  );
}

export function LessonForm({ moduleId, next }: { moduleId: string; next: number }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-semibold text-brand-700">+ Ajouter une leçon</summary>
      <ActionForm action={addLesson} resetOnSuccess className="mt-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="module_id" value={moduleId} /><input type="hidden" name="position" value={next} />
          <Input name="title" placeholder="Titre" required aria-label="Titre de la leçon" />
          <Input name="duration_minutes" placeholder="Durée (min)" inputMode="numeric" aria-label="Durée" />
          <Input name="video_url" type="url" placeholder="Lien vidéo (YouTube, Vimeo)" aria-label="Vidéo" />
          <Input name="pdf_url" type="url" placeholder="Lien du support PDF" aria-label="PDF" />
          <Textarea name="content" placeholder="Contenu (Markdown simple)" rows={5} className="sm:col-span-2" aria-label="Contenu" />
          <SubmitButton size="sm" className="sm:col-span-2">Ajouter la leçon</SubmitButton>
        </div>
      </ActionForm>
    </details>
  );
}

export function QuestionForm({ courseId }: { courseId: string }) {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-semibold text-brand-700">+ Ajouter une question</summary>
      <ActionForm action={addQuizQuestion} resetOnSuccess className="mt-2">
        <div className="grid gap-2">
          <input type="hidden" name="course_id" value={courseId} />
          <Input name="question" placeholder="Question" required aria-label="Question" />
          <Textarea name="options" placeholder={"Une option par ligne (2 à 6)"} rows={4} required aria-label="Options" />
          <Input name="correct_index" placeholder="N° de la bonne réponse (0 = première)" inputMode="numeric" required aria-label="Bonne réponse" />
          <SubmitButton size="sm">Ajouter la question</SubmitButton>
        </div>
      </ActionForm>
    </details>
  );
}
