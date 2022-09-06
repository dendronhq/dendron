import { ErrorFactory } from "./error";
import { RespV3 } from "./types";

const NANOS_IN_SECOND = 1000000000;
const NANOS_IN_MILLI_SEC = 1000000;

/** Return current nanoseconds. */
export const nanos = () => {
  const hrTime = process.hrtime();
  return hrTime[0] * NANOS_IN_SECOND + hrTime[1];
};

/** Converts the given nano seconds to milliseconds */
export const nanosToMillis = (nanos: number) => {
  return nanos / NANOS_IN_MILLI_SEC;
};

/**
 * Returns a number representing the milliseconds elapsed
 * between 1 January 1970 00:00:00 UTC and the given date */
export const milliseconds = () => {
  return new Date().getTime();
};

export class TimeUtils {
  static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ sleep: ms });
      }, ms);
    });
  }

  static async awaitWithLimit<T>(
    opts: { limitMs: number },
    cb: () => Promise<T>
  ): Promise<RespV3<T>> {
    let timeout = false;
    const resp = await Promise.race([
      (async () => {
        await TimeUtils.sleep(opts.limitMs);
        timeout = true;
      })(),
      cb(),
    ]);
    if (timeout) {
      return {
        error: ErrorFactory.createInvalidStateError({
          message: "cb took too long",
        }),
      };
    }
    return { data: resp as T };
  }
}
