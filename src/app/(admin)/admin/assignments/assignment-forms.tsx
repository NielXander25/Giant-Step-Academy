"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/shared/form-message";
import { ActionButton } from "@/components/shared/action-button";
import { useAction } from "@/lib/use-action";
import { addClassSubject, assignFormTeacher, assignSubjectTeacher, clearFormTeacher, clearSubjectTeacher, removeClassSubject } from "./actions";

type Option = { id: string; label: string };

export function FormTeacherPicker({ classId, teachers, currentId }: { classId: string; teachers: Option[]; currentId: string | null }) {
  const [teacherId, setTeacherId] = useState(currentId ?? "");
  const { run, pending, error } = useAction(assignFormTeacher);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Form Teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="sm:max-w-xs">
          <option value="">Choose a teacher…</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
        <Button type="button" disabled={pending || !teacherId || teacherId === currentId} onClick={() => run({ classId, teacherId })}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {currentId && <ActionButton action={clearFormTeacher} input={{ classId }} label="Remove" confirm="Remove the Form Teacher from this class?" />}
      </div>
      <FormMessage error={error} />
    </div>
  );
}

export function SubjectTeacherPicker({ classId, subjectId, teachers, currentId }: { classId: string; subjectId: string; teachers: Option[]; currentId: string | null }) {
  const [teacherId, setTeacherId] = useState(currentId ?? "");
  const { run, pending, error } = useAction(assignSubjectTeacher);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Subject teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-9 min-w-44">
          <option value="">Unassigned</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
        <Button type="button" size="sm" disabled={pending || !teacherId || teacherId === currentId} onClick={() => run({ classId, subjectId, teacherId })}>Save</Button>
        {currentId && <ActionButton action={clearSubjectTeacher} input={{ classId, subjectId }} label="Clear" />}
      </div>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function AddSubjectToClass({ classId, subjects }: { classId: string; subjects: Option[] }) {
  const [subjectId, setSubjectId] = useState("");
  const { run, pending, error } = useAction(addClassSubject, { onSuccess: () => setSubjectId("") });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select aria-label="Subject to add" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="sm:max-w-xs">
          <option value="">Choose a subject…</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
        <Button type="button" disabled={pending || !subjectId} onClick={() => run({ classId, subjectId })}>Add to class</Button>
      </div>
      <FormMessage error={error} />
    </div>
  );
}

export function RemoveSubjectButton({ classId, subjectId, name }: { classId: string; subjectId: string; name: string }) {
  return (
    <ActionButton action={removeClassSubject} input={{ classId, subjectId }} label="Remove" confirm={`Remove ${name} from this class? Its teacher assignment is removed too.`} />
  );
}
