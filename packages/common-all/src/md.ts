export function isAlias(pageTitle: string) {
  return pageTitle.indexOf("|") !== -1;
}

export function parseAliasLink(pageTitle: string) {
  const [alias, value] = pageTitle.split("|");
  return { alias, value };
}

export function doBond() {
  console.log("I am a bond");
  return "bond";
}

export class BondClass {
  static sayJames() {
    return "bond";
  }
}