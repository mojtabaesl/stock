export function getTehranDate(currentDate: Date) {
  return currentDate.toLocaleDateString("en-US", {
    timeZone: "Asia/Tehran",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getTehranTime(currentDate: Date) {
  return currentDate.toLocaleTimeString("en-US", {
    timeZone: "Asia/Tehran",
    hour12: false,
  });
}

export function gmtToTehran(time: string) {
  const gmtTime = new Date(time);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(gmtTime);
}
