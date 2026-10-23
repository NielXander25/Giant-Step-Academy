import { DEFAULT_LAYOUT } from "@/lib/results/report-layout";
import type { PublishedResult } from "@/lib/pin/result-data";

/** Made-up report used for previews and tests. Never mixed with real data. */
export const SAMPLE_RESULT: PublishedResult = {
  school: { name: "Giant Step Academy", motto: "Securing a bright future", address: "[SCHOOL ADDRESS]", phone: "[SCHOOL PHONE]", email: null, logoUrl: null, principalName: null, isPlaceholder: true },
  layout: DEFAULT_LAYOUT,
  student: { name: "Sample Student", admissionNumber: "GSA/SAMPLE/001", gender: "FEMALE" },
  className: "SS2A",
  sessionName: "2026/2027",
  termName: "First Term",
  componentNames: [{ name: "CA", max: 40 }, { name: "Exam", max: 60 }],
  subjects: [
    { name: "English Language", scores: [32, 51], total: 83, grade: "A", remark: "Excellent" },
    { name: "Mathematics", scores: [28, 44], total: 72, grade: "A", remark: "Excellent" },
    { name: "Biology", scores: [25, 38], total: 63, grade: "B", remark: "Very good" },
  ],
  summary: { totalScore: 218, average: 72.67, overallGrade: "A", position: 3, classSize: 28, formTeacherRemark: "A hardworking student.", principalRemark: "Keep it up." },
};
