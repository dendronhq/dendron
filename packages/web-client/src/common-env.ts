import _ from "lodash";

export function getOrThrow<T = any>(obj: T, k: keyof T) {
  const maybeValue = obj[k];
  if (_.isUndefined(maybeValue)) {
    throw `no ${k} in ${obj}`;
  }
  return maybeValue;
}
