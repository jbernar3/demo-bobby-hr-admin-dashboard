"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { employeeById, employees, fullName } from "@/data/employees";
import { fmtShort } from "@/lib/dates";
import { cn, plural } from "@/lib/format";
import { employeeFlags, hasOpenFlags } from "@/lib/flags";
import { type DemoState, useDemoState } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { PageHeader, Segmented } from "../ui";
import { EmployeeDrawer } from "./EmployeeDrawer";
import { medicalLabel } from "./labels";
import { FilterMenu } from "./FilterMenu";

type SortKey = "name" | "title" | "department" | "state" | "type" | "medical" | "dental" | "vision" | "status" | "flags";

function sortValue(e: Employee, key: SortKey): string {
  switch (key) {
    case "name":
    case "flags":
      return `${e.lastName} ${e.firstName}`;
    case "medical":
      return medicalLabel(e).text;
    case "dental":
      return e.coverage.dental ?? "~";
    case "vision":
      return e.coverage.vision ?? "~";
    default:
      return String(e[key]);
  }
}

export function EmployeesView() {
  const state = useDemoState();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const selected = employeeById[params.get("id") ?? ""] ?? null;

  const [query, setQuery] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [depts, setDepts] = useState<string[]>([]);
  const [enrolled, setEnrolled] = useState<"all" | "enrolled" | "not">("all");
  const [type, setType] = useState<"all" | "Full-time" | "Part-time">("all");
  const [showTerminated, setShowTerminated] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "flags", dir: 1 });

  const base = employees.filter((e) => showTerminated || e.status === "Active");
  const countBy = (k: (e: Employee) => string) =>
    base.reduce<Record<string, number>>((m, e) => ((m[k(e)] = (m[k(e)] ?? 0) + 1), m), {});
  const stateCounts = countBy((e) => e.state);
  const deptCounts = countBy((e) => e.department);

  const q = query.trim().toLowerCase();
  const rows = base
      .filter((e) => !q || `${fullName(e)} ${e.title} ${e.city} ${e.email}`.toLowerCase().includes(q))
      .filter((e) => states.length === 0 || states.includes(e.state))
      .filter((e) => depts.length === 0 || depts.includes(e.department))
      .filter((e) => enrolled === "all" || (enrolled === "enrolled" ? !!e.coverage.medical : !e.coverage.medical))
      .filter((e) => type === "all" || e.type === type)
    .sort((a, b) => {
      // Default view: urgent flags first, then other open flags, then everyone else.
      if (sort.key === "flags") {
        const rank = (e: Employee) => {
          const open = employeeFlags(e, state.done).filter((f) => !f.resolved);
          return open.some((f) => f.urgent) ? 0 : open.length ? 1 : 2;
        };
        const d = rank(a) - rank(b);
        if (d) return d;
      }
      return sortValue(a, sort.key).localeCompare(sortValue(b, sort.key)) * sort.dir;
    });

  const open = (id: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (id) q.set("id", id);
    else q.delete("id");
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const active = employees.filter((e) => e.status === "Active");
  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: "name", label: "Name" },
    { key: "title", label: "Title" },
    { key: "department", label: "Department" },
    { key: "state", label: "State" },
    { key: "type", label: "Type" },
    { key: "medical", label: "Medical" },
    { key: "dental", label: "Dental" },
    { key: "vision", label: "Vision" },
    { key: "status", label: "Employment Status" },
  ];
  const filtersOn = query || states.length || depts.length || enrolled !== "all" || type !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Employees"
        title={
          <>
            <span className="num tracking-[-0.07em]">{active.length}</span> people.
          </>
        }
        sub={`${active.filter((e) => e.type === "Full-time").length} full-time, ${active.filter((e) => e.type === "Part-time").length} part-time across ${new Set(active.map((e) => e.state)).size} states. ${active.filter((e) => e.coverage.medical).length} enrolled in medical.`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative mr-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden />
          <label htmlFor="emp-search" className="sr-only">Search employees</label>
          <input
            id="emp-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, title, city…"
            className="h-8 w-[240px] rounded-[4px] border border-neutral-300 pl-8 pr-3 text-[13.5px] outline-none focus:border-ink"
          />
        </div>
        <FilterMenu
          label="State"
          options={Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ value: v, label: v, count: n }))}
          selected={states}
          onChange={setStates}
        />
        <FilterMenu
          label="Department"
          options={Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ value: v, label: v, count: n }))}
          selected={depts}
          onChange={setDepts}
        />
        <Segmented
          label="Medical enrollment"
          value={enrolled}
          onChange={setEnrolled}
          options={[
            { value: "all", label: "All" },
            { value: "enrolled", label: "Enrolled" },
            { value: "not", label: "Waived / not enrolled" },
          ]}
        />
        <Segmented
          label="Employment type"
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "All" },
            { value: "Full-time", label: "Full-time" },
            { value: "Part-time", label: "Part-time" },
          ]}
        />
        <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-[13px] text-neutral-600">
          <input type="checkbox" checked={showTerminated} onChange={(e) => setShowTerminated(e.target.checked)} className="size-4 accent-black" />
          Show terminated
        </label>
      </div>

      <p className="num mb-2 text-[12px] text-neutral-500" aria-live="polite">
        {plural(rows.length, "result")}
        {filtersOn ? (
          <>
            {" · "}
            <button
              type="button"
              className="font-sans font-semibold text-ink underline underline-offset-2"
              onClick={() => {
                setQuery("");
                setStates([]);
                setDepts([]);
                setEnrolled("all");
                setType("all");
              }}
            >
              Clear filters
            </button>
          </>
        ) : null}
      </p>

      <div className="scroll-thin overflow-x-auto border-t border-ink">
        <table className="w-full min-w-[1080px] text-[13.5px]">
          <thead>
            <tr className="border-b border-neutral-200">
              {columns.map((c) => {
                const activeSort = sort.key === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={activeSort ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="py-2 pr-3 text-left">
                    <button
                      type="button"
                      onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? ((s.dir * -1) as 1 | -1) : 1 }))}
                      className={cn("inline-flex items-center gap-1 text-[12px] font-semibold", activeSort ? "text-ink" : "text-neutral-500 hover:text-ink")}
                    >
                      {c.label}
                      {activeSort ? (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />) : <ArrowUpDown className="size-3 opacity-40" aria-hidden />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const med = medicalLabel(e);
              const flagged = hasOpenFlags(e, state.done);
              return (
                <tr
                  key={e.id}
                  onClick={() => open(e.id)}
                  className={cn("cursor-pointer border-b border-neutral-100 hover:bg-neutral-50", selected?.id === e.id && "bg-neutral-100")}
                >
                  <td className="py-2.5 pr-3">
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        open(e.id);
                      }}
                      className="inline-flex items-center gap-2 text-left font-semibold hover:underline"
                    >
                      {fullName(e)}
                      {flagged && <FlagBadge employee={e} done={state.done} />}
                    </button>
                  </td>
                  <td className="py-2.5 pr-3 text-neutral-700">{e.title}</td>
                  <td className="py-2.5 pr-3 text-neutral-700">{e.department}</td>
                  <td className="num py-2.5 pr-3">{e.state}</td>
                  <td className="py-2.5 pr-3">{e.type === "Full-time" ? "FT" : "PT"}</td>
                  <td className={cn("py-2.5 pr-3", med.muted ? "text-neutral-500" : "num")}>{med.text}</td>
                  <td className={cn("num py-2.5 pr-3", !e.coverage.dental && "text-neutral-400")}>{e.coverage.dental ?? "—"}</td>
                  <td className={cn("num py-2.5 pr-3", !e.coverage.vision && "text-neutral-400")}>{e.coverage.vision ?? "—"}</td>
                  <td className="py-2.5 pr-3">
                    {e.status === "Active" ? <span>Active</span> : <span className="text-neutral-500">Terminated {fmtShort(e.terminationDate!)}</span>}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-neutral-500">
                  No one matches these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EmployeeDrawer employee={selected} onClose={() => open(null)} />
    </div>
  );
}

function FlagBadge({ employee, done }: { employee: Employee; done: DemoState["done"] }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const flags = employeeFlags(employee, done).filter((f) => !f.resolved);
  const urgent = flags.some((f) => f.urgent);
  return (
    <span
      className={cn(
        "inline-flex size-[18px] items-center justify-center rounded-[3px] text-[10px] font-black",
        urgent ? "bg-signal text-paper" : "bg-amber-400 text-ink",
      )}
      onMouseEnter={(ev) => {
        const r = ev.currentTarget.getBoundingClientRect();
        setPos({ x: r.left, y: r.bottom + 6 });
      }}
      onMouseLeave={() => setPos(null)}
    >
      B<span className="sr-only">: Bobby flag</span>
      {pos && (
        <span
          role="tooltip"
          style={{ left: Math.min(pos.x, window.innerWidth - 316), top: pos.y }}
          className={cn("pointer-events-none fixed z-50 w-[300px] rounded-[6px] border-2 bg-paper p-3.5 text-left font-normal normal-case text-ink shadow-[4px_4px_0_0_#000]", urgent ? "border-signal" : "border-amber-400")}
        >
          <span className={cn("mb-2 block text-[11px] font-bold uppercase tracking-[0.12em]", urgent ? "text-signal-ink" : "text-amber-700")}>{urgent ? "Needs attention" : "Bobby flags"}</span>
          <span className="block space-y-2.5">
            {flags.map((f) => (
              <span key={f.id} className="block">
                <span className="block text-[13px] font-semibold leading-snug">{f.text}</span>
                {f.detail && <span className="block text-[12px] font-normal leading-snug text-neutral-600">{f.detail}</span>}
              </span>
            ))}
          </span>
        </span>
      )}
    </span>
  );
}
