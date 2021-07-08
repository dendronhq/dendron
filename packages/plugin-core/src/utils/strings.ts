export const matchAll = (
  pattern: RegExp,
  text: string
): Array<RegExpMatchArray> => {
  let match: RegExpMatchArray | null;
  const out: RegExpMatchArray[] = [];

  pattern.lastIndex = 0;

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(text))) {
    out.push(match);
  }

  return out;
};
