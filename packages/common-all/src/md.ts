export function isAlias(pageTitle: string) {
  return pageTitle.indexOf("|") !== -1;
}

export const ALIAS_DIVIDER = "|";

/** A regexp fragment that matches a link name (e.g. a note name) */
export const LINK_NAME = "[^#\\|>\\]\\[\\n]+";
export const LINK_NAME_NO_SPACES = "[^#\\|>\\]\\[\\n\\s]+";
/** A regexp fragment that matches an alias name */
export const ALIAS_NAME = "[^\\|>\\]\\[\\n]+"; // aliases may contain # symbols
/** A regexp fragment that matches the contents of a link (without the brackets) */
export const LINK_CONTENTS =
  "" +
  // alias?
  `(` +
  `(?<alias>${ALIAS_NAME}(?=\\|))` +
  "\\|" +
  ")?" +
  // name
  `(?<value>${LINK_NAME})?` +
  // anchor?
  `(#(?<anchor>${LINK_NAME}))?` +
  // filters?
  `(>(?<filtersRaw>.*))?`;
