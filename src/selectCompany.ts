import type { Page } from "playwright";

export async function selectCompany(page: Page) {
  await page.click("#liWatchlistTab");
  await page.waitForTimeout(4000);
  await page.click("#currentItem");
  await page.waitForTimeout(1000);
  await page.click('#list .item:has-text("basket")');
  await page.waitForTimeout(4000);
  await page.click("#list-container-WatchList .newGrid-container ul > li");
}
