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
import { DendronConfig, DVault } from "./types";

export type NoteIndexProps = {
  id: string;
  title: string;
  fname: string;
  vault: DVault;
  updated: number;
  stub?: boolean;
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
 * 'rename' matched 'dendron.scratch.2020.11.07.publish-under-original-filenames' with 0.16.
 * Which would prompt lowering the value below 0.3. However:
 * 'dendron' matched misspelled 'dendorn' & 'dendorn.sop' at 0.28. Which
 * could be quite nice to match/find/fix misspells like this hence for now leaving it at 0.3.
 *
 * For reference
 * 'dendron rename' matches 'dendron.dev.design.commands.rename' with 0.001.
 *
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
const THRESHOLD_VALUE = 0.3;

function createFuse<T>(
  initList: T[],
  opts: Fuse.IFuseOptions<any> & {
    exactMatch: boolean;
    preset: "schema" | "note";
  }
) {
  const options: Fuse.IFuseOptions<any> = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : THRESHOLD_VALUE,
    distance: 15,
    minMatchCharLength: 2,
    keys: ["fname"],
    useExtendedSearch: true,
    includeScore: true,
    // As long as we have ignoreLocation set to true location the location
    // value should be ignored.
    location: 0,
    ignoreLocation: true,
    ignoreFieldNorm: true,
  };
  if (opts.preset === "schema") {
    options.keys = ["fname", "id"];
  }
  const fuse = new Fuse(initList, options);
  return fuse;
}

type FuseEngineOpts = {
  mode?: DEngineMode;
};

export class FuseEngine {
  public notesIndex: Fuse<NoteIndexProps>;
  public schemaIndex: Fuse<SchemaProps>;

  constructor(opts: FuseEngineOpts) {
    this.notesIndex = createFuse<NoteProps>([], {
      exactMatch: opts.mode === "exact",
      preset: "note",
    });
    this.schemaIndex = createFuse<SchemaProps>([], {
      exactMatch: opts.mode === "exact",
      preset: "schema",
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
      const results = this.schemaIndex.search(
        FuseEngine.formatQueryForFuse({ qs })
      );
      items = _.map(results, (resp) => resp.item);
    }
    return items;
  }

  /**
   * If qs = "", return root note
   * @param qs query string.
   * @returns
   */
  queryNote({ qs }: { qs: string }): NoteIndexProps[] {
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
      const fuseQueryString = FuseEngine.formatQueryForFuse({
        qs,
      });
      let results = this.notesIndex.search(fuseQueryString);
      results = FuseEngine.sortMatchingScores(results);

      items = _.map(results, (resp) => resp.item);
    }
    return items;
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

  /**
   * Fuse does not appear to see [*] as anything special.
   * For example:
   * `dev*vs` matches `dendron.dev.ref.vscode` with score of 0.5
   *
   * To compare with
   * `dev vs` matches `dendron.dev.ref.vscode` with score of 0.001
   *
   * Fuse extended search https://fusejs.io/examples.html#extended-search
   * uses spaces for AND and '|' for OR hence this function will replace '*' with spaces.
   * We do this replacement since VSCode quick pick actually appears to respect '*'.
   * */
  static formatQueryForFuse({ qs }: { qs: string }): string {
    return qs.split("*").join(" ");
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

  static fetchRootResults = (
    notes: NotePropsDict,
    opts?: Partial<{ config: DendronConfig }>
  ) => {
    const roots: NoteProps[] =
      opts?.config?.site.siteHierarchies === ["root"]
        ? NoteUtils.getRoots(notes)
        : opts!.config!.site.siteHierarchies.flatMap((fname) =>
            NoteUtils.getNotesByFname({ fname, notes })
          );
    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const nodes = _.map(childrenOfRoot, (ent) => notes[ent]).concat(roots);
    return nodes;
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
    const resp = await engine.queryNotes({ qs });
    let nodes: NoteProps[];
    if (showDirectChildrenOnly) {
      const depth = qs.split(".").length;
      nodes = resp.data
        .filter((ent) => {
          return DNodeUtils.getDepth(ent) === depth;
        })
        .filter((ent) => !ent.stub);
    } else {
      nodes = resp.data;
    }
    if (nodes.length > PAGINATE_LIMIT) {
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    }
    return nodes;
  }

  static slashToDot(ent: string) {
    return ent.replace(/\//g, ".");
  }
}
