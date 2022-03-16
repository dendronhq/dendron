export function makeResponse<T>(resp: T) {
  return Promise.resolve({
    ...resp,
  });
}

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
