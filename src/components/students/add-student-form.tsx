"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { addStudent } from "@/lib/students/actions";

type ClassOption = { id: string; name: string };

/** Adds one student. Pass `fixedClassId` for a Form Teacher, or `classes` to let an Admin choose. */
export function AddStudentForm({ fixedClassId, classes }: { fixedClassId?: string; classes?: ClassOption[] }) {
  const [classId, setClassId] = useState(fixedClassId ?? classes?.[0]?.id ?? "");
  const [admissionNumber, setAdmission] = useState("");
  const [fullName, setName] = useState("");
  const [gender, setGender] = useState<"" | "MALE" | "FEMALE">("");
  const [dateOfBirth, setDob] = useState("");
  const { run, pending, error, fieldErrors, success } = useAction(addStudent, {
    onSuccess: () => { setAdmission(""); setName(""); setGender(""); setDob(""); },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); run({ classId, admissionNumber, fullName, gender, dateOfBirth }); }}
      className="grid gap-4 sm:max-w-2xl sm:grid-cols-2"
    >
      {!fixedClassId && classes && (
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="add-class">Class</Label>
          <Select id="add-class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="add-adm">Admission number</Label>
        <Input id="add-adm" value={admissionNumber} onChange={(e) => setAdmission(e.target.value)} placeholder="GSA/SS2/001" required />
        <FieldError messages={fieldErrors.admissionNumber} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="add-name">Full name</Label>
        <Input id="add-name" value={fullName} onChange={(e) => setName(e.target.value)} required />
        <FieldError messages={fieldErrors.fullName} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="add-gender">Gender (optional)</Label>
        <Select id="add-gender" value={gender} onChange={(e) => setGender(e.target.value as "" | "MALE" | "FEMALE")}>
          <option value="">Not set</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="add-dob">Date of birth (optional)</Label>
        <Input id="add-dob" type="date" value={dateOfBirth} onChange={(e) => setDob(e.target.value)} />
        <FieldError messages={fieldErrors.dateOfBirth} />
      </div>
      <div className="flex flex-col items-start gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending || !classId || !admissionNumber || !fullName}>{pending ? "Adding…" : "Add student"}</Button>
        <FormMessage error={error} success={success ? "Student added." : null} />
      </div>
    </form>
  );
}
