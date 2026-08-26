import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { prospects, crmUsers } from "@/db/schema";
import { PROSPECT_STATUS_LABELS } from "@/lib/constants";

const REMINDER_THRESHOLD_DAYS = 7;
const UNHANDLED_STATUSES = ["NOT_CONTACTED", "CONTACTED_NO_MEETING"] as const;

function parseSqliteTimestamp(value: string): Date {
  // SQLite's CURRENT_TIMESTAMP default is "YYYY-MM-DD HH:MM:SS" (UTC, no timezone marker).
  return new Date(value.replace(" ", "T") + "Z");
}

function daysSince(value: string): number {
  return (Date.now() - parseSqliteTimestamp(value).getTime()) / (1000 * 60 * 60 * 24);
}

async function sendReminderEmail(to: string[], prospect: { name: string; club: string | null; position: string | null; status: string; createdAt: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set — skipping reminder email for", prospect.name);
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL || "SFG Player CRM <onboarding@resend.dev>";
  const appUrl = process.env.APP_URL || "https://sfgplayercrm-production.up.railway.app";
  const daysAgo = Math.floor(daysSince(prospect.createdAt));

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `תזכורת: פנייה שלא טופלה - ${prospect.name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6;">
          <p>שלום,</p>
          <p>תזכורת - הפנייה של <strong>${prospect.name}</strong> עדיין לא טופלה במשך ${daysAgo} ימים.</p>
          <ul>
            ${prospect.club ? `<li>מועדון: ${prospect.club}</li>` : ""}
            ${prospect.position ? `<li>עמדה: ${prospect.position}</li>` : ""}
            <li>סטטוס נוכחי: ${PROSPECT_STATUS_LABELS[prospect.status] ?? prospect.status}</li>
          </ul>
          <p><a href="${appUrl}/crm/watchlist">לצפייה ולהשלמת הטיפול בפנייה</a></p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    console.error("Failed to send reminder email:", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export async function checkAndSendReminders() {
  const unhandled = await db
    .select()
    .from(prospects)
    .where(or(...UNHANDLED_STATUSES.map((s) => eq(prospects.status, s))));

  const dueForReminder = unhandled.filter((p) => daysSince(p.reminderSentAt ?? p.createdAt) >= REMINDER_THRESHOLD_DAYS);
  if (dueForReminder.length === 0) return;

  const allUsers = await db.select().from(crmUsers);
  const userById = new Map(allUsers.map((u) => [u.id, u]));
  const adminEmails = allUsers.filter((u) => u.role === "ADMIN").map((u) => u.email);

  for (const prospect of dueForReminder) {
    const owner = prospect.contactedByUserId ? userById.get(prospect.contactedByUserId) : undefined;
    const recipients = owner ? [owner.email] : adminEmails;
    if (recipients.length === 0) continue;

    const sent = await sendReminderEmail(recipients, prospect);
    if (sent) {
      await db
        .update(prospects)
        .set({ reminderSentAt: new Date().toISOString().replace("T", " ").slice(0, 19) })
        .where(eq(prospects.id, prospect.id));
    }
  }
}
