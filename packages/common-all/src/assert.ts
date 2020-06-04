export class AssertionError extends Error {}
export function assert(statement: boolean, msg: string) {
  if (!statement) {
    throw new AssertionError(msg);
  } else {
    return true;
  }
}
