import type { Page } from "playwright";
import readline from "node:readline/promises";
import Jimp from "jimp";
import { User } from "./selectAccount";
import { logger } from "./logger.js";
import fs from "node:fs/promises";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ASCII characters used to represent the grayscale
const ASCII_CHARS = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."];

function getAsciiChar(value: any) {
  return ASCII_CHARS[Math.floor(value / 25)];
}

async function convertImageToAscii(imageBuffer: Buffer, newWidth = 100) {
  const image = await Jimp.read(imageBuffer);
  const aspectRatio = image.bitmap.height / image.bitmap.width;
  const newHeight = Math.floor(newWidth * aspectRatio);

  image.resize(newWidth, newHeight).grayscale();

  let asciiStr = "";
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
      const grayValue = Math.floor((pixel.r + pixel.g + pixel.b) / 3);
      asciiStr += getAsciiChar(grayValue);
    }
    asciiStr += "\n";
  }

  return asciiStr;
}

export async function login(page: Page, account: User) {
  logger.waiting("To Login");
  try {
    switch (account.broker) {
      case "mofid":
        await loginMofid(page, account.username, account.password);
        break;

      case "hafez":
        await loginHafez(page, account.username, account.password);
        break;

      case "exir":
        await loginExir(page, account.username, account.password);
        break;

      default:
        logger.error("Not a valid broker name!");
        break;
    }
    logger.success("Logged in");
  } catch (error) {
    logger.error(error);
  }
}

async function loginHafez(page: Page, username: string, password: string) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const captchaPath = path.resolve(__dirname, "../logs", "captcha.png");
  await page.goto("https://online.hafezbroker.ir/");
  await page.waitForSelector("#username");
  await page.fill("#username", username);
  await page.fill("#password", password);
  logger.waiting("To Load Captcha");
  await page.waitForTimeout(5000);
  await page.waitForSelector('#captcha-img:not([src=""])');
  const base64Data = (await page.getAttribute("#captcha-img", "src")) as string;
  const base64 = base64Data.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(captchaPath, buffer);
  const asciiCaptcha = await convertImageToAscii(buffer);
  console.log(asciiCaptcha);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question("Please enter captcha code: ");
  rl.close();

  await page.fill("#captcha", answer);

  await page.click(".form-group > button");
  await page.waitForURL("https://online.hafezbroker.ir/Home/Default/page-1");
}

async function loginMofid(page: Page, username: string, password: string) {
  await page.goto("https://login.emofid.com/");
  await page.waitForSelector("#Username", { state: "visible" });
  await page.fill("#Username", username);
  await page.fill("#Password", password);

  await page.click("#submit_btn");

  await page.waitForTimeout(3000);

  if (page.url() === "https://easytrader.ir/") {
    await page.click('a[href="https://d.easytrader.ir/"]');
  }
  await page.waitForURL("https://d.easytrader.ir/", { timeout: 60000 });
}

async function loginExir(page: Page, username: string, password: string) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const captchaPath = path.resolve(__dirname, "../logs", "captcha.png");
  await page.goto("https://boursebimeh.exirbroker.com/");
  //TODO: remove this after Exir debug
  await page.screenshot({ path: "logs/00-login.jpg" });
  await page.waitForSelector("#userNameInput");
  await page.fill("#userNameInput", username);
  await page.fill("#mat-input-2", password);
  logger.waiting("To Load Captcha");
  await page.waitForTimeout(5000);
  await page.waitForSelector('#captcha:not([src=""])');
  const base64Data = (await page.getAttribute("#captcha", "src")) as string;
  const base64 = base64Data.replace(/^data:image\/jpeg;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  await fs.writeFile(captchaPath, buffer);
  const asciiCaptcha = await convertImageToAscii(buffer);
  console.log(asciiCaptcha);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question("Please enter captcha code: ");
  rl.close();

  await page.fill("#captchaText", answer);

  await page.click("#btn-login");
  await page.waitForURL("https://boursebimeh.exirbroker.com/exir/mainNew");
}
