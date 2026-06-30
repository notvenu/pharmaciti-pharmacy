"use client";

import { useState } from "react";
import {
  Stethoscope,
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { formatRupees, formatShortDate } from "@/lib/format";
import {
  WEEKDAYS,
  todayISO,
  SLOT_LENGTH_OPTIONS,
  type TimeRange,
} from "@/lib/appointments";
import { genId, useAdmin } from "@/lib/admin/store";
import type {
  Appointment,
  AppointmentStatus,
  Doctor,
} from "@/lib/admin/types";
import {
  Button,
  ConfirmDialog,
  Drawer,
  EmptyState,
  Field,
  PageHeader,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./ui";

type Tab = "doctors" | "appointments";

const APPT_STATUS: { value: AppointmentStatus; label: string; tone: string }[] = [
  { value: "booked", label: "Booked", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
  { value: "completed", label: "Completed", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  { value: "cancelled", label: "Cancelled", tone: "bg-rose-50 text-rose-700 ring-rose-200" },
];

const emptyDoctor = (): Doctor => ({
  id: genId("dr"),
  name: "",
  specialization: "",
  qualification: "",
  experienceYears: 0,
  fee: 0,
  bio: "",
  active: true,
  availability: {},
  slotMinutes: 30,
  blockedDates: [],
});

const DEFAULT_RANGES: TimeRange[] = [
  { start: "10:00", end: "13:00" },
  { start: "17:00", end: "19:30" },
];
const rangesEq = (a: TimeRange[], b: TimeRange[]) =>
  JSON.stringify(a) === JSON.stringify(b);

export function DoctorsAdmin() {
  const {
    data,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    updateAppointmentStatus,
  } = useAdmin();
  const [tab, setTab] = useState<Tab>("doctors");
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [toDelete, setToDelete] = useState<Doctor | null>(null);

  function openNew() {
    setEditing(emptyDoctor());
    setIsNew(true);
  }
  function openEdit(d: Doctor) {
    setEditing(d);
    setIsNew(false);
  }

  async function save(d: Doctor) {
    if (isNew) await addDoctor(d);
    else await updateDoctor(d.id, d);
    setEditing(null);
  }

  const TABS: { key: Tab; label: string; icon: LucideIcon; count: number }[] = [
    { key: "doctors", label: "Doctors", icon: Stethoscope, count: data.doctors.length },
    {
      key: "appointments",
      label: "Appointments",
      icon: CalendarDays,
      count: data.appointments.length,
    },
  ];

  return (
    <>
      <PageHeader
        title="Doctors & Appointments"
        subtitle="Manage your panel of doctors and review bookings."
        action={
          tab === "doctors" ? (
            <Button onClick={openNew} className="!px-3 !py-2 text-[13px]">
              <Plus className="h-4 w-4" /> Add doctor
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex gap-2">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition ${
              tab === key
                ? "bg-sea-500 text-white shadow-soft"
                : "border border-hairline bg-white text-ink-soft hover:bg-sea-50/60"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span
              className={`rounded-full px-1.5 text-[11px] ${
                tab === key ? "bg-white/25 text-white" : "bg-hairline/70 text-muted"
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {tab === "doctors" ? (
        data.doctors.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="No doctors yet"
            message="Add a doctor so customers can book appointments."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {data.doctors.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-3 rounded-2xl border border-hairline bg-white p-4 shadow-card"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sea-50 text-sea-600">
                  <Stethoscope className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-ink">
                      {d.name || "Unnamed"}
                    </span>
                    {!d.active && (
                      <span className="shrink-0 rounded-full bg-hairline/70 px-2 py-0.5 text-[10px] font-bold text-muted">
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-semibold text-sea-600">
                    {d.specialization}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {d.qualification} · {d.experienceYears} yrs ·{" "}
                    {formatRupees(d.fee)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(d)}
                    aria-label="Edit"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-ink-soft hover:bg-sea-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(d)}
                    aria-label="Delete"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-hairline text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : data.appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments yet"
          message="Bookings made by customers will appear here."
        />
      ) : (
        <div className="space-y-3">
          {data.appointments.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              onStatus={(s) => updateAppointmentStatus(a.id, s)}
            />
          ))}
        </div>
      )}

      {/* Add / edit doctor */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={isNew ? "Add doctor" : "Edit doctor"}
      >
        {editing && (
          <DoctorForm
            key={editing.id}
            initial={editing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
        )}
      </Drawer>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete doctor?"
        message={`"${toDelete?.name}" will be removed. Existing appointments stay but lose their link.`}
        onConfirm={() => toDelete && deleteDoctor(toDelete.id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function AppointmentRow({
  appt,
  onStatus,
}: {
  appt: Appointment;
  onStatus: (s: AppointmentStatus) => void;
}) {
  const tone =
    APPT_STATUS.find((s) => s.value === appt.status)?.tone ??
    "bg-hairline/70 text-muted";
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-hairline bg-white p-4 shadow-card">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-ink">
            {appt.patientName || "Patient"}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${tone}`}
          >
            {appt.status}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted">
          {appt.doctorName} · {formatShortDate(appt.slotDate)} · {appt.slotTime}
          {appt.phone ? ` · ${appt.phone}` : ""}
        </p>
      </div>
      <Select
        value={appt.status}
        onChange={(e) => onStatus(e.target.value as AppointmentStatus)}
        className="!w-auto"
      >
        {APPT_STATUS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function buildDayRanges(av: Record<string, TimeRange[]>) {
  const configured = Object.keys(av).length > 0;
  const days: Record<string, TimeRange[]> = {};
  for (let i = 0; i < 7; i++) {
    days[String(i)] = av[String(i)] ?? (configured ? [] : [...DEFAULT_RANGES]);
  }
  return days;
}

function DoctorForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Doctor;
  onSave: (d: Doctor) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Doctor>(initial);
  const set = <K extends keyof Doctor>(k: K, v: Doctor[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  // Availability editor state, seeded from the doctor's saved schedule.
  const initDays = buildDayRanges(initial.availability ?? {});
  const allSame = [0, 1, 2, 3, 4, 5, 6].every((i) =>
    rangesEq(initDays[String(i)], initDays["0"]),
  );
  const [mode, setMode] = useState<"same" | "perday">(
    allSame ? "same" : "perday",
  );
  const [sameRanges, setSameRanges] = useState<TimeRange[]>(initDays["0"]);
  const [dayRanges, setDayRanges] =
    useState<Record<string, TimeRange[]>>(initDays);
  const [slotMinutes, setSlotMinutes] = useState<number>(
    initial.slotMinutes || 30,
  );
  const [blocked, setBlocked] = useState<string[]>(initial.blockedDates ?? []);
  const [blockDate, setBlockDate] = useState(todayISO());

  function save() {
    const availability: Record<string, TimeRange[]> = {};
    for (let i = 0; i < 7; i++) {
      availability[String(i)] =
        mode === "same" ? sameRanges : dayRanges[String(i)];
    }
    onSave({ ...d, availability, slotMinutes, blockedDates: blocked });
  }

  function addBlocked() {
    if (blockDate && !blocked.includes(blockDate)) {
      setBlocked((b) => [...b, blockDate].sort());
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Name">
        <TextInput
          value={d.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Dr. Anjali Mehta"
        />
      </Field>
      <Field label="Specialization">
        <TextInput
          value={d.specialization}
          onChange={(e) => set("specialization", e.target.value)}
          placeholder="General Physician"
        />
      </Field>
      <Field label="Qualification">
        <TextInput
          value={d.qualification}
          onChange={(e) => set("qualification", e.target.value)}
          placeholder="MBBS, MD"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Experience (yrs)">
          <TextInput
            type="number"
            min={0}
            value={d.experienceYears}
            onChange={(e) => set("experienceYears", Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Consultation fee (₹)">
          <TextInput
            type="number"
            min={0}
            value={d.fee}
            onChange={(e) => set("fee", Number(e.target.value) || 0)}
          />
        </Field>
      </div>
      <Field label="Bio">
        <TextArea
          rows={3}
          value={d.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Short description shown to customers."
        />
      </Field>

      {/* ── Availability ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-hairline bg-sea-50/20 p-3.5">
        <h3 className="text-[13px] font-extrabold text-ink">Available timings</h3>
        <p className="mt-0.5 text-[12px] text-muted">
          Set the exact hours this doctor works. Customers book a slot inside
          these windows.
        </p>

        <div className="mt-3">
          <Field label="Appointment length">
            <Select
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
            >
              {SLOT_LENGTH_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-3 flex gap-2">
          {(["same", "perday"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl border py-2 text-[12px] font-bold transition ${
                mode === m
                  ? "border-sea-500 bg-sea-50 text-sea-600"
                  : "border-hairline text-ink-soft hover:bg-sea-50/40"
              }`}
            >
              {m === "same" ? "Same every day" : "Different per day"}
            </button>
          ))}
        </div>

        {mode === "same" ? (
          <div className="mt-3">
            <RangeEditor ranges={sameRanges} onChange={setSameRanges} />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {WEEKDAYS.map((label, i) => (
              <div key={i}>
                <p className="mb-1 text-[12px] font-bold text-ink">{label}</p>
                <RangeEditor
                  ranges={dayRanges[String(i)]}
                  onChange={(next) =>
                    setDayRanges((cur) => ({ ...cur, [String(i)]: next }))
                  }
                />
              </div>
            ))}
            <p className="text-[11px] text-muted">
              Leave a day with no ranges to close it (e.g. weekly off).
            </p>
          </div>
        )}
      </div>

      {/* ── Blocked dates ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-hairline p-3.5">
        <h3 className="text-[13px] font-extrabold text-ink">Block specific days</h3>
        <p className="mt-0.5 text-[12px] text-muted">
          Holidays or leave — no bookings on these dates.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="date"
            value={blockDate}
            min={todayISO()}
            onChange={(e) => setBlockDate(e.target.value)}
            className="flex-1 rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
          />
          <Button variant="secondary" onClick={addBlocked} className="!px-3">
            Block
          </Button>
        </div>
        {blocked.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {blocked.map((dt) => (
              <span
                key={dt}
                className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700"
              >
                {formatShortDate(dt)}
                <button
                  type="button"
                  onClick={() => setBlocked((b) => b.filter((x) => x !== dt))}
                  aria-label="Remove"
                  className="text-rose-500 hover:text-rose-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <Toggle
        checked={d.active}
        onChange={(v) => set("active", v)}
        label="Visible to customers"
      />

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={save} disabled={!d.name.trim()}>
          Save doctor
        </Button>
      </div>
    </div>
  );
}

function RangeEditor({
  ranges,
  onChange,
}: {
  ranges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
}) {
  const update = (i: number, patch: Partial<TimeRange>) =>
    onChange(ranges.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(ranges.filter((_, idx) => idx !== i));
  const add = () => onChange([...ranges, { start: "10:00", end: "13:00" }]);

  return (
    <div className="space-y-2">
      {ranges.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="time"
            value={r.start}
            onChange={(e) => update(i, { start: e.target.value })}
            className="flex-1 rounded-lg border border-hairline bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
          />
          <span className="text-[12px] text-muted">to</span>
          <input
            type="time"
            value={r.end}
            onChange={(e) => update(i, { end: e.target.value })}
            className="flex-1 rounded-lg border border-hairline bg-white px-2 py-1.5 text-[12px] text-ink outline-none focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remove range"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-hairline text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-sea-300 px-2.5 py-1.5 text-[12px] font-bold text-sea-600 hover:bg-sea-50/60"
      >
        <Plus className="h-3.5 w-3.5" /> Add time range
      </button>
    </div>
  );
}
