import type { Page } from "playwright";
import readline from "node:readline/promises";
import Jimp from "jimp";

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

export async function login(page: Page, username: string, password: string) {
  try {
    await page.goto("https://online.hafezbroker.ir/");
    await page.waitForSelector("#username");
    await page.fill("#username", username);
    await page.fill("#password", password);
    console.log("Waiting for captcha ...");
    await page.waitForTimeout(10000);
    await page.waitForSelector('#captcha-img:not([src=""])');
    const base64Data = (await page.getAttribute(
      "#captcha-img",
      "src"
    )) as string;
    const base64 = base64Data.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64, "base64");
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
    console.log("Logged in successfully");
  } catch (error) {
    console.error(error);
  }
}
