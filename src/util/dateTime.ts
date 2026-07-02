import { DateTime } from "luxon";

export function parseScheduledDateTime(start: string, timezone: string): Date {
  const parsed = DateTime.fromFormat(start, "MM-dd-yyyy h:mm a", {
    zone: timezone,
  });

  if (!parsed.isValid) {
    throw new Error(
      `Invalid start time. Use MM-dd-yyyy h:mm AM/PM, e.g. 07-15-2026 8:00 PM.`,
    );
  }

  if (parsed <= DateTime.now()) {
    throw new Error("Scheduled event must be in the future.");
  }

  return parsed.toUTC().toJSDate();
}

export function toDiscordUnixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}
