import { TransformedQueryString } from "./types";
import { PickerUtilsV2 } from "./utils";
import { FuseExtendedSearchConstants } from "@dendronhq/common-all";

function wikiTransform(trimmedQuery: string) {
  let vaultName;
  // Remove the '[[' ']]' decoration.
  let transformed = trimmedQuery.slice(2, -2);

  // Process description such as [[some description|some.note]]
  if (transformed.includes("|")) {
    transformed = transformed.slice(transformed.indexOf("|") + 1);
  }

  // Process header value. For now we will remove the header since its
  // not yet indexed within our look up engine.
  if (transformed.includes("#")) {
    transformed = transformed.slice(0, transformed.indexOf("#"));
  }

  if (transformed.includes("dendron://")) {
    // https://regex101.com/r/ICcyK6/1/
    vaultName = transformed.match(/dendron:\/\/(.*?)\//)?.[1];

    transformed = transformed.slice(transformed.lastIndexOf("/") + 1);
  }

  return {
    queryString: transformed,
    wasMadeFromWikiLink: true,
    vaultName,
  };
}

/**
 *
 * Special cases:
 *
 * Ends with '.':
 * We have logic around for lookups that expects special behavior when lookup
 * ends with '.' for example GoDown command expects logic such that ending
 * the lookup with '.' expects only children to be shown.
 * */
function regularTransform(
  trimmedQuery: string,
  onlyDirectChildren: boolean | undefined
): TransformedQueryString {
  // Regular processing:
  let queryString = PickerUtilsV2.slashToDot(trimmedQuery);
  let splitByDots: string[] | undefined;

  if (!onlyDirectChildren && !queryString.endsWith(".")) {
    // When we are doing direct children lookup we want exact matches of the hierarchy
    // Hence we would not be splitting by dots, more info on split by dots in
    // {@link TransformedQueryString.splitByDots} documentation.
    //
    // https://regex101.com/r/vMwX9C/2
    const dotCandidateMatch = queryString.match(/(^[^\s]*?\.[^\s]*)/);
    if (dotCandidateMatch) {
      const dotCandidate = dotCandidateMatch[1];

      splitByDots = dotCandidate.split(".");

      queryString = queryString.replace(dotCandidate, splitByDots.join(" "));
    }
  }

  // When querying for children of the note then the prefix should match exactly.
  if (
    (onlyDirectChildren || queryString.endsWith(".")) &&
    !queryString.startsWith(FuseExtendedSearchConstants.PrefixExactMatch)
  ) {
    queryString = FuseExtendedSearchConstants.PrefixExactMatch + queryString;
  }

  return {
    queryString,
    wasMadeFromWikiLink: false,
    splitByDots,
    onlyDirectChildren,
  };
}

export function transformQueryString({
  pickerValue,
  onlyDirectChildren,
}: {
  pickerValue: string;
  onlyDirectChildren?: boolean | undefined;
}): TransformedQueryString {
  const trimmed = pickerValue.trim();

  // Detect wiki link decoration and apply wiki link processing
  if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) {
    return wikiTransform(trimmed);
  } else {
    return regularTransform(trimmed, onlyDirectChildren);
  }
}
