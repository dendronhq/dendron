import {
  minimatch,
  DVaultUriVariant,
  BulkResp,
  NoteDicts,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  IDendronError,
  DendronError,
  ERROR_STATUS,
  DendronCompositeError,
  NoteDictsUtils,
  DNodeUtils,
  DuplicateNoteError,
  ErrorFactory,
  ERROR_SEVERITY,
  RespV2,
  NoteChangeEntry,
  NoteUtils,
  ErrorUtils,
  stringifyError,
  NoteProps,
  genHash,
  cleanName,
  URI,
  DVault,
  string2Note,
} from "@dendronhq/common-all";
// import { string2Note } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode"; // NOTE: This version contains vscode.workspace.fs API references. Need to refactor that out somehow.
import { Utils } from "vscode-uri";

// NOTE: THIS FILE IS DUPLICATED IN ENGINE-SERVER
export type FileMeta = {
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
export type FileMetaDict = { [key: string]: FileMeta[] };

/**
 * Get hierarchy of each file
 * @param fpaths
 * @returns
 */
function getFileMeta(fpaths: string[]): FileMetaDict {
  const metaDict: FileMetaDict = {};
  _.forEach(fpaths, (fpath) => {
    const { name } = path.parse(fpath);
    const lvl = name.split(".").length;
    if (!_.has(metaDict, lvl)) {
      metaDict[lvl] = [];
    }
    metaDict[lvl].push({ fpath });
  });
  return metaDict;
}

function globMatch(patterns: string[] | string, fname: string): boolean {
  if (_.isString(patterns)) {
    return minimatch(fname, patterns);
  }
  return _.some(patterns, (pattern) => minimatch(fname, pattern));
}

export class NoteParserV2 {
  // public cache: NotesFileSystemCache;
  // private engine: DEngineClient;
  private wsRoot: string;
  // private maxNoteLength: number;

  constructor(
    public opts: {
      wsRoot: string;
      // cache: NotesFileSystemCache;
      // engine: DEngineClient;
      // logger: DLogger;
      // maxNoteLength: number;
    }
  ) {
    this.wsRoot = opts.wsRoot;
    // this.cache = opts.cache;
    // this.engine = opts.engine;
    // this.maxNoteLength = opts.maxNoteLength;
  }

  // get logger() {
  //   return this.opts.logger;
  // }

  /**
   * Construct in-memory
   *
   * @param allPaths
   * @param vault
   * @returns
   */
  async parseFiles(
    allPaths: string[],
    vault: DVaultUriVariant
  ): Promise<BulkResp<NoteDicts>> {
    const ctx = "parseFiles";
    const fileMetaDict: FileMetaDict = getFileMeta(allPaths);
    const maxLvl = _.max(_.keys(fileMetaDict).map((e) => _.toInteger(e))) || 2;
    // In-memory representation of NoteProps dictionary
    const notesByFname: NotePropsByFnameDict = {};
    const notesById: NotePropsByIdDict = {};
    const noteDicts = {
      notesById,
      notesByFname,
    };
    // this.logger.info({ ctx, msg: "enter", vault });
    // Keep track of which notes in cache no longer exist
    // const unseenKeys = this.cache.getCacheEntryKeys();
    const errors: IDendronError<any>[] = [];

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      errors.push(
        DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        })
      );
      return { error: new DendronCompositeError(errors) };
    }
    const rootFile = fileMetaDict[1].find((n) => n.fpath === "root.md");
    if (!rootFile) {
      errors.push(
        DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        })
      );
      return { error: new DendronCompositeError(errors) };
    }
    const rootProps = await this.parseNoteProps({
      fpath: cleanName(rootFile.fpath), // TODO: Don't think cleanName is necessary here
      addParent: false,
      vault,
    });
    if (rootProps.error) {
      errors.push(rootProps.error);
    }
    if (!rootProps.data || rootProps.data.length === 0) {
      errors.push(
        DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        })
      );
      return { error: new DendronCompositeError(errors) };
    }
    const rootNote = rootProps.data[0].note;
    NoteDictsUtils.add(rootNote, noteDicts);
    // unseenKeys.delete(rootNote.fname);
    // this.logger.info({ ctx, msg: "post:parseRootNote" });

    // Parse root hierarchies
    const op = fileMetaDict[1]
      // Don't count root node
      .filter((n) => n.fpath !== "root.md")
      .map(async (ent) => {
        try {
          const resp = await this.parseNoteProps({
            fpath: ent.fpath,
            addParent: false,
            vault,
          });
          // Store each successfully parsed node in note dict and keep track of errors
          if (resp.error) {
            errors.push(resp.error);
          }
          if (resp.data && resp.data.length > 0) {
            const parsedNote = resp.data[0].note;
            // unseenKeys.delete(parsedNote.fname);
            DNodeUtils.addChild(rootNote, parsedNote);

            // Check for duplicate IDs when adding notes to the map
            if (notesById[parsedNote.id] !== undefined) {
              const duplicate = notesById[parsedNote.id];
              errors.push(
                new DuplicateNoteError({
                  noteA: duplicate,
                  noteB: parsedNote,
                })
              );
            }
            // Update in-memory note dict
            NoteDictsUtils.add(parsedNote, noteDicts);
          }
        } catch (err: any) {
          const error = ErrorFactory.wrapIfNeeded(err);
          // A fatal error would kill the initialization
          error.severity = ERROR_SEVERITY.MINOR;
          error.message =
            `Failed to read ${ent.fpath} in ${vault.name}: ` + error.message;
          errors.push(error);
        }
      });

    // this.logger.info({ ctx, msg: "post:parseDomainNotes" });
    await Promise.all(op);

    // Parse level by level
    let lvl = 2;
    while (lvl <= maxLvl) {
      const anotherOp = (fileMetaDict[lvl] || [])
        .filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        })
        .flatMap(async (ent) => {
          try {
            const resp = await this.parseNoteProps({
              fpath: ent.fpath,
              noteDicts: { notesById, notesByFname },
              addParent: true,
              vault,
            });

            if (resp.error) {
              errors.push(resp.error);
            }

            if (resp.data && resp.data.length > 0) {
              // const parsedNote = resp.data[0].note;
              // unseenKeys.delete(parsedNote.fname);

              resp.data.forEach((ent) => {
                const note = ent.note;
                // Check for duplicate IDs when adding created notes to the map
                if (
                  ent.status === "create" &&
                  notesById[note.id] !== undefined
                ) {
                  const duplicate = notesById[note.id];
                  errors.push(
                    new DuplicateNoteError({
                      noteA: duplicate,
                      noteB: note,
                    })
                  );
                }

                NoteDictsUtils.add(note, noteDicts);
              });
            }
          } catch (err: any) {
            const dendronError = ErrorFactory.wrapIfNeeded(err);
            // A fatal error would kill the initialization
            dendronError.severity = ERROR_SEVERITY.MINOR;
            dendronError.message =
              `Failed to read ${ent.fpath} in ${vault.name}: ` +
              dendronError.message;
            errors.push(dendronError);
          }
        });
      lvl += 1;

      // TODO: Fix
      await Promise.all(anotherOp);
    }
    // this.logger.info({ ctx, msg: "post:parseAllNotes" });

    // Remove stale entries from cache
    // unseenKeys.forEach((unseenKey) => {
    //   this.cache.drop(unseenKey);
    // });

    // OPT:make async and don't wait for return
    // Skip this if we found no notes, which means vault did not initialize, or if there are no cache changes needed
    // if (
    //   (_.size(notesById) > 0 && this.cache.numCacheMisses > 0) ||
    //   unseenKeys.size > 0
    // ) {
    //   this.cache.writeToFileSystem();
    // }

    // this.logger.info({ ctx, msg: "post:matchSchemas" });
    return { data: noteDicts, error: new DendronCompositeError(errors) };
  }

  /**
   * Given a fpath, convert to NoteProp
   * Update parent/children metadata if parents = true
   *
   * @returns List of all notes changed. If a note has no direct parents, stub notes are added instead
   */
  private async parseNoteProps(opts: {
    fpath: string;
    noteDicts?: NoteDicts;
    addParent: boolean;
    vault: DVaultUriVariant;
  }): Promise<RespV2<NoteChangeEntry[]>> {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      noteDicts: {
        notesById: {},
        notesByFname: {},
      },
    });
    const { fpath, noteDicts, vault } = cleanOpts;
    const ctx = "parseNoteProps";
    // this.logger.debug({ ctx, msg: "enter", fpath });
    const wsRoot = this.wsRoot;
    const vpath = vault.path;
    // const vpath = vault2Path({ vault, wsRoot });
    let changeEntries: NoteChangeEntry[] = [];

    try {
      // Get note props from file and propagate any errors
      const { data: note, error } = await this.file2NoteWithCache({
        uri: Utils.joinPath(vault.path, "notes", fpath), // TODO: Only works on self-contained vaults
        vault,
      });

      if (note) {
        changeEntries.push({ status: "create", note });

        // Add parent/children properties
        if (cleanOpts.addParent) {
          const changed = NoteUtils.addOrUpdateParents({
            note,
            noteDicts,
            createStubs: true,
            wsRoot,
          });
          changeEntries = changeEntries.concat(changed);
        }
      }
      return { data: changeEntries, error };
    } catch (_err: any) {
      if (!ErrorUtils.isDendronError(_err)) {
        const error = DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          severity: ERROR_SEVERITY.MINOR,
          payload: { fname: fpath, error: stringifyError(_err) },
          message: `${fpath} could not be parsed`,
        });
        // this.logger.error({ ctx, error });
        return { error };
      }
      return { error: _err };
    }
  }

  /**
   * Given a fpath, attempt to convert raw file contents into a NoteProp
   *
   * Look up metadata from cache. If contenthash hasn't changed, use metadata from cache.
   * Otherwise, reconstruct metadata from scratch
   *
   * @returns NoteProp associated with fpath
   */
  private async file2NoteWithCache({
    uri,
    vault,
  }: {
    uri: URI;
    vault: DVaultUriVariant;
  }): Promise<RespV2<NoteProps>> {
    const raw = await vscode.workspace.fs.readFile(uri);

    // @ts-ignore - this needs to use browser's TextDecoder, not an import from node utils
    const textDecoder = new TextDecoder();

    const content = textDecoder.decode(raw);
    const name = path.parse(Utils.basename(uri)).name;
    const sig = genHash(content);
    // const cacheEntry = this.cache.get(name);
    // const matchHash = cacheEntry?.hash === sig;
    // let note: NoteProps;

    // if hash matches, note hasn't changed
    // if (matchHash) {
    //   // since we don't store the note body in the cache file, we need to re-parse the body
    //   const capture = content.match(/^---[\s\S]+?---/);
    //   if (capture) {
    //     const offset = capture[0].length;
    //     const body = content.slice(offset + 1);
    //     // vault can change without note changing so we need to add this
    //     // add `contentHash` to this signature because its not saved with note
    //     note = {
    //       ...cacheEntry.data,
    //       body,
    //       vault,
    //       contentHash: sig,
    //     };
    //     return { data: note, error: null };
    //   } else {
    //     // No frontmatter exists for this file, return error
    //     return {
    //       error: new DendronError({
    //         message: `File "${fpath}" is missing frontmatter. Please delete file and recreate note`,
    //         severity: ERROR_SEVERITY.MINOR,
    //       }),
    //     };
    //   }
    // }
    // If hash is different, then we update all links and anchors ^link-anchor
    const note = string2Note({
      content,
      fname: cleanName(name),
      vault,
      // vault: DNodeUtils.convertDVaultVersions(vault),
    });
    note.contentHash = sig;
    // Link/anchor errors should be logged but not interfere with rest of parsing
    let error: IDendronError | null = null;
    try {
      // this.updateLinksAndAnchors(note);
    } catch (_err: any) {
      error = ErrorFactory.wrapIfNeeded(_err);
    }

    // Update cache entry as well
    // this.cache.set(
    //   name,
    //   createCacheEntry({
    //     noteProps: note,
    //     hash: note.contentHash,
    //   })
    // );
    // this.cache.incrementCacheMiss();
    return { data: note, error };
  }

  // private updateLinksAndAnchors(note: NoteProps): void {
  //   const ctx = "noteParser:updateLinksAndAnchors";
  //   // Skip finding links/anchors if note is too long
  //   if (
  //     note.body.length >=
  //     (this.maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
  //   ) {
  //     this.logger.info({
  //       ctx,
  //       msg: "Note too large, skipping",
  //       note: NoteUtils.toLogObj(note),
  //       length: note.body.length,
  //     });
  //     throw new DendronError({
  //       message:
  //         `Note "${note.fname}" in vault "${VaultUtils.getName(
  //           note.vault
  //         )}" is longer than ${
  //           this.maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH
  //         } characters, some features like backlinks may not work correctly for it. ` +
  //         `You may increase "maxNoteLength" in "dendron.yml" to override this warning.`,
  //       severity: ERROR_SEVERITY.MINOR,
  //     });
  //   }

  //   try {
  //     // TODO: modify logic so it doesn't need engine
  //     const links = LinkUtils.findLinks({
  //       note,
  //       engine: this.engine,
  //     });
  //     note.links = links;
  //   } catch (err: any) {
  //     const dendronError = ErrorFactory.wrapIfNeeded(err);
  //     dendronError.message =
  //       `Failed to read links in note ${note.fname}: ` + dendronError.message;
  //     this.logger.error({
  //       ctx,
  //       error: dendronError,
  //       note: NoteUtils.toLogObj(note),
  //     });
  //     throw dendronError;
  //   }
  //   try {
  //     const anchors = AnchorUtils.findAnchors({
  //       note,
  //     });
  //     note.anchors = anchors;
  //     return;
  //   } catch (err: any) {
  //     const dendronError = ErrorFactory.wrapIfNeeded(err);
  //     dendronError.message =
  //       `Failed to read headers or block anchors in note ${note.fname}` +
  //       dendronError.message;
  //     throw dendronError;
  //   }
  // }
}
