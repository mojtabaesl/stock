import { Page } from "playwright";
import type { User } from "./selectAccount.js";
import { getTehranDate } from "./utils.js";

export async function printAppInfo(account: User, page: Page) {
  const transactionValue = await page.textContent("#sendorder_lblTotalPrice");
  const totalBudget = await page.textContent(
    "#calculator .tp-cu-po.tp-co-gr.lblTotalBudget.digit"
  );
  const maxQuantityString = await page.textContent("#stock_MaxQOrder");
  console.log("\n");
  console.log("----------------------------------------------------");
  console.log("Name                    : ", account?.name);
  console.log("Username                : ", account?.username);
  console.log("Max Quantity            : ", maxQuantityString);
  console.log("Total Budget            : ", totalBudget, " IRR");
  console.log("Transaction Value       : ", transactionValue, " IRR");
  console.log(
    "Target Time             : ",
    getTehranDate(new Date()),
    account?.targetTime
  );
  console.log("Warmup Offset           : ", account.userConfig.warmupOffset);
  console.log(
    "SendButton Click Count  : ",
    account.userConfig.sendButtonClickCount
  );
  console.log(
    "SendButton Click Delay  : ",
    account.userConfig.sendButtonClickDelay
  );
  console.log("----------------------------------------------------");
  console.log("Everything Is Ready To Get Rich :)");
  console.log("Waiting ...");
  console.log("\n");
}
