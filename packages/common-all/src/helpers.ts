import _ from "lodash";
import { ErrorFactory } from "./error";
import { TimeUtils } from "./timing";
import { RespV3 } from "./types";

export function makeResponse<T>(resp: T) {
  return Promise.resolve({
    ...resp,
  });
}

/**
 * Loop through iterable one element at a time and await on async callback at every iteration
 *  ^a7sx98zzqg5y
 */
export async function asyncLoopOneAtATime<T>(
  things: T[],
  cb: (t: T) => Promise<any>
) {
  for (const thing of things) {
    // eslint-disable-next-line no-await-in-loop
    await cb(thing);
  }
  return;
}

/**
 * Loop through iterable in parallel
 * @param things
 * @param cb
 * @returns
 */
export async function asyncLoop<T>(things: T[], cb: (t: T) => Promise<any>) {
  return Promise.all(things.map((t) => cb(t)));
}

export class AsyncUtils {
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
