import process from "process";
import os from "os";

export function getOS() {
  return os.platform();
}

export function getDurationMilliseconds(start: [number, number]) {
  const [secs, nanosecs] = process.hrtime(start);
  return secs * 1000 + Math.floor(nanosecs / 1000000);
}
