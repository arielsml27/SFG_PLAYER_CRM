export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkAndSendReminders } = await import("@/lib/reminders");
  const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly; actual send is gated by the day-threshold inside checkAndSendReminders

  const runCheck = () => {
    checkAndSendReminders().catch((err) => console.error("Reminder check failed:", err));
  };

  runCheck();
  setInterval(runCheck, CHECK_INTERVAL_MS);
}
