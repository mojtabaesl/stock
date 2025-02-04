import { getJsonBinData, updateJsonBinData } from "./utils.js";
import { env } from "./env.js";
import { logger } from "./logger.js";
import {
  record,
  parse,
  string,
  number,
  object,
  pipe,
  custom,
  union,
  literal,
  boolean,
  regex,
  array,
  InferOutput,
  nullable,
} from "valibot";
import { format, toZonedTime } from "date-fns-tz";

const AccountSchema = object({
  name: string(),
  broker: union([literal("hafez"), literal("mofid"), literal("exir")]),
  userConfig: object({
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
  }),
});

const CurrentLogsSchema = object({
  targetTime: pipe(
    string(),
    regex(
      /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{3}$/,
      "Invalid time format. Expected HH:MM:SS.mmm"
    )
  ),
  apiCallTime: number(),
  requestsTime: number(),
  hostName: string(),
  apiResponses: array(
    object({
      index: number(),
      isSuccessful: boolean(),
      message: string(),
    })
  ),
});

const TodayLogsSchema = object({
  account: AccountSchema,
  logs: array(CurrentLogsSchema),
});

const LogsSchema = record(
  string(),
  nullable(record(string(), TodayLogsSchema))
);
type TodayLogs = InferOutput<typeof TodayLogsSchema>;
type CurrentLogs = InferOutput<typeof CurrentLogsSchema>;

interface Logs {
  account: TodayLogs["account"];
  logs: CurrentLogs;
}

async function getLogs() {
  try {
    const logs = await getJsonBinData(env.logsBinID);
    return parse(LogsSchema, logs);
  } catch (error) {
    console.error(error);
  }
}

export async function saveLogsToCloud(logs: Logs) {
  try {
    const currentLogs = await getLogs();
    const id = logs.account.name + "-" + logs.account.broker;

    const today = toZonedTime(new Date(), "Asia/Tehran");
    const currentDate = format(today, "MM-dd-yyyy");

    if (!currentLogs) throw new Error("No logs found on JsonBin");

    if (currentLogs[currentDate]) {
      if (currentLogs[currentDate][id]) {
        currentLogs[currentDate][id].logs.unshift(logs.logs);
      } else {
        currentLogs[currentDate][id] = {
          account: logs.account,
          logs: [logs.logs],
        };
      }
    } else {
      currentLogs[currentDate] = {};
      currentLogs[currentDate][id] = {
        account: logs.account,
        logs: [logs.logs],
      };
    }

    await updateJsonBinData(env.logsBinID, currentLogs);

    logger.success("Logs has been saved to JsonBin");
  } catch (error) {
    logger.error(error);
  }
}
