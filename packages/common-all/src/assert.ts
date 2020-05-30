export function assert(statement: boolean, msg: string) {
  if (!statement) {
    throw new Error(msg);
  } else {
    return true;
  }
}
