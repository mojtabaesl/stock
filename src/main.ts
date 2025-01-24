import { chromium } from "playwright";
import { Worker } from "worker_threads";
import path, { dirname, join } from "path";
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
import figlet from "figlet";
import chalk from "chalk";
import { logger } from "./logger.js";
import { writeFile } from "fs/promises";

interface RequestDetails {
  url: string;
  headers: Record<string, string>;
  body: string;
}

const account = await selectAccount();
figlet.text(
  account.broker.charAt(0).toUpperCase() + account.broker.substring(1),
  {
    font: "Big",
  },
  (err, data) => {
    if (err) {
      console.error("Error:", err);
      return;
    }
    const chalkPrint =
      account.broker === "mofid"
        ? chalk.green
        : account.broker === "hafez"
        ? chalk.yellow
        : chalk.blue;
    console.log("\n", chalkPrint(data), "\n");
  }
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: !env.showBrowserGUI });
const page = await browser.newPage({
  viewport: { width: env.screenWidth, height: env.screenHeight },
});

await login(page, account);
if (account.broker === "hafez") await closePopup(page);
await selectCompany(page, account.broker);
await calcQuantity(page, account.broker);

await page.screenshot({ path: "logs/01-ready.jpg" });
const { xPosition, yPosition } = await findButBtnPosition(page, account.broker);
await printAppInfo(account, page);

const tehranTimes = calculateZonedDates(
  account.targetTime,
  account.userConfig.warmupOffset,
  "Asia/Tehran"
);

let capturedRequest: RequestDetails;

if (
  account.userConfig.requestInitiator === "node" &&
  account.broker === "hafez"
) {
  await page.route(
    "https://api.hafezbroker.ir/Web/V1/Order/Post",
    async (route, request) => {
      if (request.method() === "POST") {
        capturedRequest = {
          url: request.url(),
          headers: request.headers(),
          body: (await request.postData()) || "",
        };
        console.log("Request Captured:", capturedRequest);
      }
      route.continue();
    }
  );
}
if (
  account.userConfig.requestInitiator === "node" &&
  account.broker === "exir"
) {
  await page.route(
    "https://boursebimeh.exirbroker.com/api/v1/order",
    async (route, request) => {
      if (request.method() === "POST") {
        capturedRequest = {
          url: request.url(),
          headers: request.headers(),
          body: (await request.postData()) || "",
        };
        console.log("Request Captured:", capturedRequest);
      }
      route.continue();
    }
  );
}

if (
  account.userConfig.requestInitiator === "node" &&
  account.broker === "mofid"
) {
  await page.on("request", async (request) => {
    if (
      request.url().startsWith("https://api-mts.orbis.easytrader.ir/core/api")
    ) {
      console.log("request captured for mofid", request);

      if (request.method() === "POST") {
        capturedRequest = {
          url: request.url(),
          headers: request.headers(),
          body: (await request.postData()) || "",
        };
        console.log("Request Captured:", capturedRequest);
      }
    }
  });
}

const logs: {
  index: number;
  body: any;
  status: number;
}[] = [];

async function fireRequest(requestDetails: RequestDetails, index: number) {
  try {
    const response = await fetch(requestDetails.url, {
      method: "POST",
      body: requestDetails.body,
      headers: requestDetails.headers,
    });

    const output = {
      index,
      body: await response.json(),
      status: response.status,
    };

    logs.push(output);
    // console.log("Response Data : ", output);
  } catch (error) {
    console.error("Error sending request", error);
  }
}

const workerPath = join(__dirname, `${account.broker}Worker.js`);
const worker = new Worker(workerPath, {
  workerData: {
    syncClientAndServerTime: account.userConfig.mofid.syncClientAndServerTime,
    targetTime: toSystemDate(tehranTimes.targetTime, "Asia/Tehran"),
    warmupTime: toSystemDate(tehranTimes.warmupTime, "Asia/Tehran"),
  },
});

if (
  account.broker === "mofid" &&
  account.userConfig.mofid.syncClientAndServerTime
) {
  page.on("response", async (response) => {
    if (
      response
        .url()
        .startsWith(
          "https://api-mts.orbis.easytrader.ir/easy/api/account/server-time/"
        )
    ) {
      const responseBody = await response.body();
      console.log("<<<<<<<");
      console.log("Time Sync Response:", responseBody.toString());
      const jsonResponse = JSON.parse(responseBody.toString());
      const currentTime = new Date().getTime();
      const diff = currentTime - jsonResponse?.serverTimestamp;
      console.log("LocalTime - MofidTime:", diff);
      console.log("<<<<<<<", "\n");
      worker.postMessage({ message: diff });
    }
  });
}

if (account.userConfig.requestInitiator === "browser") {
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
    // const headers = await response.headers();
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
}

worker.on("message", async (msg) => {
  if (msg === "click") {
    if (account.userConfig.requestInitiator === "browser") {
      for (let i = 0; i < account.userConfig.sendButtonClickCount; i++) {
        await page.mouse.click(xPosition + 2, yPosition + 2);
        console.log("Clicked ", i + 1, " times");
        if (account.userConfig.sendButtonClickDelay > 0) {
          await page.waitForTimeout(account.userConfig.sendButtonClickDelay);
        }
      }
    } else if (account.userConfig.requestInitiator === "node") {
      const start = performance.now();

      const requests = [];
      for (let i = 0; i < account.userConfig.sendButtonClickCount; i++) {
        requests.push(fireRequest(capturedRequest, i));
        if (account.userConfig.sendButtonClickDelay > 0) {
          await page.waitForTimeout(account.userConfig.sendButtonClickDelay);
        }
      }
      const end = performance.now();
      await Promise.all(requests);
      const logsDir = path.resolve(__dirname, "../logs", "logs.txt");
      await writeFile(
        logsDir,
        JSON.stringify(
          { broker: account.broker, performance: end - start, logs },
          null,
          2
        )
      );
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: "logs/03-result.jpg" });
    logger.success("Done!");
    await browser.close();
  } else if (msg === "warmup") {
    if (account.userConfig.warmupOffset > 0) {
      await page.mouse.click(xPosition + 2, yPosition + 2);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: "logs/02-warmup.jpg" });
      console.log("Your browser warmed up -_-");
    }
  }
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});
