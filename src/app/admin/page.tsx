import type { Metadata } from "next";
import Logo from "@/components/Logo";
import { buttonClass } from "@/components/ui";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { CLINIC, doctorById, treatmentById } from "@/lib/clinic";
import { getStore, type BookingRow } from "@/lib/store";
import { addDays, fromDubai, toDubai, weekdayOf } from "@/lib/time";
import { login, logout } from "./actions";
import AutoRefresh from "./AutoRefresh";

// Always rendered per request: it depends on the session cookie and live
// bookings, and must never be prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookings · Oravie admin",
  robots: { index: false, follow: false },
};

const dayLabel = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC.timeZone, weekday: "short", day: "numeric", month: "short" });
const clock = new Intl.DateTimeFormat("en-GB", { timeZone: CLINIC.timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

/** A booking made in the last few minutes is flagged, so a new one is easy to spot. */
const NEW_FOR_MS = 3 * 60_000;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ice">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 desk:px-10">
          <Logo />
          <span className="text-sm font-semibold text-slate">Clinic admin</span>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-10 desk:px-10">{children}</main>
    </div>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-white p-8">
      <h1 className="text-2xl font-extrabold tracking-[-0.02em]">{title}</h1>
      <p className="mt-3 leading-relaxed font-medium text-slate">{text}</p>
    </div>
  );
}

function Bookings({ title, rows, now }: { title: string; rows: BookingRow[]; now: number }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-extrabold tracking-[-0.01em]">
        {title} <span className="font-semibold text-slate tabular-nums">({rows.length})</span>
      </h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-[13px] text-slate">
            <tr>
              {["Time", "Patient", "Treatment", "Dentist", "Status", "Booked by"].map((h) => (
                <th key={h} scope="col" className="px-5 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line font-medium">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-6 text-slate">No bookings.</td>
              </tr>
            )}
            {rows.map((b) => {
              const starts = new Date(b.starts_at);
              const cancelled = b.status === "cancelled";
              const isNew = now - new Date(b.created_at).getTime() < NEW_FOR_MS;
              return (
                <tr key={b.reference} className={isNew ? "bg-slot/60" : undefined}>
                  <td className="px-5 py-3.5 whitespace-nowrap tabular-nums">
                    <span className="font-bold">{toDubai(starts).time}</span>
                    <span className="ml-2 text-slate">{dayLabel.format(starts)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cancelled ? "text-slate line-through" : ""}>{b.patient_name}</span>
                    {isNew && (
                      <span className="ml-2 rounded-md bg-blue px-1.5 py-0.5 text-[11px] font-bold text-white">New</span>
                    )}
                    <span className="block text-[13px] text-slate tabular-nums">
                      {b.phone} · {b.reference}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">{treatmentById(b.treatment_id).name}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">{doctorById(b.doctor_id).name}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-md px-2 py-1 text-[12px] font-bold ${
                        cancelled ? "bg-ice text-slate" : "border border-slot-border bg-slot text-blue-hover"
                      }`}
                    >
                      {cancelled ? "Cancelled" : "Booked"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`rounded-md px-2 py-1 text-[12px] font-bold ${
                        b.source === "noor" ? "bg-blue text-white" : "border border-line text-slate"
                      }`}
                    >
                      {b.source === "noor" ? "Booked by Noor" : "Booked by staff"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!adminConfigured()) {
    return (
      <Shell>
        <Notice title="Admin isn't set up" text="Add ADMIN_PASSWORD to the environment variables to turn this page on." />
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    const { error } = await searchParams;
    return (
      <Shell>
        <form action={login} className="mx-auto max-w-sm rounded-2xl border border-line bg-white p-8">
          <h1 className="text-2xl font-extrabold tracking-[-0.02em]">Clinic admin</h1>
          <label htmlFor="password" className="mt-6 block text-sm font-semibold">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            aria-invalid={!!error}
            aria-describedby={error ? "login-error" : undefined}
            className="mt-2 h-11 w-full rounded-lg border border-line px-3 text-base font-medium outline-none focus:border-blue focus:ring-2 focus:ring-blue/15"
          />
          {error && (
            <p id="login-error" role="alert" className="mt-2 text-sm font-medium text-alert">
              That password isn&apos;t right.
            </p>
          )}
          <button type="submit" className={`${buttonClass} mt-5 w-full`}>
            Sign in
          </button>
        </form>
      </Shell>
    );
  }

  const store = getStore();
  if (!store) {
    return (
      <Shell>
        <Notice title="Database not connected" text="Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to see bookings here." />
      </Shell>
    );
  }

  const now = new Date();
  const today = toDubai(now).date;
  // The week starts on Monday, Dubai time.
  const monday = addDays(today, -((weekdayOf(today) + 6) % 7));
  const [rows, noorThisWeek] = await Promise.all([
    store.from(fromDubai(today, "00:00")),
    store.noorCountSince(fromDubai(monday, "00:00")),
  ]);
  const tomorrow = fromDubai(addDays(today, 1), "00:00");
  const todays = rows.filter((r) => new Date(r.starts_at) < tomorrow);
  const upcoming = rows.filter((r) => new Date(r.starts_at) >= tomorrow);

  return (
    <Shell>
      <AutoRefresh seconds={15} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-[-0.03em]">Bookings</h1>
          <p className="mt-1 text-sm font-medium text-slate tabular-nums">
            Updated {clock.format(now)} Dubai time · refreshes every 15 seconds
          </p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm font-bold text-blue hover:underline">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-6 inline-flex items-center gap-4 rounded-2xl border border-line bg-white px-6 py-4">
        <span className="text-[34px] leading-none font-extrabold text-blue tabular-nums">{noorThisWeek}</span>
        <span className="text-sm leading-snug font-semibold text-slate">
          bookings made by Noor
          <br />
          this week
        </span>
      </div>

      <Bookings title="Today" rows={todays} now={now.getTime()} />
      <Bookings title="Upcoming" rows={upcoming} now={now.getTime()} />
    </Shell>
  );
}
