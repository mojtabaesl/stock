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
} from "valibot";
import Table from "cli-table3";
import type { InferOutput } from "valibot";
import { env } from "./env.js";

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
});

const UserSchema = object({
  name: string(),
  targetTime: pipe(
    string(),
    regex(
      /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}$/,
      "Invalid time format. Expected HH:MM:SS.mmm"
    )
  ),
  username: string(),
  password: string(),
  userConfig: optional(UserConfigSchema),
});

const UsersSchema = object({
  systemConfig: SystemConfigSchema,
  users: array(UserSchema),
  excludes: optional(array(string())),
});

export type Users = InferOutput<typeof UsersSchema>;

async function fetchBinData(binID: string, apiKey: string) {
  const url = `https://api.jsonbin.io/v3/b/${binID}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Key": apiKey,
        "X-Bin-Meta": "false",
      },
    });

    if (!response.ok) {
      throw new Error("Error fetching data");
    }

    const binData = await response.json();
    return parse(UsersSchema, binData);
  } catch (error) {
    console.error("An error occurred", error);
  }
}

const table = new Table({
  head: ["ID", "Name", "Time"],
  colWidths: [5, 30, 14],
});

export async function selectAccount() {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const users = await fetchBinData(env.binID, env.ApiKey);

    if (!users) {
      throw new Error("users not found");
    }

    const includedUsers = users.users.filter(
      (user) => !users.excludes?.includes(user.name)
    );

    includedUsers.forEach((account, index) =>
      table.push([index + 1, account.name, account.targetTime])
    );
    console.log(table.toString());

    const accountID = await rl.question("Please enter account ID: ");
    rl.close();

    const account = includedUsers[Number(accountID) - 1];
    const { userConfig } = account;
    return {
      ...account,
      userConfig: {
        sendButtonClickCount:
          userConfig?.sendButtonClickCount === undefined
            ? users.systemConfig.sendButtonClickCount
            : userConfig.sendButtonClickCount,
        sendButtonClickDelay:
          userConfig?.sendButtonClickDelay === undefined
            ? users.systemConfig.sendButtonClickDelay
            : userConfig.sendButtonClickDelay,
        warmupOffset:
          userConfig?.warmupOffset === undefined
            ? users.systemConfig.warmupOffset
            : userConfig.warmupOffset,
      },
    };
  } catch (error) {
    console.log(error);
    process.exit();
  }
}

export type User = Awaited<ReturnType<typeof selectAccount>>;
