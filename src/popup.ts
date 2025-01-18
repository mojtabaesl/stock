import type { Page } from "playwright";

export async function closePopup(page: Page) {
  const modal = await page
    .waitForSelector(".popup-window", {
      state: "visible",
      timeout: 5000,
    })
    .catch(() => null);

  if (modal) {
    await page.click(".popup-box span.close");
  } else {
    console.log("Popup did not appear within the timeout period.");
  }
}
