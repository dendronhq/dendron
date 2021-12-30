import {
  assert,
  BulkAddNoteOpts,
  CONSTANTS,
  DendronCompositeError,
  IntermediateDendronConfig,
  DendronError,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineInitResp,
  DEngineInitSchemaResp,
  DHookEntry,
  DLink,
  DNoteAnchorPositioned,
  DStore,
  DVault,
  EngineDeleteNotePayload,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  IDendronError,
  isNotUndefined,
  NoteChangeEntry,
  NoteProps,
  NotePropsDict,
  NoteFNamesDict,
  NotesCache,
  NotesCacheEntryMap,
  NoteUtils,
  RenameNoteOpts,
  RenameNotePayload,
  ResponseUtil,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaUtils,
  StoreDeleteNoteResp,
  stringifyError,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
  VaultUtils,
  WriteNoteResp,
  ConfigUtils,
  USER_MESSAGES,
  DNoteLoc,
  NoteChangeUpdateEntry,
} from "@dendronhq/common-all";
import {
  DLogger,
  file2Note,
  getAllFiles,
  getDurationMilliseconds,
  note2File,
  schemaModuleProps2File,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { AnchorUtils, LinkUtils } from "../../markdown/remark/utils";
import { HookUtils, RequireHookResp } from "../../topics/hooks";
import { readNotesFromCache, writeNotesToCache } from "../../utils";
import { NoteParser } from "./noteParser";
import { SchemaParser } from "./schemaParser";
import { InMemoryNoteCache } from "../../util/inMemoryNoteCache";

export type FileMeta = {
  // file name: eg. foo.md, name = foo
  prefix: string;
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
export type FileMetaDict = { [key: string]: FileMeta[] };

export class FileStorage implements DStore {
  public vaults: DVault[];
  /**
   * Warning: currently this note dictionary contains backlink data that gets
   * populated upon initialization. However, the update note operations do not change
   * the backlink data in this dictionary hence it starts to contain stale backlink data.
   *  */
  public notes: NotePropsDict;
  public noteFnames: NoteFNamesDict;
  public schemas: SchemaModuleDict;
  public notesCache: NotesCache;
  public logger: DLogger;
  public links: DLink[];
  public anchors: DNoteAnchorPositioned[];
  public wsRoot: string;
  public configRoot: string;
  public config: IntermediateDendronConfig;
  private engine: DEngineClient;

  constructor(props: { engine: DEngineClient; logger: DLogger }) {
    const { vaults, wsRoot, config } = props.engine;
    const { logger } = props;
    this.wsRoot = wsRoot;
    this.configRoot = wsRoot;
    this.vaults = vaults;
    this.notes = {};
    this.noteFnames = new NoteFNamesDict();
    this.schemas = {};
    this.notesCache = {
      version: 0,
      notes: {},
    };
    this.links = [];
    this.anchors = [];
    this.logger = logger;
    const ctx = "FileStorageV2";
    this.logger.info({ ctx, wsRoot, vaults, level: this.logger.level });
    this.config = config;
    this.engine = props.engine;
  }

  async init(): Promise<DEngineInitResp> {
    let errors: DendronError[] = [];
    try {
      const resp = await this.initSchema();
      if (ResponseUtil.hasError(resp)) {
        errors.push(FileStorage.createMalformedSchemaError(resp));
      }
      resp.data.map((ent) => {
        this.schemas[ent.root.id] = ent;
      });
      const { notes: _notes, errors: initErrors } = await this.initNotes();
      errors = errors.concat(initErrors);
      _notes.map((ent) => {
        this.notes[ent.id] = ent;
        this.noteFnames.add(ent);
      });

      const { notes, schemas } = this;
      let error: IDendronError | null = errors[0] || null;
      if (errors.length > 1) {
        error = new DendronCompositeError(errors);
      }
      return {
        data: {
          notes,
          schemas,
          wsRoot: this.wsRoot,
          config: this.config,
          vaults: this.vaults,
        },
        error,
      };
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  static createMalformedSchemaError(resp: DEngineInitSchemaResp) {
    let fileName = USER_MESSAGES.UNKNOWN;
    try {
      if (resp.error && resp.error.payload) {
        fileName = JSON.parse(JSON.parse(resp.error.payload)[0].payload).fpath;
      }
    } catch (parseErr) {
      fileName = USER_MESSAGES.UNKNOWN;
    }

    let fullPath = undefined;
    try {
      if (resp.error && resp.error.payload) {
        fullPath = JSON.parse(
          JSON.parse(resp.error.payload)[0].payload
        ).fullPath;
      }
    } catch (parseErr) {
      fullPath = undefined;
    }

    let reason = USER_MESSAGES.UNKNOWN;
    try {
      if (resp.error && resp.error.payload) {
        reason = JSON.parse(JSON.parse(resp.error.payload)[0].payload).message;
      }
    } catch (parseErr) {
      reason = USER_MESSAGES.UNKNOWN;
    }

    return new DendronError({
      message: `Schema '${fileName}' is malformed. Reason: ${reason}`,
      severity: ERROR_SEVERITY.MINOR,
      payload: { schema: resp.error, fullPath },
    });
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<StoreDeleteNoteResp> {
    const ctx = "deleteNote";
    if (id === "root") {
      throw new DendronError({
        message: "",
        status: ERROR_STATUS.CANT_DELETE_ROOT,
      });
    }
    const noteToDelete = this.notes[id];
    this.logger.info({ ctx, noteToDelete, opts, id });
    if (_.isUndefined(noteToDelete))
      throw new DendronError({
        message: `Unable to find node ${id}`,
        severity: ERROR_SEVERITY.FATAL,
        payload: ctx,
      });
    const ext = ".md";
    const vault = noteToDelete.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    const fpath = path.join(vpath, noteToDelete.fname + ext);
    let out: NoteChangeEntry[] = [];

    const noteAsLog = NoteUtils.toLogObj(noteToDelete);

    // remove from fs
    if (!opts?.metaOnly) {
      this.logger.info({ ctx, noteAsLog, msg: "removing from disk", fpath });
      fs.unlinkSync(fpath);
    }

    // if have children, keep this node around as a stub
    if (!_.isEmpty(noteToDelete.children)) {
      this.logger.info({ ctx, noteAsLog, msg: "keep as stub" });
      const prevNote = { ...noteToDelete };
      noteToDelete.stub = true;
      this.updateNote(noteToDelete);
      out.push({ note: noteToDelete, status: "update", prevNote });
    } else {
      // no children, delete reference from parent
      this.logger.info({ ctx, noteAsLog, msg: "delete from parent" });
      if (!noteToDelete.parent) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
        });
      }
      // remove from parent
      let parentNote = this.notes[noteToDelete.parent] as NoteProps;
      const parentNotePrev = { ...parentNote };
      parentNote.children = _.reject(
        parentNote.children,
        (ent) => ent === noteToDelete.id
      );
      // delete from note dictionary
      delete this.notes[noteToDelete.id];
      this.noteFnames.delete(noteToDelete);
      // if parent note is not a stub, update it
      if (!parentNote.stub) {
        out.push({
          note: parentNote,
          status: "update",
          prevNote: parentNotePrev,
        });
      }
      out.push({ note: noteToDelete, status: "delete" });
      // check all stubs
      const resps: Promise<EngineDeleteNotePayload>[] = [];
      while (parentNote.stub && !opts?.noDeleteParentStub) {
        const newParent = parentNote.parent;
        const resp = this.deleteNote(parentNote.id, {
          metaOnly: true,
          noDeleteParentStub: true,
        });
        resps.push(resp);
        if (newParent) {
          parentNote = this.notes[newParent];
        } else {
          assert(false, "illegal state in note delete");
        }
      }
      for (const resp of await Promise.all(resps)) {
        out = out.concat(resp);
      }
    }
    return out;
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<DEngineDeleteSchemaResp> {
    const ctx = "deleteSchema";
    this.logger.info({ ctx, msg: "enter", id });
    if (id === "root") {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.CANT_DELETE_ROOT,
      });
    }
    const schemaToDelete = this.schemas[id];
    const ext = ".schema.yml";
    const vault = schemaToDelete.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    const fpath = path.join(vpath, schemaToDelete.fname + ext);

    if (!opts?.metaOnly) {
      fs.unlinkSync(fpath);
    }
    delete this.schemas[id];
    return this.init();
  }

  async initSchema(): Promise<DEngineInitSchemaResp> {
    const ctx = "initSchema";
    this.logger.info({ ctx, msg: "enter" });
    const out = await Promise.all(
      (this.vaults as DVault[]).map(async (vault) => {
        return this._initSchema(vault);
      })
    );
    const _out = _.reduce<
      { data: SchemaModuleProps[]; errors: any[] },
      { data: SchemaModuleProps[]; errors: any[] }
    >(
      out,
      (ent, acc) => {
        acc.data = acc.data.concat(ent.data);
        acc.errors = acc.errors.concat(ent.errors);
        return acc;
      },
      { data: [], errors: [] }
    );
    const { data, errors } = _out;

    const result = {
      data,
      error: _.isEmpty(errors)
        ? null
        : new DendronError({ message: "multiple errors", payload: errors }),
    };
    return result;
  }

  async _initSchema(
    vault: DVault
  ): Promise<{ data: SchemaModuleProps[]; errors: any[] }> {
    const ctx = "initSchema";
    this.logger.info({ ctx, msg: "enter" });
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    const schemaFiles = getAllFiles({
      root: vpath,
      include: ["*.schema.yml"],
    }) as string[];
    this.logger.info({ ctx, schemaFiles });
    if (_.isEmpty(schemaFiles)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.NO_SCHEMA_FOUND,
      });
    }
    const { schemas, errors } = await new SchemaParser({
      wsRoot: this.wsRoot,
      logger: this.logger,
    }).parse(schemaFiles, vault);
    return {
      data: schemas,
      errors: _.isNull(errors) ? [] : errors,
    };
  }

  async initNotes(): Promise<{ notes: NoteProps[]; errors: DendronError[] }> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });

    let notesWithLinks: NoteProps[] = [];
    let errors: DendronError[] = [];
    const out = await Promise.all(
      (this.vaults as DVault[]).map(async (vault) => {
        const {
          notes,
          cacheUpdates,
          cache,
          errors: initErrors,
        } = await this._initNotes(vault);
        errors = errors.concat(initErrors);
        notesWithLinks = notesWithLinks.concat(
          _.filter(notes, (n) => !_.isEmpty(n.links))
        );

        this.logger.info({
          ctx,
          vault,
          numEntries: _.size(notes),
          numCacheUpdates: _.size(cacheUpdates),
        });
        const newCache: NotesCache = {
          version: cache.version,
          notes: _.defaults(cacheUpdates, cache.notes),
        };
        const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
        // OPT:make async and don't wait for return
        if (!this.engine.config.noCaching) {
          writeNotesToCache(vpath, newCache);
        }
        return notes;
      })
    );
    const allNotes = _.flatten(out);

    this._addBacklinks({ notesWithLinks, allNotes });

    if (this.engine.config.dev?.enableLinkCandidates) {
      const ctx = "_addLinkCandidates";
      const start = process.hrtime();
      this._addLinkCandidates(allNotes);
      const duration = getDurationMilliseconds(start);
      this.logger.info({ ctx, duration });
    }
    return { notes: allNotes, errors };
  }

  /** Adds backlinks mutating 'allNotes' argument in place. */
  private _addBacklinks({
    notesWithLinks,
    allNotes,
  }: {
    notesWithLinks: NoteProps[];
    allNotes: NoteProps[];
  }): void {
    const ctx = "_addBacklinks:ext";
    const start = process.hrtime();

    this._addBacklinksImpl(allNotes, notesWithLinks);

    const duration = getDurationMilliseconds(start);
    this.logger.info({ ctx, duration });
  }

  private _addBacklinksImpl(
    allNotes: NoteProps[],
    notesWithLinks: NoteProps[]
  ) {
    const noteCache = new InMemoryNoteCache(allNotes);

    notesWithLinks.forEach((noteFrom) => {
      try {
        noteFrom.links.forEach((link) => {
          const fname = link.to?.fname;
          if (fname) {
            const notes = noteCache.getNotesByFileNameIgnoreCase(fname);

            notes.forEach((noteTo: NoteProps) => {
              NoteUtils.addBacklink({
                from: noteFrom,
                to: noteTo,
                link,
              });
            });
          }
        });
      } catch (err: any) {
        const error = error2PlainObject(err);
        this.logger.error({ error, noteFrom, message: "issue with backlinks" });
      }
    });
  }

  _addLinkCandidates(allNotes: NoteProps[]) {
    const notesMap = NoteUtils.createFnameNoteMap(allNotes, true);
    return _.map(allNotes, (noteFrom: NoteProps) => {
      try {
        const maxNoteLength = ConfigUtils.getWorkspace(
          this.config
        ).maxNoteLength;
        if (
          noteFrom.body.length <
          (maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
        ) {
          const linkCandidates = LinkUtils.findLinkCandidates({
            note: noteFrom,
            notesMap,
            engine: this.engine,
          });
          noteFrom.links = noteFrom.links.concat(linkCandidates);
        }
      } catch (err: any) {
        const error = error2PlainObject(err);
        this.logger.error({
          error,
          noteFrom,
          message: "issue with link candidates",
        });
        return;
      }
    });
  }

  async _initNotes(vault: DVault): Promise<{
    notes: NoteProps[];
    cacheUpdates: NotesCacheEntryMap;
    cache: NotesCache;
    errors: DendronError[];
  }> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    const wsRoot = this.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    const noteFiles = getAllFiles({
      root: vpath,
      include: ["*.md"],
    }) as string[];

    let errors: DendronError[] = [];

    const cache: NotesCache = !this.engine.config.noCaching
      ? readNotesFromCache(vpath)
      : { version: 0, notes: {} };
    const {
      notes,
      cacheUpdates,
      errors: parseErrors,
    } = await new NoteParser({
      store: this,
      cache,
      logger: this.logger,
    }).parseFiles(noteFiles, vault);
    errors = errors.concat(parseErrors);
    this.logger.info({ ctx, msg: "parseNotes:fin" });

    await Promise.all(
      notes.map(async (n) => {
        this.logger.debug({ ctx, note: NoteUtils.toLogObj(n) });
        if (n.stub) {
          return;
        }
        const maxNoteLength = ConfigUtils.getWorkspace(
          this.config
        ).maxNoteLength;
        if (
          n.body.length >=
          (maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
        ) {
          this.logger.info({
            ctx,
            msg: "Note too large, skipping",
            note: NoteUtils.toLogObj(n),
            length: n.body.length,
          });
          errors.push(
            new DendronError({
              message:
                `Note "${n.fname}" in vault "${VaultUtils.getName(
                  n.vault
                )}" is longer than ${
                  maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH
                } characters, some features like backlinks may not work correctly for it. ` +
                `You may increase "maxNoteLength" in "dendron.yml" to override this warning.`,
              severity: ERROR_SEVERITY.MINOR,
            })
          );
          n.links = [];
          n.anchors = {};
          return;
        }

        // if note content is different, then we update all links and anchors ^link-anchor
        if (_.has(cacheUpdates, n.fname)) {
          try {
            const links = LinkUtils.findLinks({
              note: n,
              engine: this.engine,
            });
            cacheUpdates[n.fname].data.links = links;
            n.links = links;
          } catch (err: any) {
            let error = err;
            if (!(err instanceof DendronError)) {
              error = new DendronError({
                message: `Failed to read links in note ${n.fname}`,
                payload: err,
              });
            }
            errors.push(error);
            this.logger.error({ ctx, error: err, note: NoteUtils.toLogObj(n) });
            return;
          }
          try {
            const anchors = await AnchorUtils.findAnchors({
              note: n,
              wsRoot,
            });
            cacheUpdates[n.fname].data.anchors = anchors;
            n.anchors = anchors;
          } catch (err: any) {
            let error = err;
            if (!(err instanceof DendronError)) {
              error = new DendronError({
                message: `Failed to read headers or block anchors in note ${n.fname}`,
                payload: err,
              });
            }
            errors.push(error);
            return;
          }
        } else {
          n.links = cache.notes[n.fname].data.links;
        }
        return;
      })
    );
    return { notes, cacheUpdates, cache, errors };
  }

  async bulkAddNotes(opts: BulkAddNoteOpts) {
    this.logger.info({ ctx: "bulkAddNotes", msg: "enter" });
    await Promise.all(
      opts.notes.map((note) => {
        return note2File({
          note,
          vault: note.vault,
          wsRoot: this.wsRoot,
        });
      })
    );
    const notesChanged: NoteChangeEntry[] = opts.notes.map((n) => {
      return { note: n, status: "create" as const };
    });
    return {
      error: null,
      data: notesChanged,
    };
  }

  private referenceRangeParts(anchorHeader?: string): string[] {
    if (!anchorHeader || anchorHeader.indexOf(":") === -1) return [];
    let [start, end] = anchorHeader.split(":");
    start = start.replace(/^#*/, "");
    end = end.replace(/^#*/, "");
    return [start, end];
  }

  /** Update the links inside this note that need to be updated for the rename from `oldLoc` to `newLoc` */
  private async processNoteChangedByRename({
    note,
    oldLoc,
    newLoc,
  }: {
    note: NoteProps;
    oldLoc: DNoteLoc;
    newLoc: DNoteLoc;
  }): Promise<NoteChangeUpdateEntry> {
    const prevNote = { ...note };
    const vault = note.vault;
    const wsRoot = this.wsRoot;
    const vaultPath = vault2Path({ vault, wsRoot });
    // read note in case its changed
    const _n = file2Note(path.join(vaultPath, note.fname + ".md"), vault);
    const foundLinks = LinkUtils.findLinks({
      note: _n,
      engine: this.engine,
      filter: { loc: oldLoc },
    });
    let allLinks = _.orderBy(
      foundLinks,
      (link) => {
        return link.position?.start.offset;
      },
      "desc"
    );
    if (
      oldLoc.fname.toLowerCase() === newLoc.fname.toLowerCase() &&
      oldLoc.vaultName === newLoc.vaultName &&
      oldLoc.anchorHeader &&
      newLoc.anchorHeader
    ) {
      // Renaming the header, only update links that link to the old header
      allLinks = _.filter(allLinks, (link): boolean => {
        // This is a wikilink to this header
        if (link.to?.anchorHeader === oldLoc.anchorHeader) return true;
        // Or this is a range reference, and one part of the range includes this header
        return (
          link.type === "ref" &&
          isNotUndefined(oldLoc.anchorHeader) &&
          this.referenceRangeParts(link.to?.anchorHeader).includes(
            oldLoc.anchorHeader
          )
        );
      });
    }

    // only modify links that have same _to_ vault name
    // explicitly same: has vault prefix
    // implicitly same: to.vaultName is undefined, but link is in a note that's in the vault.
    allLinks = allLinks.filter((link) => {
      const oldLocVaultName = oldLoc.vaultName as string;
      const explicitlySameVault = link.to?.vaultName === oldLocVaultName;
      const oldLocVault = VaultUtils.getVaultByName({
        vaults: this.vaults,
        vname: oldLocVaultName,
      });
      const implicitlySameVault =
        _.isUndefined(link.to?.vaultName) && _.isEqual(note.vault, oldLocVault);
      return explicitlySameVault || implicitlySameVault;
    });

    const noteMod = _.reduce(
      allLinks,
      (note: NoteProps, link: DLink) => {
        const oldLink = LinkUtils.dlink2DNoteLink(link);
        // current implementation adds alias for all notes
        // check if old note has alias thats different from its fname
        let alias: string | undefined;
        if (oldLink.from.alias && oldLink.from.alias !== oldLink.from.fname) {
          alias = oldLink.from.alias;
          // Update the alias if it was using the default alias.
          if (
            oldLoc.alias?.toLocaleLowerCase() ===
              oldLink.from.alias.toLocaleLowerCase() &&
            newLoc.alias
          ) {
            alias = newLoc.alias;
          }
        }
        // for hashtag links, we'll have to regenerate the alias
        if (newLoc.fname.startsWith(TAGS_HIERARCHY)) {
          const fnameWithoutTag = newLoc.fname.slice(TAGS_HIERARCHY.length);
          // Frontmatter tags don't have the hashtag
          if (link.type !== "frontmatterTag") alias = `#${fnameWithoutTag}`;
          else alias = fnameWithoutTag;
        } else if (oldLink.from.fname.startsWith(TAGS_HIERARCHY)) {
          // If this used to be a hashtag but no longer is, the alias is like `#foo.bar` and no longer makes sense.
          // And if this used to be a frontmatter tag, the alias being undefined will force it to be removed because a frontmatter tag can't point to something outside of tags hierarchy.
          alias = undefined;
        }
        // for user tag links, we'll have to regenerate the alias
        if (newLoc.fname.startsWith(USERS_HIERARCHY)) {
          const fnameWithoutTag = newLoc.fname.slice(USERS_HIERARCHY.length);
          alias = `@${fnameWithoutTag}`;
        } else if (oldLink.from.fname.startsWith(USERS_HIERARCHY)) {
          // If this used to be a user tag but no longer is, the alias is like `@foo.bar` and no longer makes sense.
          alias = undefined;
        }
        // Correctly handle header renames in references with range based references
        if (
          oldLoc.anchorHeader &&
          link.type === "ref" &&
          isNotUndefined(oldLink.from.anchorHeader) &&
          oldLink.from.anchorHeader.indexOf(":") > -1 &&
          isNotUndefined(newLoc.anchorHeader) &&
          newLoc.anchorHeader.indexOf(":") === -1
        ) {
          // This is a reference, old anchor had a ":" in it, a new anchor header is provided and does not have ":" in it.
          // For example, `![[foo#start:#end]]` to `![[foo#something]]`. In this case, `something` is actually supposed to replace only one part of the range.
          // Find the part that matches the old header, and replace just that with the new one.
          let [start, end] = this.referenceRangeParts(
            oldLink.from.anchorHeader
          );
          if (start === oldLoc.anchorHeader) start = newLoc.anchorHeader;
          if (end === oldLoc.anchorHeader) end = newLoc.anchorHeader;
          newLoc.anchorHeader = `${start}:#${end}`;
        }
        const newBody = LinkUtils.updateLink({
          note,
          oldLink,
          newLink: {
            ...oldLink,
            from: {
              ...newLoc,
              anchorHeader: newLoc.anchorHeader || oldLink.from.anchorHeader,
              alias,
            },
          },
        });
        _n.body = newBody;
        return _n;
      },
      _n
    );
    // const resp = await MDUtilsV4.procTransform(
    //   { engine: this.engine, fname: n.fname, vault: n.vault },
    //   { from: oldLoc, to: newLoc }
    // ).process(_n.body);
    note.body = noteMod.body;
    note.tags = noteMod.tags;
    return {
      note,
      prevNote,
      status: "update",
    };
  }

  async renameNote(opts: RenameNoteOpts): Promise<RenameNotePayload> {
    const ctx = "Store:renameNote";
    const { oldLoc, newLoc } = opts;
    const { wsRoot } = this;
    this.logger.info({ ctx, msg: "enter", opts });
    const oldVault = VaultUtils.getVaultByName({
      vaults: this.engine.vaults,
      vname: oldLoc.vaultName!,
    });
    if (!oldVault) {
      throw new DendronError({ message: "vault not set for loation" });
    }
    const vpath = vault2Path({ wsRoot, vault: oldVault });
    const oldLocPath = path.join(vpath, oldLoc.fname + ".md");
    // read from disk since contents migh have changed
    const noteRaw = file2Note(oldLocPath, oldVault);
    const oldNote = NoteUtils.hydrate({
      noteRaw,
      noteHydrated: this.notes[noteRaw.id],
    });
    const newNoteTitle = NoteUtils.isDefaultTitle(oldNote)
      ? NoteUtils.genTitle(newLoc.fname)
      : oldNote.title;
    // If the rename operation is changing the title and the caller did not tell us to use a special alias, calculate the alias change.
    // The aliases of links to this note will only change if they match the old note's title.
    if (newNoteTitle !== oldNote.title && !oldLoc.alias && !newLoc.alias) {
      oldLoc.alias = oldNote.title;
      newLoc.alias = newNoteTitle;
    }

    // const notesToChange = NoteUtils.getNotesWithLinkTo({
    let notesChangedEntries: NoteChangeEntry[] = [];
    const notesWithLinkTo = NoteUtils.getNotesWithLinkTo({
      note: oldNote,
      notes: this.notes,
    });
    this.logger.info({
      ctx,
      msg: "notesWithLinkTo:gather",
      notes: notesWithLinkTo.map((n) => NoteUtils.toLogObj(n)),
    });
    // update note body of all notes that have changed
    // const notesChanged = await Promise.all(
    //   notesToChange.map(async (n) =>
    //     this.processNoteChangedByRename({ note: n, oldLoc, newLoc })
    //   )
    // ).catch((err) => {
    //   this.logger.error({ err });
    //   throw new DendronError({ message: " error rename note", payload: err });
    // find notes that have changes.
    const notesToChange: NoteProps[] = [];
    notesWithLinkTo.forEach(async (n) => {
      const vault = n.vault;
      const vaultPath = vault2Path({ vault, wsRoot });
      // read note in case its changed
      const _n = file2Note(path.join(vaultPath, n.fname + ".md"), vault);
      const foundLinks = LinkUtils.findLinks({
        note: _n,
        engine: this.engine,
        filter: { loc: oldLoc },
      });
      let allLinks = _.orderBy(
        foundLinks,
        (link) => {
          return link.position?.start.offset;
        },
        "desc"
      );
      if (
        oldLoc.fname.toLowerCase() === newLoc.fname.toLowerCase() &&
        oldLoc.vaultName === newLoc.vaultName &&
        oldLoc.anchorHeader &&
        newLoc.anchorHeader
      ) {
        // Renaming the header, only update links that link to the old header
        allLinks = _.filter(allLinks, (link): boolean => {
          // This is a wikilink to this header
          if (link.to?.anchorHeader === oldLoc.anchorHeader) return true;
          // Or this is a range reference, and one part of the range includes this header
          return (
            link.type === "ref" &&
            isNotUndefined(oldLoc.anchorHeader) &&
            this.referenceRangeParts(link.to?.anchorHeader).includes(
              oldLoc.anchorHeader
            )
          );
        });
      }

      // only modify links that have same _to_ vault name
      // explicitly same: has vault prefix
      // implicitly same: to.vaultName is undefined, but link is in a note that's in the vault.
      allLinks = allLinks.filter((link) => {
        const oldLocVaultName = oldLoc.vaultName as string;
        const explicitlySameVault = link.to?.vaultName === oldLocVaultName;
        const oldLocVault = VaultUtils.getVaultByName({
          vaults: this.vaults,
          vname: oldLocVaultName,
        });
        const implicitlySameVault =
          _.isUndefined(link.to?.vaultName) && _.isEqual(n.vault, oldLocVault);
        return explicitlySameVault || implicitlySameVault;
      });

      const noteMod = _.reduce(
        allLinks,
        (note: NoteProps, link: DLink) => {
          const oldLink = LinkUtils.dlink2DNoteLink(link);
          // current implementation adds alias for all notes
          // check if old note has alias thats different from its fname
          let alias: string | undefined;
          if (oldLink.from.alias && oldLink.from.alias !== oldLink.from.fname) {
            alias = oldLink.from.alias;
            // Update the alias if it was using the default alias.
            if (
              oldLoc.alias?.toLocaleLowerCase() ===
                oldLink.from.alias.toLocaleLowerCase() &&
              newLoc.alias
            ) {
              alias = newLoc.alias;
            }
          }
          // for hashtag links, we'll have to regenerate the alias
          if (newLoc.fname.startsWith(TAGS_HIERARCHY)) {
            const fnameWithoutTag = newLoc.fname.slice(TAGS_HIERARCHY.length);
            // Frontmatter tags don't have the hashtag
            if (link.type !== "frontmatterTag") alias = `#${fnameWithoutTag}`;
            else alias = fnameWithoutTag;
          } else if (oldLink.from.fname.startsWith(TAGS_HIERARCHY)) {
            // If this used to be a hashtag but no longer is, the alias is like `#foo.bar` and no longer makes sense.
            // And if this used to be a frontmatter tag, the alias being undefined will force it to be removed because a frontmatter tag can't point to something outside of tags hierarchy.
            alias = undefined;
          }
          // for user tag links, we'll have to regenerate the alias
          if (newLoc.fname.startsWith(USERS_HIERARCHY)) {
            const fnameWithoutTag = newLoc.fname.slice(USERS_HIERARCHY.length);
            alias = `@${fnameWithoutTag}`;
          } else if (oldLink.from.fname.startsWith(USERS_HIERARCHY)) {
            // If this used to be a user tag but no longer is, the alias is like `@foo.bar` and no longer makes sense.
            alias = undefined;
          }
          // Correctly handle header renames in references with range based references
          if (
            oldLoc.anchorHeader &&
            link.type === "ref" &&
            isNotUndefined(oldLink.from.anchorHeader) &&
            oldLink.from.anchorHeader.indexOf(":") > -1 &&
            isNotUndefined(newLoc.anchorHeader) &&
            newLoc.anchorHeader.indexOf(":") === -1
          ) {
            // This is a reference, old anchor had a ":" in it, a new anchor header is provided and does not have ":" in it.
            // For example, `![[foo#start:#end]]` to `![[foo#something]]`. In this case, `something` is actually supposed to replace only one part of the range.
            // Find the part that matches the old header, and replace just that with the new one.
            let [start, end] = this.referenceRangeParts(
              oldLink.from.anchorHeader
            );
            if (start === oldLoc.anchorHeader) start = newLoc.anchorHeader;
            if (end === oldLoc.anchorHeader) end = newLoc.anchorHeader;
            newLoc.anchorHeader = `${start}:#${end}`;
          }
          const newBody = LinkUtils.updateLink({
            note,
            oldLink,
            newLink: {
              ...oldLink,
              from: {
                ...newLoc,
                anchorHeader: newLoc.anchorHeader || oldLink.from.anchorHeader,
                alias,
              },
            },
          });
          _n.body = newBody;
          return _n;
        },
        _n
      );
      n.body = noteMod.body;
      n.tags = noteMod.tags;
      const shouldChange = !(
        n.body === noteMod.body && n.tags === noteMod.tags
      );
      if (shouldChange) notesToChange.push(n);
    });

    /**
     * If the event source is not engine(ie: vscode rename context menu), we do not want to
     * delete the original files. We just update the references on onWillRenameFiles and return.
     */
    if (!_.isUndefined(opts.isEventSourceEngine)) {
      return this.writeManyNotes(notesToChange);
      // notesChangedEntries = await this.updateOldNoteReferences(
      //   notesToChange,
      //   ctx,
      //   notesChangedEntries
      // );
      // return notesChangedEntries;
    }
    const newNote: NoteProps = {
      ...oldNote,
      fname: newLoc.fname,
      vault: VaultUtils.getVaultByName({
        vaults: this.vaults,
        vname: newLoc.vaultName!,
      })!,
      title: newNoteTitle,
    };

    // NOTE: order matters. need to delete old note, otherwise can't write new note
    this.logger.info({
      ctx,
      msg: "deleteNote:meta:pre",
      note: NoteUtils.toLogObj(oldNote),
    });
    let deleteOldFile = false;
    let changedFromDelete: EngineDeleteNotePayload = [];
    let changeFromWrite: NoteChangeEntry[];
    if (
      oldNote.fname.toLowerCase() === newNote.fname.toLowerCase() &&
      VaultUtils.isEqual(oldNote.vault, newNote.vault, wsRoot)
    ) {
      // The file is being renamed to itself. We do this to rename a header.
      this.logger.info({ ctx, msg: "Renaming the file to same name" });
      const out = await this.writeNote(newNote, { updateExisting: true });
      changeFromWrite = out.data;
    } else {
      // The file is being renamed to a new file.
      this.logger.info({ ctx, msg: "Renaming the file to a new name" });
      try {
        changedFromDelete = await this.deleteNote(oldNote.id, {
          metaOnly: true,
        });
      } catch (err) {
        throw new DendronError({
          message:
            `Unable to delete note "${
              oldNote.fname
            }" in vault "${VaultUtils.getName(oldNote.vault)}".` +
            ` Check that this note exists, and make sure it has a frontmatter with an id.`,
          severity: ERROR_SEVERITY.FATAL,
          payload: err,
        });
      }
      deleteOldFile = true;
      this.logger.info({
        ctx,
        msg: "writeNewNote:pre",
        note: NoteUtils.toLogObj(newNote),
      });
      const out = await this.writeNote(newNote, { newNode: true });
      changeFromWrite = out.data;
    }
    this.logger.info({ ctx, msg: "updateAllNotes:pre" });
    // update all new notes
    await this.writeManyNotes(notesToChange);
    // notesChangedEntries = await this.updateOldNoteReferences(
    //   notesToChange,
    //   ctx,
    //   notesChangedEntries
    // );
    // remove old note only when rename is success
    if (deleteOldFile) fs.removeSync(oldLocPath);

    // create needs to be very last element added
    notesChangedEntries = changedFromDelete
      .concat(changeFromWrite)
      .concat(notesChangedEntries);
    // remove duplicate updates
    notesChangedEntries = _.uniqBy(notesChangedEntries, (ent) => {
      return [ent.status, ent.note.id, ent.note.fname].join("");
    });
    this.logger.info({ ctx, msg: "exit", opts, out: notesChangedEntries });
    return notesChangedEntries;
  }

  /** Utility function to write many notes concurrently. */
  private async writeManyNotes(notesToWrite: NoteProps[]) {
    const responses = await Promise.all(
      notesToWrite.map((n) => {
        this.logger.info({
          ctx: "writeManyNotes",
          msg: "writeNote:pre",
          note: NoteUtils.toLogObj(n),
        });
        return this.writeNote(n, { updateExisting: true });
      })
    );
    return responses.flatMap((response) => response.data);
  }

  /**
   * Update a note. If note exists, call {@link NoteUtils.hydrate} to populate new note with parent/children properties
   * of the existing note
   *
   * If {@link newNode} is set, set the {@link NoteProps["parent"]} property and create stubs as necessary
   *
   * @param note
   * @param opts
   * @returns
   */
  async updateNote(note: NoteProps, opts?: EngineUpdateNodesOptsV2) {
    const ctx = "updateNote";
    this.logger.debug({ ctx, note: NoteUtils.toLogObj(note), msg: "enter" });
    const maybeNote: NoteProps | undefined = this.notes[note.id];
    if (maybeNote) {
      note = NoteUtils.hydrate({ noteRaw: note, noteHydrated: maybeNote });
    }
    if (opts?.newNode) {
      NoteUtils.addParent({
        note,
        notesList: _.values(this.notes),
        createStubs: true,
        wsRoot: this.wsRoot,
      });
    }
    this.logger.debug({ ctx, note: NoteUtils.toLogObj(note) });
    this.notes[note.id] = note;
    if (maybeNote && maybeNote.fname !== note.fname) {
      this.noteFnames.delete(maybeNote);
    }
    this.noteFnames.add(note);
    return note;
  }

  async updateSchema(schemaModule: SchemaModuleProps) {
    this.schemas[schemaModule.root.id] = schemaModule;
    // const vaultDir = this.vaults[0];
    // await schemaModuleProps2File(schemaModule, vaultDir, schemaModule.fname);
    // TODO: update notes
  }

  /**
   * Write a new note. Also take care of updating logic of parents and children if new note replaces an existing note
   */
  async _writeNewNote({
    note,
    existingNote,
    opts,
  }: {
    note: NoteProps;
    existingNote?: NoteProps;
    opts?: EngineWriteOptsV2;
  }): Promise<NoteProps[]> {
    const ctx = "_writeNewNote";
    this.logger.info({
      ctx,
      msg: "enter",
      note: NoteUtils.toLogObj(note),
    });
    let changed: NoteProps[] = [];
    // in this case, we are deleting the old note and writing a new note in its place with the same hierarchy
    // the parent of this note needs to have the old note removed (because the id is now different)
    // the new note needs to have the old note's children
    if (existingNote) {
      // need to update parent metadata since child id is changing
      const parentNote = this.notes[existingNote.parent as string] as NoteProps;

      // remove existing note from parent's children
      parentNote.children = _.reject<string[]>(
        parentNote.children,
        (ent: string) => ent === existingNote.id
      ) as string[];
      // update parent's children
      this.notes[existingNote.parent as string].children = parentNote.children;
      // move existingNote's children to newly written note
      note.children = existingNote.children;
      // delete existingNote
      delete this.notes[existingNote.id];
      this.noteFnames.delete(existingNote);
    }
    // check if we need to add parents
    // eg. if user created `baz.one.two` and neither `baz` or `baz.one` exist, then they need to be created
    // this is the default behavior
    if (!opts?.noAddParent) {
      changed = NoteUtils.addParent({
        note,
        notesList: _.values(this.notes),
        createStubs: true,
        wsRoot: this.wsRoot,
      });
    }
    this.logger.info({
      ctx,
      msg: "exit",
      changed: changed.map((n) => NoteUtils.toLogObj(n)),
    });
    return changed;
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const ctx = `FileStore:writeNote:${note.fname}`;
    let changed: NoteProps[] = [];
    let error: DendronError | null = null;
    this.logger.info({
      ctx,
      msg: "enter",
      opts,
      note: NoteUtils.toLogObj(note),
    });
    // check if note might already exist
    const maybeNote = NoteUtils.getNoteByFnameV5({
      fname: note.fname,
      notes: this.notes,
      vault: note.vault,
      wsRoot: this.wsRoot,
    });
    this.logger.info({
      ctx,
      msg: "check:existing",
      maybeNoteId: _.pick(maybeNote || {}, ["id", "stub"]),
    });

    // don't count as delete if we're updating existing note
    // we need to preserve the ids, otherwise can result in data conflict
    let noDelete = false;
    if (maybeNote?.stub || opts?.updateExisting) {
      note = { ...maybeNote, ...note };
      noDelete = true;
    } else {
      changed = await this._writeNewNote({
        note,
        existingNote: maybeNote,
        opts,
      });
    }

    // add schema if applicable
    const schemaMatch = SchemaUtils.matchPath({
      notePath: note.fname,
      schemaModDict: this.schemas,
    });
    this.logger.info({
      ctx,
      msg: "pre:note2File",
    });

    if (opts?.runHooks === false) {
      this.logger.info({
        ctx,
        msg: "hooks disabled for write",
      });
    } else {
      const hooks = _.filter(this.engine.hooks.onCreate, (hook) =>
        NoteUtils.match({ notePath: note.fname, pattern: hook.pattern })
      );
      const resp = await _.reduce<DHookEntry, Promise<RequireHookResp>>(
        hooks,
        async (notePromise, hook) => {
          const { note } = await notePromise;
          const script = HookUtils.getHookScriptPath({
            wsRoot: this.wsRoot,
            basename: hook.id + ".js",
          });
          return HookUtils.requireHook({
            note,
            fpath: script,
            wsRoot: this.wsRoot,
          });
        },
        Promise.resolve({ note })
      ).catch(
        (err) =>
          new DendronError({
            severity: ERROR_SEVERITY.MINOR,
            message: "error with hook",
            payload: stringifyError(err),
          })
      );
      if (resp instanceof DendronError) {
        error = resp;
        this.logger.error({ ctx, error: stringifyError(error) });
      } else {
        const valResp = NoteUtils.validate(resp.note);
        if (valResp instanceof DendronError) {
          error = valResp;
          this.logger.error({ ctx, error: stringifyError(error) });
        } else {
          note = resp.note;
          this.logger.info({ ctx, msg: "fin:RunHooks", payload: resp.payload });
        }
      }
    }
    // order matters - only write file after parents are established @see(_writeNewNote)
    await note2File({
      note,
      vault: note.vault,
      wsRoot: this.wsRoot,
    });

    // schema metadata is only applicable at runtime
    // we therefore write it after we persist note to store
    if (schemaMatch) {
      this.logger.info({
        ctx,
        msg: "pre:addSchema",
      });
      const { schema, schemaModule } = schemaMatch;
      NoteUtils.addSchema({ note, schema, schemaModule });
    }

    // if we added a new note and it overwrote an existing note
    // we now need to update the metadata of existing notes ^change
    this.logger.info({
      ctx,
      msg: "pre:updateNotes",
    });
    await Promise.all(
      [note].concat(changed).map((ent) => this.updateNote(ent))
    );
    const changedEntries = changed.map((ent) => ({
      note: ent,
      status: "update" as const,
    })) as NoteChangeEntry[];
    changedEntries.push({ note, status: "create" });
    if (maybeNote && !noDelete) {
      changedEntries.push({ note: maybeNote, status: "delete" });
    }
    this.logger.info({
      ctx,
      msg: "exit",
    });
    return {
      error,
      data: changedEntries,
    };
  }

  async writeSchema(schemaModule: SchemaModuleProps) {
    this.schemas[schemaModule.root.id] = schemaModule;
    const vault = schemaModule.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    await schemaModuleProps2File(schemaModule, vpath, schemaModule.fname);
  }
}
