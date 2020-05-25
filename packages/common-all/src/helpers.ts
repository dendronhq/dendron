export function makeResponse<T>(resp: T) {
  return Promise.resolve({
    ...resp,
  });
}
