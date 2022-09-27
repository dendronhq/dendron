import Fuse from "fuse.js";
import _, { ListIterator, NotVoid } from "lodash";
import {
  ConfigUtils,
  DEngineMode,
  DNodeUtils,
  NoteProps,
  NotePropsByIdDict,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaProps,
  SchemaUtils,
} from ".";
import { NoteChangeEntry } from "./types";
import { DVault } from "./types/DVault";
import { levenshteinDistance } from "./util/stringUtil";

export type NoteIndexProps = {
  id: string;
  title: string;
  fname: string;
  vault: DVault;
  updated: number;
  stub?: boolean;
};

/** https://fusejs.io/examples.html#extended-search */
export const FuseExtendedSearchConstants = {
  PrefixExactMatch: "^",
};

function createFuse<T>(
  initList: T[],
  opts: Fuse.IFuseOptions<T> & {
    preset: "schema" | "note";
  },
  index?: Fuse.FuseIndex<T>
) {
  const options: Fuse.IFuseOptions<T> = {
    shouldSort: true,
    threshold: opts.threshold,
    distance: 15,
    minMatchCharLength: 1,
    keys: ["fname"],
    useExtendedSearch: true,
    includeScore: true,
    // As long as we have ignoreLocation set to true location the location
    // value should be ignored.
    location: 0,
    ignoreLocation: true,
    ignoreFieldNorm: true,
    ...opts,
  };
  if (opts.preset === "schema") {
    options.keys = ["fname", "id"];
  }
  const fuse = new Fuse(initList, options, index);
  return fuse;
}

export function createFuseNote(
  publishedNotes: NotePropsByIdDict | NoteProps[],
  overrideOpts?: Partial<Fuse.IFuseOptions<NoteProps>>,
  index?: Fuse.FuseIndex<NoteProps>
) {
  let notes: NoteProps[];
  if (_.isArray(publishedNotes)) notes = publishedNotes;
  else notes = Object.values(publishedNotes);
  return createFuse(
    notes,
    {
      preset: "note",
      keys: ["title", "body"],
      includeMatches: true,
      includeScore: true,
      findAllMatches: true,
      useExtendedSearch: true,
      ...overrideOpts,
    },
    index
  );
}

export function createSerializedFuseNoteIndex(
  publishedNotes: NotePropsByIdDict | NoteProps[],
  overrideOpts?: Partial<Parameters<typeof createFuse>[1]>
) {
  return createFuseNote(publishedNotes, overrideOpts).getIndex().toJSON();
}

export type FuseNote = Fuse<NoteProps>;
export type FuseNoteIndex = Fuse.FuseIndex<NoteProps>;
export type SerializedFuseIndex = ReturnType<
  typeof createSerializedFuseNoteIndex
>;

type FuseEngineOpts = {
  mode?: DEngineMode;
  /** If specified must be within 0-1 range. */
  fuzzThreshold: number;
};

type SortOrderObj = {
  orderBy: ListIterator<
    Fuse.FuseResult<NoteIndexProps> & { levenshteinDist: number },
    NotVoid
  >;
  order: "asc" | "desc";
};

export const getCleanThresholdValue = (configThreshold: number) => {
  if (configThreshold < 0 || configThreshold > 1) {
    // Setting threshold to fallback threshold value in case configuration is incorrect.
    return ConfigUtils.getLookup(ConfigUtils.genDefaultConfig()).note
      .fuzzThreshold;
  }

  return configThreshold;
};

export class FuseEngine {
  /**
   * Characters that are specially treated by FuseJS search
   * Reference https://fusejs.io/examples.html#extended-search
   *
   * Includes '*' which is not specially treated by FuseJS but we currently
   * map '*' to ' ' which specially treated by FuseJS.
   */
  private static readonly SPECIAL_QUERY_CHARACTERS = [
    "*",
    " ",
    "|",
    "^",
    "$",
    "!",
    "=",
    "'",
  ];

  public notesIndex: Fuse<NoteIndexProps>;
  public schemaIndex: Fuse<SchemaProps>;

  private readonly threshold: number;

  constructor(opts: FuseEngineOpts) {
    this.threshold =
      opts.mode === "exact" ? 0.0 : getCleanThresholdValue(opts.fuzzThreshold);

    this.notesIndex = createFuse<NoteProps>([], {
      preset: "note",
      threshold: this.threshold,
    });
    this.schemaIndex = createFuse<SchemaProps>([], {
      preset: "schema",
      threshold: this.threshold,
    });
  }

  querySchema({ qs }: { qs: string }): SchemaProps[] {
    let items: SchemaProps[];
    if (qs === "") {
      const results = this.schemaIndex.search("root");
      items = [results[0].item];
    } else if (qs === "*") {
      // @ts-ignore
      items = this.schemaIndex._docs;
    } else {
      let results = this.schemaIndex.search(
        FuseEngine.formatQueryForFuse({ qs })
      );

      results = this.filterByThreshold(results);

      items = _.map(results, (resp) => resp.item);
    }
    return items;
  }

  /**
   * If qs = "", return root note
   * @param qs query string.
   * @param onlyDirectChildren query for direct children only.
   * @param originalQS original query string that was typed by the user.
   * @returns
   */
  queryNote({
    qs,
    onlyDirectChildren,
    originalQS,
  }: {
    qs: string;
    onlyDirectChildren?: boolean;
    originalQS: string;
  }): NoteIndexProps[] {
    let items: NoteIndexProps[];

    if (qs === "") {
      const results = this.notesIndex.search("root");
      items = _.map(
        _.filter(results, (ent) => ent.item.fname === "root"),
        (ent) => ent.item
      );
      /// seearch eveyrthing
    } else if (qs === "*") {
      // @ts-ignore
      items = this.notesIndex._docs as NoteProps[];
    } else {
      const formattedQS = FuseEngine.formatQueryForFuse({ qs });

      let results = this.notesIndex.search(formattedQS);

      results = this.postQueryFilter({
        results,
        queryString: formattedQS,
        onlyDirectChildren,
      });

      if (originalQS === undefined) {
        // TODO: add log WARN (does not appear to be easily accessible logger in common-all)
        originalQS = qs;
      }
      results = FuseEngine.sortResults({ results, originalQS });

      items = _.map(results, (resp) => resp.item);
    }
    return items;
  }

  private filterByThreshold<T>(results: Fuse.FuseResult<T>[]) {
    // TODO: Try to isolate and submit a bug to FuseJS.
    //
    // There appears to be a bug in FuseJS that sometimes it gives results with much higher
    // score than the threshold. From my understanding it should not do such thing.
    // Hence for now we will filter the results ourselves to adhere to threshold.
    //
    // Example data that was matched:
    // Querying for 'user.hikchoi.discussions.himewhat' with threshold of 0.2
    // Matched:
    // 'user.hikchoi.discussions.this' with 0.59375
    // 'user.hikchoi.discussions.triage-plans' with 0.59375
    // 'user.hikchoi.discussions.note-graph-glitch' with 0.59375
    // Other notes were matched with score of under 0.2
    // 'user.hikchoi.discussions.deleting-notes-with-links' with 0.1875
    // In fact all the notes I saw thus far that were out of threshold range were with '0.59375'
    return results.filter((r) => r.score! <= this.threshold);
  }

  async replaceSchemaIndex(schemas: SchemaModuleDict) {
    this.schemaIndex.setCollection(
      _.map(_.values(schemas), (ent) => SchemaUtils.getModuleRoot(ent))
    );
  }

  async replaceNotesIndex(notes: NotePropsByIdDict) {
    this.notesIndex.setCollection(
      _.map(notes, ({ fname, title, id, vault, updated, stub }, _key) => ({
        fname,
        id,
        title,
        vault,
        updated,
        stub,
      }))
    );
  }

  async updateNotesIndex(noteChanges: NoteChangeEntry[]) {
    noteChanges.forEach((change) => {
      switch (change.status) {
        case "create": {
          this.addNoteToIndex(change.note);
          break;
        }
        case "delete": {
          this.removeNoteFromIndex(change.note);
          break;
        }
        case "update": {
          // Fuse has no update. Must remove old and add new
          this.removeNoteFromIndex(change.prevNote);
          this.addNoteToIndex(change.note);
          break;
        }
        default:
          break;
      }
    });
  }

  async removeNoteFromIndex(note: NoteProps) {
    this.notesIndex.remove((doc) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === note.id;
    });
  }

  async addNoteToIndex(note: NoteProps) {
    const indexProps: NoteIndexProps = _.pick(note, [
      "fname",
      "id",
      "title",
      "vault",
      "updated",
      "stub",
    ]);

    this.notesIndex.add(indexProps);
  }

  async addSchemaToIndex(schema: SchemaModuleProps) {
    this.schemaIndex.add(SchemaUtils.getModuleRoot(schema));
  }

  async removeSchemaFromIndex(smod: SchemaModuleProps) {
    this.schemaIndex.remove((doc: SchemaProps) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === SchemaUtils.getModuleRoot(smod).id;
    });
  }

  /**
   * Fuse does not support '*' as a wildcard. This replaces the `*` to a fuse equivalent
   * to make the engine do the right thing
   */
  static formatQueryForFuse({ qs }: { qs: string }): string {
    // Fuse does not appear to see [*] as anything special.
    // For example:
    // `dev*vs` matches `dendron.dev.ref.vscode` with score of 0.5
    //
    // To compare with
    // `dev vs` matches `dendron.dev.ref.vscode` with score of 0.001
    //
    // Fuse extended search https://fusejs.io/examples.html#extended-search
    // uses spaces for AND and '|' for OR hence this function will replace '*' with spaces.
    // We do this replacement since VSCode quick pick actually appears to respect '*'.
    return qs.split("*").join(" ");
  }

  /**
   * When there are multiple items with exact same score apply sorting
   * within that group of elements. (The items with better match scores
   * should still come before elements with worse match scores).
   * */
  static sortResults({
    results,
    originalQS,
  }: {
    results: Fuse.FuseResult<NoteIndexProps>[];
    originalQS: string;
  }): Fuse.FuseResult<NoteIndexProps>[] {
    if (results.length === 0) return [];

    const sortOrder: SortOrderObj[] = [
      // We want match scores to be ascending since the lowest score
      // represents the best match. We first group sort by FuseJS score
      // Subsequently applying other sorts if the FuseJS score matches.
      {
        orderBy: (item) => item.score,
        order: "asc",
      },
      // if the item is a stub it should go towards the end of the same score match group.
      {
        orderBy: (item) => item.item.stub,
        order: "desc",
      },
      // Lowest distance is the closer match hence sort in ascending order.
      {
        orderBy: (item) => item.levenshteinDist,
        order: "asc",
      },
      // We want the items with the same match scores to be sorted by
      // descending order of their update date.
      {
        orderBy: (item) => item.item.updated,
        order: "desc",
      },
    ];

    const sorted = _.orderBy(
      results.map((res) => ({
        ...res,
        levenshteinDist: levenshteinDistance(res.item.fname, originalQS),
      })),
      sortOrder.map((v) => v.orderBy),
      sortOrder.map((v) => v.order)
    );

    // Pull up exact match if it exists.
    if (originalQS) {
      const idx = sorted.findIndex((res) => res.item.fname === originalQS);
      if (idx !== -1) {
        const [spliced] = sorted.splice(idx, 1);
        sorted.unshift(spliced);
      }
    }

    return sorted;
  }

  private postQueryFilter({
    results,
    queryString,
    onlyDirectChildren,
  }: {
    results: Fuse.FuseResult<NoteIndexProps>[];
    queryString: string;
    onlyDirectChildren?: boolean;
  }) {
    // Filter by threshold due to what appears to be a FuseJS bug
    results = this.filterByThreshold(results);

    if (!FuseEngine.doesContainSpecialQueryChars(queryString)) {
      // When we use query language operators this filtering does not apply
      // since we can query the entry with a much longer query than file name length.
      // For example query fname="hi-world" with query="^hi world$ !bye".
      //
      // For cases of simple file names (do not contain special query chars):
      // Filter out matches that are same length or less as query string but
      // are not exact.
      //
      // For example
      // 'user.nickolay.journal.2021.09.03'
      // matches
      // 'user.nickolay.journal.2021.09.02'
      // with a super low score of '0.03' but we don't want to display all the journal
      // dates with the same length. Hence whenever the length of our query is equal
      // or longer than the query results, we want to create a new note, not show those results.

      const lowerCaseQueryString = queryString.toLowerCase();
      results = results.filter(
        (r) =>
          r.item.fname.length > queryString.length ||
          r.item.fname.toLowerCase() === lowerCaseQueryString
      );
    }

    if (onlyDirectChildren) {
      const depth = queryString.split(".").length;
      results = results
        .filter((ent) => {
          return DNodeUtils.getFNameDepth(ent.item.fname) === depth;
        })
        .filter((ent) => !ent.item.stub);
    }

    return results;
  }

  /**
   * Returns true when string contains characters that FuseJS treats as special characters.
   * */
  static doesContainSpecialQueryChars(str: string) {
    return this.SPECIAL_QUERY_CHARACTERS.some((char) => str.includes(char));
  }
}
