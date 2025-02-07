import { env } from "./env.js";

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

export async function getJsonBinData(binID: string) {
  const url = `https://api.jsonbin.io/v3/b/${binID}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": env.apiKey,
      "X-Bin-Meta": "false",
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching data");
  }

  return await response.json();
}

export async function updateJsonBinData(binID: string, body: unknown) {
  const url = `https://api.jsonbin.io/v3/b/${binID}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Key": env.apiKey,
      "X-Bin-Meta": "false",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Error fetching data");
  }

  return await response.json();
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
