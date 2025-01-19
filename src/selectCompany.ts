import type { Page } from "playwright";
import { User } from "./selectAccount";
import { logger } from "./logger.js";

export async function selectCompany(page: Page, broker: User["broker"]) {
  logger.waiting("To Select Stock in Basket");
  switch (broker) {
    case "mofid":
      await selectCompanyInMofid(page);
      break;

    case "hafez":
      await selectCompanyInHafez(page);
      break;

    default:
      logger.error("Not a valid broker name!");
      break;
  }
  logger.success("Stock Selected");
}

async function selectCompanyInHafez(page: Page) {
  await page.click("#liWatchlistTab");
  await page.waitForTimeout(4000);
  await page.click("#currentItem");
  await page.waitForTimeout(1000);
  await page.click('#list .item:has-text("basket")');
  await page.waitForTimeout(4000);
  await page.click("#list-container-WatchList .newGrid-container ul > li");
}

async function selectCompanyInMofid(page: Page) {
  const basket = await page.waitForSelector('span:has-text("basket")');
  await basket.click();

  const company = await page.waitForSelector(
    "#market-grid > ag-grid-angular > div > div.ag-root-wrapper-body.ag-layout-normal.ag-focus-managed > div.ag-root.ag-unselectable.ag-layout-normal > div.ag-body.ag-layout-normal > div.ag-body-viewport.ag-layout-normal.ag-row-animation > div.ag-pinned-right-cols-container"
  );
  await company.click();
}
