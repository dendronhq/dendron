export {};

/** Array extension methods. */
declare global {
  interface Array<T> {
    /** Extension method returns true when array has elements, false otherwise. */
    hasElements(): boolean;
  }
}

Array.prototype.hasElements = function <T>(): boolean {
  const arr = this as Array<T>;
  return arr.length > 0;
};
