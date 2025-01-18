import type { Page } from "playwright";

export async function findButBtnPosition(page: Page) {
  const buyButton = await page.waitForSelector("#send_order_btnBuySell");
  const { x: xPosition, y: yPosition } = await buyButton.evaluate(
    (btn: HTMLButtonElement) => btn.getBoundingClientRect()
  );
  await page.mouse.move(xPosition, yPosition);
  return { xPosition, yPosition };
}
