import readline from "node:readline/promises";
import {
  number,
  custom,
  pipe,
  object,
  parse,
  string,
  regex,
  array,
  optional,
  literal,
  union,
  boolean,
} from "valibot";
import Table from "cli-table3";
import type { InferOutput } from "valibot";
import { env } from "./env.js";
import chalk from "chalk";
import { logger } from "./logger.js";
import { getJsonBinData } from "./utils.js";
import { parse as dateFnsParse } from "date-fns";

const UserConfigSchema = object({
  sendButtonClickCount: optional(number()),
  sendButtonClickDelay: optional(number()),
  warmupOffset: optional(
    pipe(
      number(),
      custom(
        (value) =>
          typeof value === "number" ? value === 0 || value >= 2 : false,
        "warmupOffset must be 0 or >= 2"
      )
    )
  ),
  requestInitiator: optional(union([literal("browser"), literal("node")])),
  mofid: optional(
    object({
      syncClientAndServerTime: optional(boolean()),
    })
  ),
});

const SystemConfigSchema = object({
  sendButtonClickCount: number(),
  sendButtonClickDelay: number(),
  warmupOffset: pipe(
    number(),
    custom(
      (value) =>
        typeof value === "number" ? value === 0 || value >= 2 : false,
      "warmupOffset must be 0 or >= 2"
    )
  ),
  requestInitiator: union([literal("browser"), literal("node")]),
  mofid: object({
    syncClientAndServerTime: boolean(),
  }),
});

const UserSchema = object({
  name: string(),
  broker: union([literal("hafez"), literal("mofid"), literal("exir")]),
  targetTime: pipe(
    string(),
    regex(
      /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}$/,
      "Invalid time format. Expected HH:MM:SS.mmm"
    )
  ),
  username: string(),
  password: string(),
  show: optional(boolean()),
  userConfig: optional(UserConfigSchema),
});

const UsersSchema = object({
  systemConfig: SystemConfigSchema,
  users: array(UserSchema),
});

export type Users = InferOutput<typeof UsersSchema>;

function addTimingPlaceToUsers(accounts: Users) {
  const accountsCopy = structuredClone(accounts);
  const sortedUsers = accountsCopy.users
    .map((user, index) => ({
      ...user,
      originalIndex: index,
      timeObject: dateFnsParse(user.targetTime, "HH:mm:ss.SSS", new Date()),
    }))
    .sort((a, b) => a.timeObject.getTime() - b.timeObject.getTime())
    .map((user, index) => ({
      ...user,
      timingPlace: index + 1,
    }));

  const accountsWithTimingPlace = accounts?.users.map((user) => ({
    ...user,
    timingPlace: sortedUsers.find((u) => u.name === user.name)?.timingPlace,
  }));

  return { ...accountsCopy, users: accountsWithTimingPlace };
}

async function getAccounts(binID: string) {
  try {
    const binData = await getJsonBinData(binID);
    return parse(UsersSchema, binData);
  } catch (error) {
    console.error("An error occurred", error);
  }
}

const table = new Table({
  head: ["ID", "Name", "Broker", "Time"],
  colWidths: [5, 30, 10, 14],
});

export async function selectAccount() {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const fetchedAccounts = await getAccounts(env.accountsBinID);
    if (!fetchedAccounts) {
      throw new Error("users not found");
    }
    const accounts = addTimingPlaceToUsers(fetchedAccounts);

    const includedUsers = accounts.users.filter((user) => user.show ?? true);
    

    includedUsers.forEach((account, index) => {
      const broker = account.broker;
      const colorful = (text: string | number) => {
        if (broker === "mofid") return chalk.green(text);
        if (broker === "hafez") return chalk.yellow(text);
        if (broker === "exir") return chalk.blue(text);
        return broker;
      };

      table.push([
        colorful(index + 1),
        colorful(account.name),
        colorful(account.broker),
        colorful(account.targetTime),
      ]);
    });
    console.log(table.toString());

    const accountID = await rl.question("Please enter account ID: ");
    rl.close();

    const account = includedUsers[Number(accountID) - 1];
    if (!account) throw new Error("Invalid Account ID");
    const { userConfig } = account;
    const res = {
      ...account,
      userConfig: {
        sendButtonClickCount:
          userConfig?.sendButtonClickCount === undefined
            ? accounts.systemConfig.sendButtonClickCount
            : userConfig.sendButtonClickCount,
        sendButtonClickDelay:
          userConfig?.sendButtonClickDelay === undefined
            ? accounts.systemConfig.sendButtonClickDelay
            : userConfig.sendButtonClickDelay,
        warmupOffset:
          userConfig?.warmupOffset === undefined
            ? accounts.systemConfig.warmupOffset
            : userConfig.warmupOffset,
        requestInitiator:
          userConfig?.requestInitiator === undefined
            ? accounts.systemConfig.requestInitiator
            : userConfig.requestInitiator,
        mofid: {
          syncClientAndServerTime:
            userConfig?.mofid?.syncClientAndServerTime === undefined
              ? accounts.systemConfig.mofid.syncClientAndServerTime
              : userConfig.mofid.syncClientAndServerTime,
        },
      },
    };

    if (
      res.userConfig.requestInitiator === "node" &&
      res.userConfig.warmupOffset === 0
    ) {
      throw new Error(
        'When requestInitiator is set to "node", warmupOffset must not be 0.'
      );
    }

    return res;
  } catch (error) {
    logger.error(error);
    process.exit();
  }
}

export type User = Awaited<ReturnType<typeof selectAccount>>;
