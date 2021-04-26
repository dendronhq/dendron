export const matchAll = (
  pattern: RegExp,
  text: string
): Array<RegExpMatchArray> => {
  let match: RegExpMatchArray | null;
  const out: RegExpMatchArray[] = [];

  pattern.lastIndex = 0;

  while ((match = pattern.exec(text))) {
    out.push(match);
  }

  return out;
};

// https://stackoverflow.com/questions/18082/validate-decimal-numbers-in-javascript-isnumeric/1830844#1830844
export const isNumeric = (n: any) => {
  return !isNaN(parseInt(n)) && isFinite(n);
};
