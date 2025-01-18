import { chromium } from "playwright";
import { Worker } from "worker_threads";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { env } from "./env.js";
import { login } from "./login.js";
import { closePopup } from "./popup.js";
import { selectCompany } from "./selectCompany.js";
import { calcQuantity } from "./calcQuantity.js";
import { findButBtnPosition } from "./findBuyBtnPosition.js";
import { calculateZonedDates, toSystemDate } from "./getTimes.js";
import { getTehranTime } from "./utils.js";
import { selectAccount } from "./selectAccount.js";
import { printAppInfo } from "./printAppInfo.js";

const account = await selectAccount();
const __dirname = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: !env.showBrowserGUI });
const page = await browser.newPage({
  viewport: { width: env.screenWidth, height: env.screenHeight },
});

await login(page, account?.username, account?.password);
await closePopup(page);
await selectCompany(page);
await calcQuantity(page);

await page.screenshot({ path: "screenShots/01-ready.jpg" });
const { xPosition, yPosition } = await findButBtnPosition(page);

printAppInfo(account, page);

const tehranTimes = calculateZonedDates(
  account.targetTime,
  account.userConfig.warmupOffset,
  "Asia/Tehran"
);

const workerPath = join(__dirname, "worker.js");
const worker = new Worker(workerPath, {
  workerData: {
    checkTimeInterval: env.checkTimeInterval,
    targetTime: toSystemDate(tehranTimes.targetTime, "Asia/Tehran"),
    warmupTime: toSystemDate(tehranTimes.warmupTime, "Asia/Tehran"),
  },
});

page.on("request", async () => {
  const time = new Date();
  console.log(
    "Requested At         : ",
    getTehranTime(time),
    "-",
    time.getMilliseconds(),
    "ms"
  );
});

page.on("response", async (response) => {
  const time = new Date();
  const headers = await response.headers();
  // const body = await response.text();
  console.log(
    "Received At          : ",
    getTehranTime(time),
    "-",
    time.getMilliseconds(),
    "ms"
  );
  // console.log("Remote Response Time : ", gmtToTehran(headers?.date));
  // console.log("Response Body        : ", body);
  console.log("\n");
});

worker.on("message", async (msg) => {
  if (msg === "click") {
    for (let i = 0; i < account.userConfig.sendButtonClickCount; i++) {
      await page.mouse.click(xPosition, yPosition);
      console.log("Clicked ", i + 1, " times");
      if (account.userConfig.sendButtonClickDelay > 0) {
        await page.waitForTimeout(account.userConfig.sendButtonClickDelay);
      }
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "screenShots/03-result.jpg" });
    console.log("Done!");
    await browser.close();
  } else if (msg === "warmup") {
    if (account.userConfig.warmupOffset > 0) {
      await page.mouse.click(xPosition, yPosition);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "screenShots/02-warmup.jpg" });
      console.log("Your browser warmed up -_-");
    }
  }
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});
