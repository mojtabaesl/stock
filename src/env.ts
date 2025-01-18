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
  checkTimeInterval: number(),
  showBrowserGUI: boolean(),
  screenWidth: number(),
  screenHeight: number(),
  ApiKey: pipe(string(), nonEmpty("Please enter api key")),
  binID: pipe(string(), nonEmpty("Please enter bin ID")),
});

export type ENV = InferOutput<typeof EnvSchema>;

function getEnv(): ENV {
  try {
    const envObject = {
      checkTimeInterval: Number(process.env?.CHECK_TIME_INTERVAL ?? 1),
      showBrowserGUI: process.env?.SHOW_BROWSER_GUI === "true" ? true : false,
      screenWidth: Number(process.env?.SCREEN_WIDTH ?? 1920),
      screenHeight: Number(process.env?.SCREEN_HEIGHT ?? 1080),
      ApiKey: process.env.API_KEY,
      binID: process.env.BIN_ID,
    };
    return parse(EnvSchema, envObject);
  } catch (error) {
    console.error(error);
    process.exit(0);
  }
}

export const env = getEnv();
