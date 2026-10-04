import { z } from "zod";

const id = z.string().uuid();

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "That password is too long.");

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export const teacherRegistrationInput = z
  .object({
    fullName: z.string().trim().min(3, "Enter your full name.").max(100),
    email,
    phone: z
      .string()
      .trim()
      .max(25)
      .regex(/^[0-9+()\-\s]*$/, "Use digits only.")
      .optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

export const approveRequestInput = z.object({ requestId: id });
export const rejectRequestInput = z.object({
  requestId: id,
  reason: z.string().trim().min(3, "Give a short reason.").max(300),
});
export const setTeacherActiveInput = z.object({ teacherId: id, active: z.boolean() });

export const createAdminInput = z.object({
  name: z.string().trim().min(3, "Enter the full name.").max(100),
  email,
  temporaryPassword: z.string().min(12, "Use at least 12 characters.").max(128),
  canCreateAdmins: z.boolean().default(false),
});
export const setAdminActiveInput = z.object({ adminId: id, active: z.boolean() });
export const setAdminGrantInput = z.object({ adminId: id, canCreateAdmins: z.boolean() });

export const onboardingInput = z.object({
  phone: z.string().trim().min(7, "Enter a phone number.").max(25).regex(/^[0-9+()\-\s]+$/, "Use digits only."),
  staffNumber: z.string().trim().max(40).optional(),
  qualification: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(600).optional(),
});

export const changePasswordInput = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });
