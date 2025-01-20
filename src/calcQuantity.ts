import type { Page } from "playwright";
import { User } from "./selectAccount";
import { logger } from "./logger.js";

async function calcQuantityInHafez(page: Page) {
  await page.waitForTimeout(1000);
  await page.click("#sendorder_btnToggleCalc");
  await page.click("#calc_txtPrice");
  await page.waitForTimeout(1000);
  await page.click("#btnSetMaxPrice");
  await page.click("#calculator .tp-cu-po.tp-co-gr.lblTotalBudget.digit");
  await page.click("#calc_txtPrice");
  await page.waitForTimeout(1000);
  await page.click("#btnSetMaxPrice");

  const visibleMaxOrder = await page
    .locator("#stock_MaxQOrder")
    .filter({ hasNot: page.locator("xpath=..//ancestor::td[@hidden]") })
    .first();

  const maxQuantityString = (await visibleMaxOrder.textContent()) ?? "";

  const quantityString = await page.inputValue("#send_order_txtCount");

  const quantity = parseInt(quantityString.replace(/,/g, ""), 10);
  const maxQuantity = parseInt(maxQuantityString.replace(/,/g, ""), 10);

  if (Number(quantity) > maxQuantity) {
    await visibleMaxOrder.click();
  }
}

async function calcQuantityInMofid(page: Page) {
  const buyButton = await page.waitForSelector('button:has-text("خرید")');
  await buyButton.click();
  await buyButton.click();
  await buyButton.click();

  const maxPrice = await page.waitForSelector(
    'div[data-cy="order-form-max-price"]'
  );
  await maxPrice.click();
  const clacButton = await page.waitForSelector(
    '*[data-cy="order-form-calc-btn-quantity"]'
  );
  await clacButton.click();
  const buyPowerButton = await page.waitForSelector(
    'div[data-cy="calculator-buy-power"]'
  );
  await buyPowerButton.click();
}

async function calcQuantityInExir(page: Page) {
  await page.waitForTimeout(1000);
  const priceUp = await page.waitForSelector("#online-order div.price-up");
  await priceUp.click();
  await page.click("#online-order a.calculator");
  await page.waitForTimeout(1000);
  await page.click(".buying-power-container .buying-power-value");
  await page.waitForTimeout(1000);

  const visibleMaxOrder = await page
    .locator(
      'div.properties:has(.property-title:has-text("حجم مجاز")) .highlighttext'
    )
    .first();

  const maxQuantityString = (await visibleMaxOrder.textContent()) ?? "";
  const maxQuantity = parseInt(maxQuantityString.replace(/,/g, ""), 10);

  const quantityString = await page.inputValue('input[name="orderQuantity"]');
  const quantity = parseInt(quantityString.replace(/,/g, ""), 10);

  if (quantity > maxQuantity) {
    await visibleMaxOrder.click();
  }
}

export async function calcQuantity(page: Page, broker: User["broker"]) {
  logger.waiting("To Calculate Stock Quantity");
  switch (broker) {
    case "mofid":
      await calcQuantityInMofid(page);
      break;

    case "hafez":
      await calcQuantityInHafez(page);
      break;

    case "exir":
      await calcQuantityInExir(page);
      break;

    default:
      logger.error("Not a valid broker name!");
      break;
  }
  logger.success("Stock Calculation");
}
