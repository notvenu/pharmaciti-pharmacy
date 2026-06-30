import { Stethoscope } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { getDoctors } from "@/lib/data";
import { BookingView } from "./BookingView";

export default async function AppointmentPage() {
  const doctors = await getDoctors();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Header variant="inner" title="Doctors Appointment" />

      <main className="px-4 pb-36 pt-4 md:px-6 md:pb-16">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-sea-100 bg-sea-50/70 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white shadow-sm">
            <Stethoscope className="h-6 w-6 text-sea-500" />
          </span>
          <div>
            <h1 className="text-base font-bold text-ink">
              Book a doctor&apos;s appointment
            </h1>
            <p className="text-[12px] text-muted">
              Pick a doctor, choose a date and time slot, and confirm.
            </p>
          </div>
        </div>

        {doctors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline bg-white px-6 py-14 text-center text-sm text-muted">
            No doctors are available right now. Please check back soon.
          </p>
        ) : (
          <BookingView doctors={doctors} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
