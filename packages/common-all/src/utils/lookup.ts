import _ from "lodash";
import {
  DEngineClient,
  FuseExtendedSearchConstants,
  NoteProps,
  NotePropsByIdDict,
  NoteUtils,
  ReducedDEngine,
} from "..";

const PAGINATE_LIMIT = 50;

export type TransformedQueryString = {
  /** Transformed query string value.   */
  queryString: string;

  /**
   * This will be set to true when the query string had wiki link decoration
   * (Eg. [[some.note]]) and that decoration has been stripped out to be able
   * to query for the content of the wiki link.
   * */
  wasMadeFromWikiLink: boolean;

  /**
   * We split by dots to allow for hierarchy matches that have the inside
   * part of the hierarchy omitted.
   *
   * For example if we have a query such as: `h1.h4` we want to match results
   * like `h1.h2.h3.h4` however FuseJS sees `h1.h4` as a single token hence
   * `h1.h2.h3.h4` won't be matched (without ramping up fuzz threshold)
   * So what we are going to to do is split `h1.h4` into `h1 h4` in our transformed
   * queryString for fuse JS to see `h1` and `h4` as two separate tokens.
   * With `h1` and `h4` seen as separate tokens FuseJS will also match out of order
   * notes such as `h4.h1` hence we keep this array to filter out results that
   * match the order.
   *
   * When we are splitting by dots we will only be performing the split on the first
   * part of the query string, to allow other tokens to be used with the split by dots
   * as example querying for 'h1.h4 hi' will match all the values that are within the
   * 'h1...h4...' hierarchy that also contain token 'hi'.
   * */
  splitByDots?: string[];

  /**
   * If there is clear vault name within the query will be set to such vault name
   * otherwise it will be undefined.
   * */
  vaultName?: string;

  /**
   * Set to true when we only want to match direct children of the hierarchy. */
  onlyDirectChildren?: boolean;

  /** Original query string value */
  originalQuery: string;
};

export class NoteLookupUtils {
  /**
   * Get qs for current level of the hierarchy
   * @param qs
   * @returns
   */
  static getQsForCurrentLevel = (qs: string) => {
    const lastDotIndex = qs.lastIndexOf(".");
    return lastDotIndex < 0 ? "" : qs.slice(0, lastDotIndex + 1);
  };

  static fetchRootResultsFromEngine = async (engine: ReducedDEngine) => {
    // TODO: Support findNotesMeta
    const roots = await engine.findNotes({ fname: "root" });

    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const childrenOfRootNotes = await engine.bulkGetNotes(childrenOfRoot);
    return roots.concat(childrenOfRootNotes.data);
  };

  static fetchRootResults = (notes: NotePropsByIdDict) => {
    const roots: NoteProps[] = NoteUtils.getRoots(notes);

    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const childrenOfRootNotes = _.map(childrenOfRoot, (ent) => notes[ent]);
    return roots.concat(childrenOfRootNotes);
  };
  /**
   * The core of Dendron lookup logic
   */
  static async lookup({
    qsRaw,
    engine,
    showDirectChildrenOnly,
  }: {
    qsRaw: string;
    engine: DEngineClient;
    showDirectChildrenOnly?: boolean;
  }): Promise<NoteProps[]> {
    const qsClean = this.slashToDot(qsRaw);

    // special case: if query is empty, fetch top level notes
    if (_.isEmpty(qsClean)) {
      return NoteLookupUtils.fetchRootResultsFromEngine(engine);
    }

    // otherwise, query engine for results
    const transformedQuery = NoteLookupUtils.transformQueryString({
      query: qsRaw,
      onlyDirectChildren: showDirectChildrenOnly,
    });
    const resp = await engine.queryNotes({
      qs: transformedQuery.queryString,
      originalQS: qsRaw,
      onlyDirectChildren: showDirectChildrenOnly,
    });

    // limit number of results. currently, this is hardcoded and we don't paginate
    // this is okay because we rely on user refining query to get more results
    let nodes = resp.data;

    if (!nodes) {
      return [];
    }

    if (nodes.length > PAGINATE_LIMIT) {
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    }
    return nodes;
  }

  static slashToDot(ent: string) {
    return ent.replace(/\//g, ".");
  }

  /**
   * Transform Dendron lookup syntax to fusejs syntax
   * - if wiki string, strip out wiki links
   */
  static transformQueryString({
    query,
    onlyDirectChildren,
  }: {
    query: string;
    onlyDirectChildren?: boolean | undefined;
  }): TransformedQueryString {
    const trimmed = query.trim();

    // Detect wiki link decoration and apply wiki link processing
    if (trimmed.startsWith("[[") && trimmed.endsWith("]]")) {
      return wikiTransform(trimmed);
    } else {
      return regularTransform(trimmed, onlyDirectChildren);
    }
  }
}

function wikiTransform(trimmedQuery: string): TransformedQueryString {
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
    originalQuery: trimmedQuery,
    queryString: transformed,
    wasMadeFromWikiLink: true,
    vaultName,
  };
}

/**
 *
 * Special cases:
 *
 * - Contains '.' without spaces:
 *   - 'h1.h4' -> to 'h1 h4' (this allows us to find intermediate levels of hierarchy)
 * - Ends with '.':
 *   - We have logic around for lookups that expects special behavior when lookup
 *     ends with '.' for example GoDown command expects logic such that ending
 *     the lookup with '.' expects only children to be shown.
 * */
function regularTransform(
  trimmedQuery: string,
  onlyDirectChildren: boolean | undefined
): TransformedQueryString {
  // Regular processing:
  let queryString = NoteLookupUtils.slashToDot(trimmedQuery);
  let splitByDots: string[] | undefined;

  // When we are doing direct children lookup & when query ends with '.' we want exact
  // matches of the query. Hence we would not be splitting by dots, more info
  // on split by dots in {@link TransformedQueryString.splitByDots} documentation.
  if (!onlyDirectChildren && !queryString.endsWith(".")) {
    // https://regex101.com/r/vMwX9C/2
    const dotCandidateMatch = queryString.match(/(^[^\s]*?\.[^\s]*)/);
    if (dotCandidateMatch) {
      const dotCandidate = dotCandidateMatch[1];

      splitByDots = dotCandidate.split(".");

      queryString = queryString.replace(dotCandidate, splitByDots.join(" "));
    }
  }

  // When querying for direct children of the note then the prefix should match exactly.
  if (
    onlyDirectChildren &&
    !queryString.startsWith(FuseExtendedSearchConstants.PrefixExactMatch)
  ) {
    queryString = FuseExtendedSearchConstants.PrefixExactMatch + queryString;
  }

  return {
    originalQuery: trimmedQuery,
    queryString,
    wasMadeFromWikiLink: false,
    splitByDots,
    onlyDirectChildren,
  };
}
