/* eslint-disable no-await-in-loop */
import {
  DendronError,
  DEngineClient,
  DNodeUtils,
  DuplicateNoteError,
  DVault,
  ErrorFactory,
  ErrorUtils,
  ERROR_SEVERITY,
  ERROR_STATUS,
  IDendronError,
  NoteDictsUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NoteDicts,
  NoteUtils,
  stringifyError,
  NoteChangeEntry,
  genHash,
  RespV2,
  cleanName,
  DendronCompositeError,
  SchemaUtils,
  string2Note,
  globMatch,
  IntermediateDendronConfig,
  RespWithOptError,
  asyncLoopOneAtATime,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { DConfig, DLogger, vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { createCacheEntry, EngineUtils } from "../../utils";
import { NotesFileSystemCache } from "../../cache/notesFileSystemCache";

// NOTE: This file has been forked in plugin-core to enable Dendron Web
// Extension

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

export class NoteParserV2 {
  public cache: NotesFileSystemCache;
  private engine: DEngineClient;

  constructor(
    public opts: {
      cache: NotesFileSystemCache;
      engine: DEngineClient;
      logger: DLogger;
    }
  ) {
    this.cache = opts.cache;
    this.engine = opts.engine;
  }

  get logger() {
    return this.opts.logger;
  }

  /**
   * Construct in-memory
   *
   * @param allPaths
   * @param vault
   * @returns
   */
  async parseFiles(
    allPaths: string[],
    vault: DVault,
    schemas: SchemaModuleDict
  ): Promise<RespWithOptError<NoteDicts>> {
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
    this.logger.info({ ctx, msg: "enter", vault });
    // Keep track of which notes in cache no longer exist
    const unseenKeys = this.cache.getCacheEntryKeys();
    const config = DConfig.readConfigSync(this.engine.wsRoot);
    const errors: IDendronError<any>[] = [];

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      return {
        data: noteDicts,
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        }),
      };
    }
    const rootFile = fileMetaDict[1].find((n) => n.fpath === "root.md");
    if (!rootFile) {
      return {
        data: noteDicts,
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        }),
      };
    }
    const rootProps = await this.parseNoteProps({
      fpath: rootFile.fpath,
      addParent: false,
      vault,
      config,
    });
    if (rootProps.error) {
      errors.push(rootProps.error);
    }
    if (!rootProps.data || rootProps.data.length === 0) {
      return {
        data: noteDicts,
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
        }),
      };
    }
    const rootNote = rootProps.data[0].note;
    NoteDictsUtils.add(rootNote, noteDicts);
    unseenKeys.delete(rootNote.fname);
    this.logger.info({ ctx, msg: "post:parseRootNote" });

    // Parse root hierarchies
    await asyncLoopOneAtATime(
      fileMetaDict[1]
        // Don't count root node
        .filter((n) => n.fpath !== "root.md"),
      async (ent) => {
        try {
          const resp = await this.parseNoteProps({
            fpath: ent.fpath,
            addParent: false,
            vault,
            config,
          });
          // Store each successfully parsed node in note dict and keep track of errors
          if (resp.error) {
            errors.push(resp.error);
          }
          if (resp.data && resp.data.length > 0) {
            const parsedNote = resp.data[0].note;
            unseenKeys.delete(parsedNote.fname);
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
            `Failed to read ${ent.fpath} in ${vault.fsPath}: ` + error.message;
          errors.push(error);
        }
      }
    );

    this.logger.info({ ctx, msg: "post:parseDomainNotes" });

    // Parse level by level
    let lvl = 2;
    while (lvl <= maxLvl) {
      await asyncLoopOneAtATime(
        (fileMetaDict[lvl] || []).filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        }),
        async (ent) => {
          try {
            const resp = await this.parseNoteProps({
              fpath: ent.fpath,
              noteDicts: { notesById, notesByFname },
              addParent: true,
              vault,
              config,
            });

            if (resp.error) {
              errors.push(resp.error);
            }

            if (resp.data && resp.data.length > 0) {
              const parsedNote = resp.data[0].note;
              unseenKeys.delete(parsedNote.fname);

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
              `Failed to read ${ent.fpath} in ${vault.fsPath}: ` +
              dendronError.message;
            errors.push(dendronError);
          }
        }
      );
      lvl += 1;
    }
    this.logger.info({ ctx, msg: "post:parseAllNotes" });

    // Add schemas
    const domains = notesById[rootNote.id].children.map(
      (ent) => notesById[ent]
    );
    domains.map((domain) => {
      SchemaUtils.matchDomain(domain, notesById, schemas);
    });

    // Remove stale entries from cache
    unseenKeys.forEach((unseenKey) => {
      this.cache.drop(unseenKey);
    });

    // OPT:make async and don't wait for return
    // Skip this if we found no notes, which means vault did not initialize, or if there are no cache changes needed
    if (
      (_.size(notesById) > 0 && this.cache.numCacheMisses > 0) ||
      unseenKeys.size > 0
    ) {
      this.cache.writeToFileSystem();
    }

    this.logger.info({ ctx, msg: "post:matchSchemas" });
    return {
      data: noteDicts,
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
    };
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
    vault: DVault;
    config: IntermediateDendronConfig;
  }): Promise<RespV2<NoteChangeEntry[]>> {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      noteDicts: {
        notesById: {},
        notesByFname: {},
      },
    });
    const { fpath, noteDicts, vault, config } = cleanOpts;
    const ctx = "parseNoteProps";
    this.logger.debug({ ctx, msg: "enter", fpath });
    const wsRoot = this.engine.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    let changeEntries: NoteChangeEntry[] = [];

    try {
      // Get note props from file and propagate any errors
      const { data: note, error } = await this.file2NoteWithCache({
        fpath: path.join(vpath, fpath),
        vault,
        config,
      });

      if (note) {
        changeEntries.push({ status: "create", note });

        // Add parent/children properties
        if (cleanOpts.addParent) {
          const changed = NoteUtils.addOrUpdateParents({
            note,
            noteDicts,
            createStubs: true,
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
        this.logger.error({ ctx, error });
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
    fpath,
    vault,
    config,
  }: {
    fpath: string;
    vault: DVault;
    config: IntermediateDendronConfig;
  }): Promise<RespV2<NoteProps>> {
    const content = fs.readFileSync(fpath, { encoding: "utf8" });
    const { name } = path.parse(fpath);
    const sig = genHash(content);
    const cacheEntry = this.cache.get(name);
    const matchHash = cacheEntry?.hash === sig;
    let note: NoteProps;

    // if hash matches, note hasn't changed
    if (matchHash) {
      // since we don't store the note body in the cache file, we need to re-parse the body
      const capture = content.match(/^---[\s\S]+?---/);
      if (capture) {
        const offset = capture[0].length;
        const body = content.slice(offset + 1);
        // vault can change without note changing so we need to add this
        // add `contentHash` to this signature because its not saved with note
        note = {
          ...cacheEntry.data,
          body,
          vault,
          contentHash: sig,
        };
        return { data: note, error: null };
      } else {
        // No frontmatter exists for this file, return error
        return {
          error: new DendronError({
            message: `File "${fpath}" is missing frontmatter. Please delete file and recreate note`,
            severity: ERROR_SEVERITY.MINOR,
          }),
        };
      }
    }
    // If hash is different, then we update all links and anchors ^link-anchor
    note = string2Note({ content, fname: cleanName(name), vault });
    note.contentHash = sig;
    // Link/anchor errors should be logged but not interfere with rest of parsing
    let error: IDendronError | null = null;
    try {
      await EngineUtils.refreshNoteLinksAndAnchors({
        note,
        engine: this.engine,
        config,
      });
    } catch (_err: any) {
      error = ErrorFactory.wrapIfNeeded(_err);
    }

    // Update cache entry as well
    this.cache.set(
      name,
      createCacheEntry({
        noteProps: note,
        hash: note.contentHash,
      })
    );
    this.cache.incrementCacheMiss();
    return { data: note, error };
  }
}
