import type { Page } from "playwright";
import { logger } from "./logger.js";
import { User } from "./selectAccount.js";

async function findButBtnPositionInHafez(page: Page) {
  const buyButton = await page.waitForSelector("#send_order_btnBuySell");
  const { x: xPosition, y: yPosition } = await buyButton.evaluate(
    (btn: HTMLButtonElement) => btn.getBoundingClientRect()
  );
  await page.mouse.move(xPosition, yPosition);
  return { xPosition, yPosition };
}

async function findButBtnPositionInMofid(page: Page) {
  const buyButton = await page.waitForSelector(
    'button[data-cy="order-submit-btn"]'
  );
  const { x: xPosition, y: yPosition } = await buyButton.evaluate(
    (btn: HTMLButtonElement) => btn.getBoundingClientRect()
  );
  await page.mouse.move(xPosition, yPosition);
  return { xPosition, yPosition };
}

async function findButBtnPositionInExir(page: Page) {
  const buyButton = await page.waitForSelector("#online-order .buy-btn");
  const { x: xPosition, y: yPosition } = await buyButton.evaluate(
    (btn: HTMLButtonElement) => btn.getBoundingClientRect()
  );
  await page.mouse.move(xPosition, yPosition);
  return { xPosition, yPosition };
}

export async function findButBtnPosition(page: Page, broker: User["broker"]) {
  logger.waiting("To Find BuyButton Position");
  let res = { xPosition: 0, yPosition: 0 };
  switch (broker) {
    case "mofid":
      res = await findButBtnPositionInMofid(page);
      break;

    case "hafez":
      res = await findButBtnPositionInHafez(page);
      break;

    case "exir":
      res = await findButBtnPositionInExir(page);
      break;

    default:
      logger.error("Not a valid broker name!");
      break;
  }
  logger.success("BuyButton Position Has Been Found");
  return res;
}
