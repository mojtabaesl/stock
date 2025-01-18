import type { Page } from "playwright";

export async function calcQuantity(page: Page) {
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
