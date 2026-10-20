import type { Metadata } from "next";
import { EnrollmentView } from "@/components/enrollment/EnrollmentView";

export const metadata: Metadata = { title: "Enrollment" };

export default function EnrollmentPage() {
  return <EnrollmentView />;
}
