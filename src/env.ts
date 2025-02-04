import {
  object,
  number,
  parse,
  boolean,
  pipe,
  string,
  nonEmpty,
} from "valibot";
import type { InferOutput } from "valibot";

const EnvSchema = object({
  showBrowserGUI: boolean(),
  screenWidth: number(),
  screenHeight: number(),
  apiKey: pipe(string(), nonEmpty("Please enter api key")),
  accountsBinID: pipe(string(), nonEmpty("Please enter accounts bin ID")),
  logsBinID: pipe(string(), nonEmpty("Please enter logs bin ID")),
});

export type ENV = InferOutput<typeof EnvSchema>;

function getEnv(): ENV {
  try {
    const envObject = {
      showBrowserGUI: process.env?.SHOW_BROWSER_GUI === "true" ? true : false,
      screenWidth: Number(process.env?.SCREEN_WIDTH ?? 1920),
      screenHeight: Number(process.env?.SCREEN_HEIGHT ?? 1080),
      apiKey: process.env.API_KEY,
      accountsBinID: process.env.ACCOUNTS_BIN_ID,
      logsBinID: process.env.LOGS_BIN_ID,
    };
    return parse(EnvSchema, envObject);
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
}

export const env = getEnv();
