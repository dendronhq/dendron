import process from "process";
import { Logger } from "../logger";
import os from "os";

export function getOS() {
  return os.platform();
}

export function getDurationMilliseconds(start: [number, number]) {
  const [secs, nanosecs] = process.hrtime(start);
  return secs * 1000 + Math.floor(nanosecs / 1000000);
}

export function profile(wrapped: Function) {
  const funcName = wrapped.name;
  const ctx = `profile:${funcName}`;
  return function () {
    const start = process.hrtime();
    // @ts-ignore
    const result = wrapped.apply(this, arguments);
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, profile });
    return result;
  };
}

export async function profileAsync(wrapped: Function) {
  const funcName = wrapped.name;
  const ctx = `profile:${funcName}`;
  return async function () {
    const start = process.hrtime();
    // @ts-ignore
    const result = await wrapped.apply(this, arguments);
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, profile });
    return result;
  };
}

export function logMethod(target: any, key: any, descriptor: any) {
  // save a reference to the original method this way we keep the values currently in the
  // descriptor and don't overwrite what another decorator might have done to the descriptor.
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key);
  }
  var originalMethod = descriptor.value;

  //editing the descriptor/value parameter
  descriptor.value = function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i - 0] = arguments[_i];
    }
    var a = args
      .map(function (a) {
        return JSON.stringify(a);
      })
      .join();
    // note usage of originalMethod here
    var result = originalMethod.apply(this, args);
    var r = JSON.stringify(result);
    console.log("Call: " + key + "(" + a + ") => " + r);
    return result;
  };

  // return edited descriptor as opposed to overwriting the descriptor
  return descriptor;
}
