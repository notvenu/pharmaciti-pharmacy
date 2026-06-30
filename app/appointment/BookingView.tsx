"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  GraduationCap,
  BadgeCheck,
  CalendarDays,
  Clock,
  CircleCheck,
  Loader2,
  X,
} from "lucide-react";
import { formatRupees, formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { slotsForDate, todayISO } from "@/lib/appointments";
import type { StoreDoctor } from "@/lib/data";

export function BookingView({ doctors }: { doctors: StoreDoctor[] }) {
  const [selected, setSelected] = useState<StoreDoctor | null>(null);
  const [booked, setBooked] = useState<{ doctor: string; date: string; time: string } | null>(
    null,
  );

  if (booked) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-hairline bg-white px-6 py-16 text-center shadow-card">
        <CircleCheck className="h-16 w-16 text-leaf-500" />
        <h2 className="text-xl font-extrabold text-ink">Appointment booked!</h2>
        <p className="max-w-sm text-sm text-muted">
          You&apos;re booked with{" "}
          <span className="font-bold text-ink">{booked.doctor}</span> on{" "}
          <span className="font-bold text-ink">
            {formatShortDate(booked.date)}
          </span>{" "}
          at{" "}
          <span className="font-bold text-ink">{booked.time}</span>.
        </p>
        <button
          type="button"
          onClick={() => {
            setBooked(null);
            setSelected(null);
          }}
          className="mt-2 rounded-xl bg-sea-500 px-6 py-3 text-sm font-bold text-white shadow-soft"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {doctors.map((d) => (
          <div
            key={d.id}
            className="flex flex-col rounded-2xl border border-hairline bg-white p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-sea-50">
                {d.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.imageUrl}
                    alt={d.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Stethoscope className="h-7 w-7 text-sea-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{d.name}</p>
                <p className="text-[12px] font-semibold text-sea-600">
                  {d.specialization}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {d.qualification}
                </p>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
              <span className="flex items-center gap-1">
                <BadgeCheck className="h-3.5 w-3.5 text-leaf-500" />
                {d.experienceYears} yrs experience
              </span>
              <span className="font-bold text-ink">{formatRupees(d.fee)} fee</span>
            </div>

            {d.bio && (
              <p className="mt-2 line-clamp-2 text-[12px] text-ink-soft">{d.bio}</p>
            )}

            <button
              type="button"
              onClick={() => setSelected(d)}
              className="mt-3 w-full rounded-xl bg-sea-500 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600"
            >
              Book appointment
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <BookingModal
          doctor={selected}
          onClose={() => setSelected(null)}
          onBooked={(date, time) =>
            setBooked({ doctor: selected.name, date, time })
          }
        />
      )}
    </>
  );
}

function BookingModal({
  doctor,
  onClose,
  onBooked,
}: {
  doctor: StoreDoctor;
  onClose: () => void;
  onBooked: (date: string, time: string) => void;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = slotsForDate(
    doctor.availability,
    doctor.blockedDates,
    date,
    doctor.slotMinutes,
  );

  async function book() {
    if (!time) {
      setError("Please pick a time slot.");
      return;
    }
    setBusy(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      router.push("/login?next=/appointment");
      return;
    }

    const { error: insErr } = await supabase.from("appointments").insert({
      user_id: user.id,
      doctor_id: doctor.id,
      patient_name: name.trim(),
      phone: phone.trim(),
      slot_date: date,
      slot_time: time,
    });
    setBusy(false);
    if (insErr) {
      // 23505 = unique violation → slot already taken.
      setError(
        insErr.code === "23505"
          ? "That slot was just taken. Please pick another."
          : insErr.message,
      );
      return;
    }
    onBooked(date, time);
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-end bg-ink/50 backdrop-blur-sm sm:place-items-center sm:px-5"
      onClick={() => !busy && onClose()}
    >
      <div
        className="animate-fade-up w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-ink">{doctor.name}</h2>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-hairline/60 hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[12px] font-semibold text-sea-600">
          {doctor.specialization} · {formatRupees(doctor.fee)} fee
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <CalendarDays className="h-4 w-4 text-sea-500" /> Date
            </label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => {
                setDate(e.target.value);
                setTime(null);
              }}
              className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
            />
          </div>

          <div>
            <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <Clock className="h-4 w-4 text-sea-500" /> Time slot
            </span>
            {slots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline bg-hairline/20 px-3 py-3 text-center text-[12px] font-semibold text-muted">
                {doctor.name} isn&apos;t available on this date. Try another day.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTime(s)}
                    className={`rounded-xl border py-2 text-[12px] font-bold transition ${
                      time === s
                        ? "border-sea-500 bg-sea-50 text-sea-600"
                        : "border-hairline text-ink-soft hover:bg-sea-50/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patient name"
              className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-sea-400 focus:ring-2 focus:ring-sea-200"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-[13px] font-semibold text-rose-600">
            {error}
          </p>
        )}

        <button
          onClick={book}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sea-500 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-sea-600 disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirm booking
        </button>
        <p className="mt-2 text-center text-[11px] text-muted">
          You&apos;ll need to be{" "}
          <Link href="/login?next=/appointment" className="font-semibold text-sea-600">
            signed in
          </Link>{" "}
          to confirm.
        </p>
      </div>
    </div>
  );
}
