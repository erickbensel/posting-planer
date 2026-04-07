// Scheduling wird über Vercel Cron (/api/cron/publish) abgewickelt.
// Diese Datei bleibt als Stub damit bestehende Imports nicht brechen.

export async function schedulePost(
  postId: string,
  postPlatformIds: string[],
  scheduledAt: Date
) {
  // Kein BullMQ mehr – der Cron Job verarbeitet alle fälligen Posts automatisch
}

export async function cancelScheduledPost(postId: string) {
  // Kein BullMQ mehr – nichts zu canceln
}
