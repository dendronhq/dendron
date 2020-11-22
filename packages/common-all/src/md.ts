export function isAlias(pageTitle: string) {
  return pageTitle.indexOf("|") !== -1;
}

export function parseAliasLink(pageTitle: string) {
  const [alias, value] = pageTitle.split("|");
  return { alias, value };
}
