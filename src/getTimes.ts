import { format, addSeconds } from "date-fns";
import { fromZonedTime, toDate, toZonedTime } from "date-fns-tz";

const timeZones = ["Asia/Tehran"] as const;
type TimeZone = (typeof timeZones)[number];

export function calculateZonedDates(
  clockTime: string,
  offsetSeconds: number,
  timeZone: TimeZone
) {
  const today = toZonedTime(new Date(), timeZone);
  const todayStr = format(today, "yyyy-MM-dd");
  const targetTime = toDate(`${todayStr}T${clockTime}`);
  const warmupTime = addSeconds(targetTime, -offsetSeconds);
  return { targetTime, warmupTime };
}

export function toSystemDate(date: Date, timeZone: TimeZone) {
  const systemTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const utcDate = fromZonedTime(date, timeZone);
  const systemDate = toZonedTime(utcDate, systemTimeZone);
  return systemDate;
}
