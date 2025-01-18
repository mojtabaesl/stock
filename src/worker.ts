import { parentPort, workerData } from "worker_threads";

const { targetTime, warmupTime } = workerData ?? {};
let isWarmedUp: boolean = false;

const loop = setInterval(() => {
  const currentDate = new Date();
  if (currentDate > warmupTime && !isWarmedUp) {
    parentPort?.postMessage("warmup");
    isWarmedUp = true;
  }

  if (currentDate > targetTime) {
    clearInterval(loop);
    parentPort?.postMessage("click");
  }
}, workerData.checkTimeInterval);
