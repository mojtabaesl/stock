import { Page } from "playwright";
import type { User } from "./selectAccount.js";
import { logger } from "./logger.js";
import chalk from "chalk";
import Table from "cli-table3";

const infoTable = new Table({
  colWidths: [25, 25],
  style: { head: [], border: [] },
});
export async function printAppInfo(account: User, page: Page) {
  const { transactionValue, totalBudget, maxQuantityString, stockName } =
    await getFinancialDetails(page, account.broker);

  infoTable.push(
    ["Broker", chalk.magenta(account.broker)],
    ["Name", chalk.magenta(account.name)],
    ["Username", chalk.magenta(account.username)],
    ["Stock Name", chalk.magenta(stockName)],
    ["Max Quantity", chalk.magenta(maxQuantityString)],
    ["Total Budget", chalk.magenta(`${totalBudget} IRR`)],
    ["Transaction Value", chalk.magenta(`${transactionValue} IRR`)],
    ["Target Time", chalk.magenta(account.targetTime)],
    ["Request Initiator", chalk.magenta(account.userConfig.requestInitiator)],
    ["Warmup Offset", chalk.magenta(account.userConfig.warmupOffset)],
    [
      "SendButton Click Count",
      chalk.magenta(account.userConfig.sendButtonClickCount),
    ],
    [
      "SendButton Click Delay",
      chalk.magenta(account.userConfig.sendButtonClickDelay),
    ]
  );
  console.log("\n" + infoTable.toString() + "\n");
  logger.success("Everything Is Ready To Get Rich :)");
  logger.waiting("To Reach Target Time" + "\n");
}

async function getFinancialDetailsInHafez(page: Page) {
  const transactionValue =
    (await page.textContent("#sendorder_lblTotalPrice")) ?? "";
  const totalBudget =
    (await page.textContent(
      "#calculator .tp-cu-po.tp-co-gr.lblTotalBudget.digit"
    )) ?? "";
  const maxQuantityString = (await page.textContent("#stock_MaxQOrder")) ?? "";
  const stockName =
    (await page.textContent("#cell_SymbolFa span.tp-cu-po")) ?? "";

  return { transactionValue, totalBudget, maxQuantityString, stockName };
}

async function getFinancialDetailsInMofid(page: Page) {
  const transactionValue =
    (await page.textContent('span[data-cy="order-summary-total-expense"]')) ??
    "";
  const maxQuantityString =
    (await page.textContent('span[data-cy="order-form-value-max-quantity"]')) ??
    "";
  const totalBudget =
    (await page.textContent('span[data-cy="account-balance-value"]')) ?? "";
  const stockName = (await page.textContent("#symbol-header-h5")) ?? "";

  return {
    transactionValue: transactionValue.trim(),
    totalBudget: totalBudget.trim(),
    maxQuantityString: maxQuantityString.trim(),
    stockName: stockName.trim(),
  };
}

async function getFinancialDetailsInExir(page: Page) {
  const transactionValue =
    (await page
      .locator('div.display-flex:has-text("ارزش معامله خرید:") span.mr-3')
      .textContent()) ?? "";

  const maxQuantityString =
    (await page
      .locator(
        'div.properties:has(.property-title:has-text("حجم مجاز")) .highlighttext'
      )
      .first()
      .textContent()) ?? "";

  const totalBudget =
    (await page
      .locator(
        'div:has-text("قدرت خرید:") >> .. >> .rh-calculate-change-div-green'
      )
      .first()
      .textContent()) ?? "";

  const stockName =
    (await page.textContent(
      ".ag-pinned-right-cols-container .ag-cell-value div.flex-lg-grow-1"
    )) ?? "";

  return {
    transactionValue: transactionValue.trim(),
    totalBudget: totalBudget.trim(),
    maxQuantityString: maxQuantityString.trim(),
    stockName: stockName.trim(),
  };
}

async function getFinancialDetails(page: Page, broker: User["broker"]) {
  let res = {
    transactionValue: "",
    totalBudget: "",
    maxQuantityString: "",
    stockName: "",
  };
  switch (broker) {
    case "mofid":
      res = await getFinancialDetailsInMofid(page);
      break;

    case "hafez":
      res = await getFinancialDetailsInHafez(page);
      break;

    case "exir":
      res = await getFinancialDetailsInExir(page);
      break;

    default:
      logger.error("Not a valid broker name!");
      break;
  }
  return res;
}
