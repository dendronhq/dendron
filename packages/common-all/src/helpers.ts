export function makeResponse<T>(resp: T) {
  return Promise.resolve({
    ...resp,
  });
}

/**
 * Loop through iterable one element at a time and await on async callback at every iteration
 *  ^a7sx98zzqg5y
 */
export async function asyncLoopOneAtATime<T, R = any>(
  things: T[],
  cb: (t: T) => Promise<R>
): Promise<R[]> {
  const returnValues: R[] = [];
  for (const thing of things) {
    // eslint-disable-next-line no-await-in-loop
    returnValues.push(await cb(thing));
  }
  return returnValues;
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


/**
 * Retry resolving promise factory n number of times before rejecting it
 * @param retriable
 * @param handler
 * @param n
 * @returns
 */
export async function asyncRetry<T>(retriable: () => Promise<T>, handler: (arg0: any) => any, n?: number) {
  n = n ?? 3;

  for (let i = 0; i < n; i += 1) {
    try {
      /* eslint-disable no-await-in-loop */
      return await retriable();
    } catch (error) {
      if (i < (n - 1)) {
        continue;
      }
      return handler(error);
    }
  }
}

/**
 * Deferrable promise
 */
export class Deferred<T> {
  promise: Promise<T>;
  reject!: (reason?: any) => void;
  resolve!: (value: T) => void;

  constructor(value?: T | null) {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject
      this.resolve = resolve
    })

    if(value) {
      this.resolve(value);
    }
  }
}
