import { parentPort, workerData } from "worker_threads";

const { targetTime, warmupTime, syncClientAndServerTime } = workerData ?? {};
let isWarmedUp: boolean = false;
let diff = 0;

if (syncClientAndServerTime) {
  parentPort?.on("message", (data) => {
    diff = Number(data?.message);
  });
  const loop = setInterval(() => {
    const currentDate = new Date();
    const updatedDate = new Date(currentDate.getTime() - diff);
    if (updatedDate > warmupTime && !isWarmedUp) {
      parentPort?.postMessage("warmup");
      isWarmedUp = true;
    }
    if (updatedDate > targetTime) {
      clearInterval(loop);
      parentPort?.postMessage("click");
    }
  }, 1);
} else {
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
  }, 1);
}
