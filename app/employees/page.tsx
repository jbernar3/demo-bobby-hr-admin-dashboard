import type { Metadata } from "next";
import { Suspense } from "react";
import { EmployeesView } from "@/components/employees/EmployeesView";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeesView />
    </Suspense>
  );
}
