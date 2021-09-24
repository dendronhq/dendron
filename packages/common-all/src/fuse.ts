import Fuse from "fuse.js";
import _ from "lodash";
import {
  DEngineMode,
  SchemaProps,
  NoteProps,
  SchemaModuleDict,
  SchemaUtils,
  NotePropsDict,
  SchemaModuleProps,
  NoteUtils,
  DNodeUtils,
  DEngineClient,
} from ".";
import { DVault } from "./types";

export type NoteIndexProps = {
  id: string;
  title: string;
  fname: string;
  vault: DVault;
  updated: number;
  stub?: boolean;
};

/** https://fusejs.io/examples.html#extended-search */
const FuseExtendedSearchConstants = {
  PrefixExactMatch: "^",
};

/**
 * Experimentally set.
 *
 * At the time of testing:
 *
 * At previous threshold of 0.5 string 'dendron' matched
 * 'scratch.2021.06.15.104331.make-sure-seeds-are-initialized-on-startup' with score 0.42.
 * Which is too fuzzy of a match.
 *
 * 'rename' fuzzy matches 'dendron.scratch.2020.11.07.publish-under-original-filenames' with 0.16.
 *
 * For reference
 * 'dendron rename' matches 'dendron.dev.design.commands.rename' with 0.001.
 *
 * Having this score too high gets too unrelated matches which pushes the
 * 'Create New' entry out of the view.
 * --------------------------------------------------------------------------------
 *
 * Note if you are going to be tweaking this value it is highly suggested to add a
 * temporary piece of code To be able to see the all the results that are matched by
 * fuse engine along with their scores, inside {@link FuseEngine.queryNote}
 * */
//       const dir = `<YOUR-DIR>/${qs}`;
//       try{
//         require('fs').mkdirSync(dir)
//       }catch (e){
//       }
//       const data = JSON.stringify(
//         {
//           qs: qs,
//           fuseQueryString: fuseQueryString,
//           results:results
//         });
//       const path = `${dir}/${THRESHOLD_VALUE}_${new Date().getTime()}.json`;
//       require('fs').writeFile(path, data, ()=>{});
const THRESHOLD_VALUE = 0.2;

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
  publishedNotes: NotePropsDict | NoteProps[],
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
  publishedNotes: NotePropsDict | NoteProps[],
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
    this.threshold = opts.mode === "exact" ? 0.0 : THRESHOLD_VALUE;

    this.notesIndex = createFuse<NoteProps>([], {
      preset: "note",
      threshold: this.threshold,
    });
    this.schemaIndex = createFuse<SchemaProps>([], {
      preset: "schema",
      threshold: this.threshold,
    });
  }

  async querySchema({ qs }: { qs: string }): Promise<SchemaProps[]> {
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
   * @returns
   */
  queryNote({
    qs,
    onlyDirectChildren,
  }: {
    qs: string;
    onlyDirectChildren?: boolean;
  }): NoteIndexProps[] {
    let items: NoteIndexProps[];

    if (qs === "") {
      const results = this.notesIndex.search("root");
      items = _.map(
        _.filter(results, (ent) => ent.item.fname === "root"),
        (ent) => ent.item
      );
    } else if (qs === "*") {
      // @ts-ignore
      items = this.notesIndex._docs as NoteProps[];
    } else {
      const formattedQS = FuseEngine.formatQueryForFuse({
        qs,
        onlyDirectChildren,
      });

      let results = this.notesIndex.search(formattedQS);

      results = this.postQueryFilter({
        results,
        queryString: formattedQS,
        onlyDirectChildren,
      });

      results = FuseEngine.sortMatchingScores(results);

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

  async updateSchemaIndex(schemas: SchemaModuleDict) {
    this.schemaIndex.setCollection(
      _.map(_.values(schemas), (ent) => SchemaUtils.getModuleRoot(ent))
    );
  }

  async updateNotesIndex(notes: NotePropsDict) {
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

  async removeNoteFromIndex(note: NoteProps) {
    this.notesIndex.remove((doc) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === note.id;
    });
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

  static formatQueryForFuse({
    qs,
    onlyDirectChildren,
  }: {
    qs: string;
    onlyDirectChildren?: boolean;
  }): string {
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
    let result = qs.split("*").join(" ");

    // When querying for direct children the prefix should match exactly.
    if (
      onlyDirectChildren &&
      !result.startsWith(FuseExtendedSearchConstants.PrefixExactMatch)
    ) {
      result = FuseExtendedSearchConstants.PrefixExactMatch + result;
    }

    return result;
  }

  /**
   * When there are multiple items with exact same score apply sorting
   * within that group of elements. (The items with better match scores
   * should still come before elements with worse match scores).
   * */
  static sortMatchingScores(
    results: Fuse.FuseResult<NoteIndexProps>[]
  ): Fuse.FuseResult<NoteIndexProps>[] {
    const groupedByScore = _.groupBy(results, (r) => r.score);

    // lodash group by makes strings out of number hence to sort scores
    // we will parse them back into a number keeping the key string.
    const scores = _.keys(groupedByScore).map((stringKey) => ({
      key: stringKey,
      score: Number.parseFloat(stringKey),
    }));

    // We want ascending scores since the lowest score represents the best match.
    scores.sort((a, b) => a.score - b.score);

    // We want the items with the same match scores to be sorted by
    // descending order of their update date. And if the item is a
    // stub it should go towards the end of the same match group.
    for (const score of scores) {
      const sameScoreMatches = groupedByScore[score.key];

      const [stubs, notes] = _.partition(sameScoreMatches, (m) => m.item.stub);

      notes.sort((a, b) => {
        return b.item.updated - a.item.updated;
      });

      groupedByScore[score.key] = [...notes, ...stubs];
    }

    return scores.map((score) => groupedByScore[score.key]).flat();
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
      results = results.filter(
        (r) =>
          r.item.fname.length > queryString.length ||
          r.item.fname === queryString
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

const PAGINATE_LIMIT = 50;

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

  static fetchRootResults = (notes: NotePropsDict) => {
    const roots: NoteProps[] = NoteUtils.getRoots(notes);

    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const childrenOfRootNotes = _.map(childrenOfRoot, (ent) => notes[ent]);
    return roots.concat(childrenOfRootNotes);
  };

  static async lookup({
    qs,
    engine,
    showDirectChildrenOnly,
  }: {
    qs: string;
    engine: DEngineClient;
    showDirectChildrenOnly?: boolean;
  }): Promise<NoteProps[]> {
    const { notes } = engine;
    const qsClean = this.slashToDot(qs);
    if (_.isEmpty(qsClean)) {
      return NoteLookupUtils.fetchRootResults(notes);
    }
    const resp = await engine.queryNotes({
      qs,
      onlyDirectChildren: showDirectChildrenOnly,
    });
    let nodes = resp.data;

    if (nodes.length > PAGINATE_LIMIT) {
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    }
    return nodes;
  }

  static slashToDot(ent: string) {
    return ent.replace(/\//g, ".");
  }
}
