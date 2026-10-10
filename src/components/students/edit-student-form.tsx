"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { updateStudent } from "@/lib/students/actions";

type Initial = {
  studentId: string;
  admissionNumber: string;
  fullName: string;
  gender: "" | "MALE" | "FEMALE";
  dateOfBirth: string;
  status: "ACTIVE" | "INACTIVE" | "WITHDRAWN" | "GRADUATED";
};

/** Form Teachers edit name, gender and date of birth. Admins can also change the admission number and status. */
export function EditStudentForm({ initial, isAdmin }: { initial: Initial; isAdmin: boolean }) {
  const [v, setV] = useState(initial);
  const { run, pending, error, fieldErrors, success } = useAction(updateStudent);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run({
          studentId: v.studentId,
          fullName: v.fullName,
          gender: v.gender,
          dateOfBirth: v.dateOfBirth,
          ...(isAdmin
            ? { admissionNumber: v.admissionNumber, status: v.status === "GRADUATED" ? undefined : v.status }
            : {}),
        });
      }}
      className="grid gap-4 sm:max-w-2xl sm:grid-cols-2"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="e-adm">Admission number</Label>
        <Input id="e-adm" value={v.admissionNumber} onChange={(e) => setV({ ...v, admissionNumber: e.target.value })} disabled={!isAdmin} />
        {!isAdmin && <p className="text-xs text-muted-foreground">Only an Admin can change this.</p>}
        <FieldError messages={fieldErrors.admissionNumber} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="e-name">Full name</Label>
        <Input id="e-name" value={v.fullName} onChange={(e) => setV({ ...v, fullName: e.target.value })} required />
        <FieldError messages={fieldErrors.fullName} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="e-gender">Gender</Label>
        <Select id="e-gender" value={v.gender} onChange={(e) => setV({ ...v, gender: e.target.value as Initial["gender"] })}>
          <option value="">Not set</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="e-dob">Date of birth</Label>
        <Input id="e-dob" type="date" value={v.dateOfBirth} onChange={(e) => setV({ ...v, dateOfBirth: e.target.value })} />
        <FieldError messages={fieldErrors.dateOfBirth} />
      </div>
      {isAdmin && v.status !== "GRADUATED" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="e-status">Status</Label>
          <Select id="e-status" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as Initial["status"] })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </Select>
        </div>
      )}
      <div className="flex flex-col items-start gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending || !v.fullName}>{pending ? "Saving…" : "Save changes"}</Button>
        <FormMessage error={error} success={success ? "Changes saved." : null} />
      </div>
    </form>
  );
}
