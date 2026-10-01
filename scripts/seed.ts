/**
 * Resets the demo data: doctors and treatments from src/lib/clinic.ts, and a
 * fresh set of bookings over the next 7 days (including OR-4821).
 * Run with `npm run db:seed` after creating the schema. Re-run it before
 * recording a demo so the bookings sit in the coming week.
 */
import { createClient } from "@supabase/supabase-js";
import { DOCTORS, TREATMENTS } from "../src/lib/clinic";
import { buildSeedBookings } from "../src/lib/seed-data";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  const fail = (step: string, error: { message: string } | null) => {
    if (error) throw new Error(`${step}: ${error.message}`);
  };

  fail(
    "doctors",
    (
      await db.from("doctors").upsert(
        DOCTORS.map((d) => ({
          id: d.id,
          name: d.name,
          specialty: d.specialty,
          languages: d.languages,
          working_days: d.workingDays,
        })),
      )
    ).error,
  );

  fail(
    "treatments",
    (
      await db.from("treatments").upsert(
        TREATMENTS.map((t) => ({
          id: t.id,
          name: t.name,
          from_price_aed: t.fromPriceAed,
          minutes: t.minutes,
          doctor_id: t.doctorId,
        })),
      )
    ).error,
  );

  // Clear every booking, then insert the fresh week.
  fail("clear bookings", (await db.from("bookings").delete().not("id", "is", null)).error);
  const bookings = buildSeedBookings();
  fail("bookings", (await db.from("bookings").insert(bookings)).error);

  console.log(`Seeded ${DOCTORS.length} doctors, ${TREATMENTS.length} treatments, ${bookings.length} bookings.`);
  for (const b of bookings) {
    console.log(`  ${b.reference}  ${b.starts_at}  ${b.treatment_id.padEnd(10)} ${b.doctor_id}`);
  }
}

run().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
