import {
  CONSTANTS,
  DendronError,
  DEngineClient,
  DNodeUtils,
  DStore,
  DuplicateNoteError,
  DVault,
  ErrorFactory,
  ErrorUtils,
  ERROR_SEVERITY,
  ERROR_STATUS,
  IDendronError,
  isNotUndefined,
  NoteDictsUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NoteDicts,
  NotesCacheEntry,
  NotesCacheEntryMap,
  NoteUtils,
  SchemaUtils,
  stringifyError,
  VaultUtils,
  NoteChangeEntry,
  genHash,
} from "@dendronhq/common-all";
import {
  DLogger,
  globMatch,
  string2Note,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { createCacheEntry } from "../../utils";
import { ParserBase } from "./parseBase";
import { NotesFileSystemCache } from "../../cache/notesFileSystemCache";
import { AnchorUtils, LinkUtils } from "../../markdown/remark/utils";

export type FileMeta = {
  // file name: eg. foo.md, name = foo
  prefix: string;
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
    metaDict[lvl].push({ prefix: name, fpath });
  });
  return metaDict;
}

export class NoteParser extends ParserBase {
  public cache: NotesFileSystemCache;
  private engine: DEngineClient;
  private maxNoteLength: number;

  constructor(
    public opts: {
      store: DStore;
      cache: NotesFileSystemCache;
      engine: DEngineClient;
      logger: DLogger;
      maxNoteLength: number;
    }
  ) {
    super(opts);
    this.cache = opts.cache;
    this.engine = opts.engine;
    this.maxNoteLength = opts.maxNoteLength;
  }

  async parseFiles(
    allPaths: string[],
    vault: DVault
  ): Promise<{
    notesById: NotePropsByIdDict;
    cacheUpdates: NotesCacheEntryMap;
    errors: IDendronError[];
  }> {
    const ctx = "parseFile";
    const fileMetaDict: FileMetaDict = getFileMeta(allPaths);
    const maxLvl = _.max(_.keys(fileMetaDict).map((e) => _.toInteger(e))) || 2;
    const notesByFname: NotePropsByFnameDict = {};
    const notesById: NotePropsByIdDict = {};
    const noteDicts = {
      notesById,
      notesByFname,
    };
    this.logger.info({ ctx, msg: "enter", vault });
    const cacheUpdates: { [key: string]: NotesCacheEntry } = {};
    // Keep track of which notes in cache no longer exist
    const unseenKeys = this.cache.getCacheEntryKeys();
    const errors: IDendronError<any>[] = [];

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
      });
    }
    const rootFile = fileMetaDict[1].find(
      (n) => n.fpath === "root.md"
    ) as FileMeta;
    if (!rootFile) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
      });
    }
    const rootProps = this.parseNoteProps({
      fileMeta: rootFile,
      addParent: false,
      vault,
      errors,
    });
    const rootNote = rootProps.changeEntries[0].note;
    this.logger.info({ ctx, msg: "post:parseRootNote" });
    if (!rootProps.matchHash) {
      cacheUpdates[rootNote.fname] = createCacheEntry({
        noteProps: rootNote,
        hash: rootProps.noteHash,
      });
    }

    // get root of hiearchies
    let lvl = 2;
    let prevNodes: NoteProps[] = fileMetaDict[1]
      // don't count root node
      .filter((n) => n.fpath !== "root.md")
      .flatMap((ent) => {
        try {
          const out = this.parseNoteProps({
            fileMeta: ent,
            addParent: false,
            vault,
            errors,
          });
          const parsedNote = out.changeEntries[0].note;
          unseenKeys.delete(parsedNote.fname);
          if (!out.matchHash) {
            cacheUpdates[parsedNote.fname] = createCacheEntry({
              noteProps: parsedNote,
              hash: out.noteHash,
            });
          }
          return parsedNote;
        } catch (err: any) {
          const dendronError = ErrorFactory.wrapIfNeeded(err);
          // A fatal error would kill the initialization
          dendronError.severity = ERROR_SEVERITY.MINOR;
          dendronError.message =
            `Failed to read ${ent.fpath} in ${vault.fsPath}: ` +
            dendronError.message;
          errors.push(dendronError);
          return;
        }
      })
      .filter(isNotUndefined);
    prevNodes.forEach((ent) => {
      DNodeUtils.addChild(rootNote, ent);

      // Check for duplicate IDs when adding notes to the map
      if (notesById[ent.id] !== undefined) {
        const duplicate = notesById[ent.id];
        errors.push(
          new DuplicateNoteError({
            noteA: duplicate,
            noteB: ent,
          })
        );
      }
      NoteDictsUtils.add(ent, noteDicts);
    });
    // Root node children have updated
    NoteDictsUtils.add(rootNote, noteDicts);
    unseenKeys.delete(rootNote.fname);
    this.logger.info({ ctx, msg: "post:parseDomainNotes" });

    // get everything else
    while (lvl <= maxLvl) {
      const currNodes: NoteProps[] = (fileMetaDict[lvl] || [])
        .filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        })
        // eslint-disable-next-line no-loop-func
        .flatMap((ent) => {
          try {
            const resp = this.parseNoteProps({
              fileMeta: ent,
              noteDicts: { notesById, notesByFname },
              addParent: true,
              vault,
              errors,
            });
            const parsedNote = resp.changeEntries[0].note;
            unseenKeys.delete(parsedNote.fname);

            // this indicates that the contents of the note was different
            // then what was in the cache. need to update later ^cache-update
            if (!resp.matchHash) {
              cacheUpdates[parsedNote.fname] = createCacheEntry({
                noteProps: parsedNote,
                hash: resp.noteHash,
              });
            }

            // need to be inside this loop
            // deal with `src/__tests__/enginev2.spec.ts`, with stubs/ test case
            resp.changeEntries.forEach((ent) => {
              const note = ent.note;
              // Check for duplicate IDs when adding created notes to the map
              if (ent.status === "create" && notesById[note.id] !== undefined) {
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
            return parsedNote;
          } catch (err: any) {
            const dendronError = ErrorFactory.wrapIfNeeded(err);
            // A fatal error would kill the initialization
            dendronError.severity = ERROR_SEVERITY.MINOR;
            dendronError.message =
              `Failed to read ${ent.fpath} in ${vault.fsPath}: ` +
              dendronError.message;
            errors.push(dendronError);
            return undefined;
          }
        })
        .filter(isNotUndefined);
      lvl += 1;
      prevNodes = currNodes;
    }
    this.logger.info({ ctx, msg: "post:parseAllNotes" });

    // add schemas
    const domains = notesById[rootNote.id].children.map(
      (ent) => notesById[ent]
    );
    const schemas = this.opts.store.schemas;
    await Promise.all(
      domains.map(async (d) => {
        return SchemaUtils.matchDomain(d, notesById, schemas);
      })
    );
    // Remove stale entries from cache
    unseenKeys.forEach((unseenKey) => {
      this.cache.drop(unseenKey);
    });

    // OPT:make async and don't wait for return
    // Skip this if we found no notes, which means vault did not initialize
    if (_.size(notesById) > 0) {
      // TODO only write if there are changes
      this.cache.writeToFileSystem();
    }

    this.logger.info({ ctx, msg: "post:matchSchemas" });
    return { notesById, cacheUpdates, errors };
  }

  /**
   *
   * @param opts
   * @returns List of all notes added. If a note has no direct parents, stub notes are added instead
   */
  parseNoteProps(opts: {
    fileMeta: FileMeta;
    noteDicts?: NoteDicts;
    parents?: NoteProps[];
    addParent: boolean;
    createStubs?: boolean;
    vault: DVault;
    errors: IDendronError[];
  }): {
    changeEntries: NoteChangeEntry[];
    noteHash: string;
    matchHash: boolean;
  } {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      createStubs: true,
      noteDicts: {
        notesById: {},
        notesByFname: {},
      },
      parents: [] as NoteProps[],
    });
    const { fileMeta, noteDicts, vault, errors } = cleanOpts;
    const ctx = "parseNoteProps";
    this.logger.debug({ ctx, msg: "enter", fileMeta });
    const wsRoot = this.opts.store.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    let changeEntries: NoteChangeEntry[] = [];
    let noteProps: NoteProps;
    let noteHash: string;
    let matchHash: boolean;

    // get note props
    try {
      ({
        note: noteProps,
        noteHash,
        matchHash,
      } = this.file2NoteWithCache({
        fpath: path.join(vpath, fileMeta.fpath),
        vault,
        errors,
      }));
    } catch (_err: any) {
      if (!ErrorUtils.isDendronError(_err)) {
        const err = DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          severity: ERROR_SEVERITY.MINOR,
          payload: { fname: fileMeta.fpath, error: stringifyError(_err) },
          message: `${fileMeta.fpath} could not be parsed`,
        });
        this.logger.error({ ctx, err });
        throw err;
      }
      throw _err;
    }
    changeEntries.push({
      status: "create",
      note: noteProps,
    });

    // add parent
    if (cleanOpts.addParent) {
      const changed = NoteUtils.addOrUpdateParents({
        note: noteProps,
        noteDicts,
        createStubs: cleanOpts.createStubs,
        wsRoot: this.opts.store.wsRoot,
      });
      changeEntries = changeEntries.concat(changed);
    }
    return {
      changeEntries,
      noteHash,
      matchHash,
    };
  }

  private file2NoteWithCache({
    fpath,
    vault,
    toLowercase,
    errors,
  }: {
    fpath: string;
    vault: DVault;
    toLowercase?: boolean;
    errors: IDendronError[];
  }): {
    note: NoteProps;
    matchHash: boolean;
    noteHash: string;
  } {
    const content = fs.readFileSync(fpath, { encoding: "utf8" });
    const { name } = path.parse(fpath);
    const sig = genHash(content);
    const cacheEntry = this.cache.get(name);
    const matchHash = cacheEntry?.hash === sig;
    const fname = toLowercase ? name.toLowerCase() : name;
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
        return { note, matchHash, noteHash: sig };
      }
    }
    // If hash is different, then we update all links and anchors ^link-anchor
    // Update cache entry as well
    note = string2Note({ content, fname, vault });
    note.contentHash = sig;
    // Link/anchor errors should be logged but not interfere with rest of parsing
    try {
      this.updateLinksAndAnchors(note);
    } catch (_err: any) {
      errors.push(ErrorFactory.wrapIfNeeded(_err));
    }
    this.cache.set(
      name,
      createCacheEntry({
        noteProps: note,
        hash: note.contentHash,
      })
    );
    return { note, matchHash, noteHash: sig };
  }

  private updateLinksAndAnchors(note: NoteProps): void {
    const ctx = "noteParser:updateLinksAndAnchors";
    // Skip finding links/anchors if note is too long
    if (
      note.body.length >=
      (this.maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
    ) {
      this.logger.info({
        ctx,
        msg: "Note too large, skipping",
        note: NoteUtils.toLogObj(note),
        length: note.body.length,
      });
      throw new DendronError({
        message:
          `Note "${note.fname}" in vault "${VaultUtils.getName(
            note.vault
          )}" is longer than ${
            this.maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH
          } characters, some features like backlinks may not work correctly for it. ` +
          `You may increase "maxNoteLength" in "dendron.yml" to override this warning.`,
        severity: ERROR_SEVERITY.MINOR,
      });
    }

    try {
      const links = LinkUtils.findLinks({
        note,
        engine: this.engine,
      });
      note.links = links;
    } catch (err: any) {
      const dendronError = ErrorFactory.wrapIfNeeded(err);
      dendronError.message =
        `Failed to read links in note ${note.fname}: ` + dendronError.message;
      this.logger.error({
        ctx,
        error: dendronError,
        note: NoteUtils.toLogObj(note),
      });
      throw dendronError;
    }
    try {
      const anchors = AnchorUtils.findAnchors({
        note,
      });
      note.anchors = anchors;
      return;
    } catch (err: any) {
      const dendronError = ErrorFactory.wrapIfNeeded(err);
      dendronError.message =
        `Failed to read headers or block anchors in note ${note.fname}` +
        dendronError.message;
      throw dendronError;
    }
  }
}
