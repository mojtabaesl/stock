import chalk from "chalk";

function loggerFn() {
  const error = (message: any) => {
    console.log("\n" + chalk.red(`🔴 Error: `), message);
  };
  const success = (message: any) => {
    console.log("\n" + chalk.green(`✅ Success: `), message);
  };
  const info = (message: any) => {
    console.log(`ℹ️ Info: ${message}`);
  };

  const waiting = (message: any) => {
    console.log("\n" + chalk.blue(`⏳ Waiting: `), message);
  };

  return {
    error,
    success,
    info,
    waiting,
  };
}

export const logger = loggerFn();
