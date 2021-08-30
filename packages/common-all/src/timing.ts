const NANOS_IN_SECOND = 1000000000;
const NANOS_IN_MILLI_SEC = 1000000;

/** Return current nanoseconds. */
export const nanos = () => {
  let hrTime = process.hrtime();
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
