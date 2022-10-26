export function getIntegerString(value: number | undefined | null): string {
  if (value) {
    return `${value.toString()}`;
  }
  return "null";
}

export function getJSONString(value: any): string {
  if (value) {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return "null";
}

export function getSQLValueString(value: string | null | undefined): string {
  if (value) {
    return `'${value.replace(/'/g, "''")}'`; // Single quotes need to be escaped in SQLite
  }
  return "null";
}

export function getSQLBoolean(value: boolean | undefined): string {
  return value ? "1" : "0";
}
