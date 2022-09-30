import Fuse from "fuse.js";
import _ from "lodash";
import { ERROR_SEVERITY, ERROR_STATUS } from "../constants";
import { DendronError } from "../error";
import { FuseEngine } from "../FuseEngine";
import { NotePropsByFnameDict, NotePropsMeta, RespV3 } from "../types";
import { FindNoteOpts } from "../types/FindNoteOpts";
import { IDataQueryable } from "./IDataQueryable";
import { IDataStore } from "./IDataStore";
import {
  ok,
  Ok,
  err,
  Err,
  Result,
  okAsync,
  errAsync,
  ResultAsync,
  fromThrowable,
  fromPromise,
  fromSafePromise,
} from "neverthrow";

export class FuseMetadataStore
  implements
    IDataStore<string, NotePropsMeta>, // TODO: Instead of NotePropsMeta, use a generic so this also works with Schemas
    IDataQueryable<string, NotePropsMeta[]>
{
  private notesIndex: Fuse<NotePropsMeta>;

  private createFuse<T>(
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
      keys: ["fname", "id", "vault"],
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

  private readonly threshold: number;

  constructor() {
    // this.threshold =
    // opts.mode === "exact" ? 0.0 : getCleanThresholdValue(opts.fuzzThreshold);

    this.threshold = 0.2; // JYTODO

    this.notesIndex = this.createFuse<NotePropsMeta>([], {
      preset: "note",
      threshold: this.threshold,
    });
  }

  /**
   * See {@link IDataStore.get}
   */
  async get(key: string): Promise<RespV3<NotePropsMeta>> {
    const result = this.notesIndex.search({ id: `=${key}` });
    // const maybeNote = this._noteMetadataById[key];

    if (result && result.length === 1) {
      return { data: _.cloneDeep(result[0].item) };
    } else {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `NoteProps metadata not found for key ${key}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link IDataStore.find}
   */
  async find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
    if (!opts.fname) {
      return { data: [] }; // JYTODO
    }

    const searchResults = this.notesIndex.search({
      fname: `=${opts.fname}`,
      vault: `=${opts.vault}`, // JYTODO: First check if vault arg exists.
    });

    const clonedResults = searchResults.map((fuseResult) => {
      return _.cloneDeep(fuseResult.item);
    });

    return { data: clonedResults };

    // const { fname, vault, excludeStub } = opts;
    // if (!fname && !vault && _.isUndefined(excludeStub)) {
    //   return { data: [] };
    // }
    // let noteMetadata: NotePropsMeta[];

    // if (fname) {
    //   const cleanedFname = cleanName(fname);
    //   const ids = this._noteIdsByFname[cleanedFname];
    //   if (!ids) {
    //     return { data: [] };
    //   }
    //   noteMetadata = ids
    //     .map((id) => this._noteMetadataById[id])
    //     .filter(isNotUndefined);
    // } else {
    //   noteMetadata = _.values(this._noteMetadataById);
    // }

    // if (vault) {
    //   noteMetadata = noteMetadata.filter((note) =>
    //     VaultUtils.isEqualV2(note.vault, vault)
    //   );
    // }

    // if (excludeStub) {
    //   noteMetadata = noteMetadata.filter((note) => note.stub !== true);
    // }
    // return { data: _.cloneDeep(noteMetadata) };
  }

  /**
   * See {@link IDataStore.write}
   *
   * Add note to _noteMetadataById and _noteIdsByFname.
   * If note id already exists, check to see if it corresponds to same note by fname.
   * If fname match, then we only need to update _noteMetadataById. If fname doesn't match, remove old id from _noteIdsByFname first before updating both.
   *
   * Otherwise, if note id doesn't exist, add to both dictionaries
   */
  async write(key: string, data: NotePropsMeta): Promise<RespV3<string>> {
    const maybeNote = this.notesIndex.search({ id: `=${key}` });

    if (maybeNote && maybeNote.length === 1) {
      this.notesIndex.removeAt(maybeNote[0].refIndex);
    }

    this.notesIndex.add(data);

    // if (maybeNote) {
    //   if (cleanName(maybeNote.fname) === cleanName(data.fname)) {
    //     this._noteMetadataById[data.id] = data;
    //     return { data: key };
    //   } else {
    //     // Remove old fname from fname dict
    //     NoteFnameDictUtils.delete(maybeNote, this._noteIdsByFname);
    //   }
    // }
    // this._noteMetadataById[data.id] = data;
    // NoteFnameDictUtils.add(data, this._noteIdsByFname);

    return { data: key };
  }

  /**
   * See {@link IDataStore.delete}
   *
   * Remove note from both _noteMetadataById and _noteIdsByFname.
   */
  async delete(key: string): Promise<RespV3<string>> {
    this.notesIndex.remove((doc) => doc.id === key);

    // const maybeNote = this._noteMetadataById[key];
    // if (maybeNote) {
    //   NoteFnameDictUtils.delete(maybeNote, this._noteIdsByFname);
    // }
    // delete this._noteMetadataById[key];

    return { data: key };
  }

  public query(
    queryString: string
  ): ResultAsync<NotePropsMeta[], DendronError> {
    let items: NotePropsMeta[];

    if (queryString === "") {
      const results = this.notesIndex.search("root"); // JYTODO: Optimize for exact match
      items = _.map(
        _.filter(results, (ent) => ent.item.fname === "root"),
        (ent) => ent.item
      );
      /// search eveyrthing
    } else if (queryString === "*") {
      // @ts-ignore
      items = this.notesIndex._docs as NotePropsMeta[]; // JYTODO: can we avoid cast
    } else {
      const formattedQS = FuseEngine.formatQueryForFuse({ qs: queryString });

      let results = this.notesIndex.search(formattedQS);

      results = this.postQueryFilter({
        results,
        queryString: formattedQS,
        onlyDirectChildren,
      });

      // if (originalQS === undefined) {
      //   // TODO: add log WARN (does not appear to be easily accessible logger in common-all)
      //   originalQS = qs;
      // }
      results = FuseEngine.sortResults({ results, originalQS });

      items = _.map(results, (resp) => resp.item);
    }

    const myResult = okAsync(items);
    return myResult;
  }
}
