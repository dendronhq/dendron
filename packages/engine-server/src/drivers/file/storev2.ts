import {
  assert,
  BacklinkUtils,
  BulkWriteNotesOpts,
  ConfigUtils,
  CONSTANTS,
  DeleteSchemaResp,
  DendronCompositeError,
  DendronError,
  DEngineClient,
  DHookEntry,
  DLink,
  DLinkUtils,
  DNodeUtils,
  DNoteAnchorPositioned,
  DNoteLoc,
  DStore,
  DVault,
  EngineDeleteOpts,
  EngineSchemaWriteOpts,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  error2PlainObject,
  ErrorUtils,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  GetSchemaResp,
  IDendronError,
  IntermediateDendronConfig,
  isNotUndefined,
  NoteChangeEntry,
  NoteChangeUpdateEntry,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotesCacheEntryMap,
  NoteUtils,
  RenameNoteOpts,
  RespV3,
  RespWithOptError,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaUtils,
  StoreV2InitResp,
  stringifyError,
  TAGS_HIERARCHY,
  TimeUtils,
  USERS_HIERARCHY,
  USER_MESSAGES,
  VaultUtils,
  WriteNoteResp,
  WriteSchemaResp,
} from "@dendronhq/common-all";
import {
  DConfig,
  DLogger,
  file2Note,
  getAllFiles,
  getDurationMilliseconds,
  note2File,
  schemaModuleProps2File,
  vault2Path,
} from "@dendronhq/common-server";
import { LinkUtils } from "@dendronhq/unified";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { NotesFileSystemCache } from "../../cache";
import { HookUtils, RequireHookResp } from "../../topics/hooks";
import { InMemoryNoteCache } from "../../util/inMemoryNoteCache";
import { EngineUtils } from "../../utils";
import { SQLiteMetadataStore } from "../SQLiteMetadataStore";
import { NoteParser } from "./noteParser";
import { SchemaParser } from "./schemaParser";

export type DEngineInitSchemaResp = RespWithOptError<SchemaModuleProps[]>;

export class FileStorage implements DStore {
  public vaults: DVault[];
  /**
   * Warning: currently this note dictionary contains backlink data that gets
   * populated upon initialization. However, the update note operations do not change
   * the backlink data in this dictionary hence it starts to contain stale backlink data.
   *  */
  public notes: NotePropsByIdDict;
  public noteFnames: NotePropsByFnameDict;
  public schemas: SchemaModuleDict;
  public logger: DLogger;
  public anchors: DNoteAnchorPositioned[];
  public wsRoot: string;
  public config: IntermediateDendronConfig;

  private engine: DEngineClient;

  constructor(props: {
    engine: DEngineClient;
    logger: DLogger;
    config: IntermediateDendronConfig;
  }) {
    const { vaults, wsRoot } = props.engine;
    const { logger, config } = props;
    this.wsRoot = wsRoot;
    this.vaults = vaults;
    this.notes = {};
    this.noteFnames = {};
    this.schemas = {};
    this.anchors = [];
    this.logger = logger;
    this.config = config;
    const ctx = "FileStorageV2";
    this.logger.info({ ctx, wsRoot, vaults, level: this.logger.level });
    this.engine = props.engine;
  }

  async init(): Promise<StoreV2InitResp> {
    const ctx = "FileStorage:init";
    let errors: IDendronError<any>[] = [];
    try {
      const resp = await this.initSchema();
      if (resp.error) {
        errors.push(FileStorage.createMalformedSchemaError(resp));
      }
      resp.data.map((ent) => {
        this.schemas[ent.root.id] = ent;
      });
      const { errors: initErrors } = await this.initNotes();
      errors = errors.concat(initErrors);
      this.logger.info({ ctx, msg: "post:initNotes", errors });

      // Backlink candidates have to be done after notes are initialized because it depends on the engine already having notes in it
      if (this.config.dev?.enableLinkCandidates) {
        const ctx = "_addLinkCandidates";
        const start = process.hrtime();
        this.logger.info({ ctx, msg: "pre:addLinkCandidates" });
        // this mutates existing note objects so we don't need to reset the notes
        this._addLinkCandidates();
        const duration = getDurationMilliseconds(start);
        this.logger.info({ ctx, duration });
      }

      const { notes, schemas, config } = this;
      let error: IDendronError | undefined = errors[0];
      if (errors.length > 1) {
        error = new DendronCompositeError(errors);
      }
      this.logger.info({ ctx, msg: "exit" });
      return {
        data: {
          notes,
          schemas,
          config,
          wsRoot: this.wsRoot,
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

    let fullPath;
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

  /**
   * See {@link DStore.getNote}
   */
  async getNote(id: string): Promise<RespV3<NoteProps>> {
    const maybeNote = this.notes[id];

    if (maybeNote) {
      return { data: _.cloneDeep(maybeNote) };
    } else {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `NoteProps not found for key ${id}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  /**
   * See {@link DStore.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    const { fname, vault, excludeStub } = opts;
    if (!fname && !vault && _.isUndefined(excludeStub)) {
      return [];
    }

    let notes: NoteProps[];

    if (fname) {
      notes = NoteDictsUtils.findByFname(
        fname,
        { notesById: this.notes, notesByFname: this.noteFnames },
        vault
      );
    } else if (vault) {
      notes = _.values(this.notes).filter((note) =>
        VaultUtils.isEqualV2(note.vault, vault)
      );
    } else {
      notes = _.values(this.notes);
    }

    if (excludeStub) {
      notes = notes.filter((note) => note.stub !== true);
    }

    return _.cloneDeep(notes);
  }

  /**
   *
   * @param id id of note to be deleted
   * @returns
   */
  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<NoteChangeEntry[]> {
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
    // if have children, create stub note with a new id
    if (!_.isEmpty(noteToDelete.children)) {
      const replacingStub = NoteUtils.create({
        // the replacing stub should not keep the old note's body and link.
        // otherwise, it will be captured while processing links and will
        // fail because this note is not actually in the file system.
        ..._.omit(noteToDelete, ["id", "links", "body"]),
        stub: true,
      });
      this.logger.info({ ctx, noteAsLog, msg: "delete from parent" });
      if (!noteToDelete.parent) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
        });
      }
      const parentNote: NoteProps | undefined = this.notes[noteToDelete.parent];
      if (parentNote) {
        const parentNotePrev = { ...parentNote };
        DNodeUtils.removeChild(parentNote, noteToDelete);
        DNodeUtils.addChild(parentNote, replacingStub);
        out.push({
          note: parentNote,
          status: "update",
          prevNote: parentNotePrev,
        });
      } else {
        this.logger.error({
          ctx,
          noteToDelete,
          message: "Parent note missing from state",
        });
      }

      // Update children's parent id to new note
      noteToDelete.children.forEach((child) => {
        const childNote = this.notes[child];
        const prevChildNoteState = { ...childNote };
        childNote.parent = replacingStub.id;

        // add one entry for each child updated
        out.push({
          prevNote: prevChildNoteState,
          note: childNote,
          status: "update",
        });
      });

      await this.updateNote(replacingStub);
      out.push({ note: replacingStub, status: "create" });
    } else {
      // no children, delete reference from parent
      this.logger.info({ ctx, noteAsLog, msg: "delete from parent" });
      if (!noteToDelete.parent) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
        });
      }
      // remove from parent
      const resps: Promise<NoteChangeEntry[]>[] = [];
      let parentNote = this.notes[noteToDelete.parent];

      if (parentNote) {
        const parentNotePrev = { ...parentNote };
        parentNote.children = _.reject(
          parentNote.children,
          (ent) => ent === noteToDelete.id
        );
        // if parent note is not a stub, update it
        if (!parentNote.stub) {
          out.push({
            note: parentNote,
            status: "update",
            prevNote: parentNotePrev,
          });
        }
        // check all stubs
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
      } else {
        this.logger.error({
          ctx,
          noteToDelete,
          message: "Parent note missing from state",
        });
      }
      for (const resp of await Promise.all(resps)) {
        out = out.concat(resp);
      }
    }
    // remove from fs
    if (!opts?.metaOnly) {
      this.logger.info({ ctx, noteAsLog, msg: "removing from disk", fpath });
      await fs.unlink(fpath);
    }

    // delete from note dictionary
    NoteDictsUtils.delete(noteToDelete, {
      notesById: this.notes,
      notesByFname: this.noteFnames,
    });

    // Remove backlinks if applicable
    const backlinkChanges = await Promise.all(
      noteToDelete.links.map((link) => this.removeBacklink(link))
    );
    out = out.concat(backlinkChanges.flat());

    out.push({ note: noteToDelete, status: "delete" });
    return out;
  }

  getSchema(id: string): Promise<GetSchemaResp> {
    return Promise.resolve({ data: this.schemas[id] });
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<DeleteSchemaResp> {
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
        ? undefined
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
    const out = await getAllFiles({
      root: URI.file(vpath),
      include: ["*.schema.yml"],
    });
    if (out.error || !out.data) {
      return {
        data: [],
        errors: [
          new DendronError({
            message: `Unable to get schemas for vault ${VaultUtils.getName(
              vault
            )}`,
            severity: ERROR_SEVERITY.MINOR,
            payload: out.error,
          }),
        ],
      };
    }
    const schemaFiles = out.data.map((entry) => entry.toString());
    this.logger.info({ ctx, schemaFiles });
    if (_.isEmpty(schemaFiles)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.NO_SCHEMA_FOUND,
        message: JSON.stringify(vault),
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

  async initNotes(): Promise<{
    errors: IDendronError[];
  }> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });

    let notesWithLinks: NoteProps[] = [];
    let errors: IDendronError<any>[] = [];
    const start = process.hrtime();
    // instantiate so we can use singleton later
    if (this.config.workspace.metadataStore === "sqlite") {
      // eslint-disable-next-line no-new
      const store = new SQLiteMetadataStore({
        wsRoot: this.wsRoot,
        force: true,
      });

      // sleep until store is done
      const output = await TimeUtils.awaitWithLimit(
        { limitMs: 6e4 },
        async () => {
          while (store.status === "loading") {
            this.logger.info({ ctx, msg: "downloading sql dependencies..." });
            // eslint-disable-next-line no-await-in-loop
            await TimeUtils.sleep(1000);
          }
          return;
        }
      );

      this.logger.info({
        ctx,
        msg: "checking if sql is initialized...",
        output,
      });
      if (!(await SQLiteMetadataStore.isDBInitialized())) {
        await SQLiteMetadataStore.createAllTables();
        await SQLiteMetadataStore.createWorkspace(this.wsRoot);
      }
    }

    const out = await Promise.all(
      (this.vaults as DVault[]).map(async (vault) => {
        const {
          notesById,
          cacheUpdates,
          errors: initErrors,
        } = await this._initNotes(vault);
        errors = errors.concat(initErrors);
        notesWithLinks = notesWithLinks.concat(
          _.filter(notesById, (n) => !_.isEmpty(n.links))
        );

        this.logger.info({
          ctx,
          vault,
          numEntries: _.size(notesById),
          numCacheUpdates: _.size(cacheUpdates),
        });

        return notesById;
      })
    );
    this.notes = Object.assign({}, ...out);
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    const allNotes = _.values(this.notes);
    if (_.size(this.notes) === 0) {
      errors.push(
        new DendronError({
          message: "No vaults initialized!",
          severity: ERROR_SEVERITY.FATAL,
        })
      );
    }

    this._addBacklinks({ notesWithLinks, allNotes });
    const duration = getDurationMilliseconds(start);
    this.logger.info({ ctx, msg: `time to init notes: "${duration}" ms` });

    return { errors };
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
      let _noteToForErrorLog: NoteProps | undefined;
      try {
        noteFrom.links.forEach((link) => {
          const maybeBacklink = BacklinkUtils.createFromDLink(link);
          if (maybeBacklink) {
            const notes = noteCache.getNotesByFileNameIgnoreCase(
              link.to!.fname!
            );

            notes.forEach((noteTo: NoteProps) => {
              _noteToForErrorLog = noteTo;
              BacklinkUtils.addBacklinkInPlace({
                note: noteTo,
                backlink: maybeBacklink,
              });
            });
          }
        });
      } catch (err: any) {
        const error = error2PlainObject(err);
        this.logger.error({
          error,
          noteFrom: NoteUtils.toLogObj(noteFrom),
          noteTo: _noteToForErrorLog
            ? NoteUtils.toLogObj(_noteToForErrorLog)
            : null,
          message: "issue with backlinks",
        });
      }
    });
  }

  private _addLinkCandidates() {
    return _.map(this.notes, (noteFrom: NoteProps) => {
      try {
        const maxNoteLength = ConfigUtils.getWorkspace(
          this.config
        ).maxNoteLength;
        if (
          noteFrom.body.length <
          (maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
        ) {
          const linkCandidates = LinkUtils.findLinkCandidatesSync({
            note: noteFrom,
            noteDicts: {
              notesById: this.notes,
              notesByFname: this.noteFnames,
            },
            config: this.config,
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
    notesById: NotePropsByIdDict;
    cacheUpdates: NotesCacheEntryMap;
    errors: IDendronError[];
  }> {
    const ctx = "initNotes";
    let errors: IDendronError[] = [];
    this.logger.info({ ctx, msg: "enter" });
    const wsRoot = this.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    const out = await getAllFiles({
      root: URI.file(vpath),
      include: ["*.md"],
    });
    if (out.error) {
      // Keep initializing other vaults
      errors.push(
        new DendronError({
          message: `Unable to read notes for vault ${VaultUtils.getName(
            vault
          )}`,
          severity: ERROR_SEVERITY.MINOR,
          payload: out.error,
        })
      );
    }
    const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
    const notesCache: NotesFileSystemCache = new NotesFileSystemCache({
      cachePath,
      noCaching: this.config.noCaching,
      logger: this.logger,
    });
    if (!out.data) {
      return {
        cacheUpdates: {},
        errors,
        notesById: {},
      };
    }
    const noteFiles = out.data;

    const {
      notesById,
      cacheUpdates,
      errors: parseErrors,
    } = await new NoteParser({
      store: this,
      cache: notesCache,
      engine: this.engine,
      logger: this.logger,
    }).parseFiles(noteFiles, vault, this.schemas, {
      useSQLiteMetadataStore: this.config.workspace.metadataStore === "sqlite",
    });

    errors = errors.concat(parseErrors);
    this.logger.info({ ctx, msg: "parseNotes:fin" });

    return { notesById, cacheUpdates, errors };
  }

  async bulkWriteNotes(opts: BulkWriteNotesOpts) {
    this.logger.info({ ctx: "bulkWriteNotes", msg: "enter" });
    if (opts.skipMetadata) {
      const noteDicts = {
        notesById: this.notes,
        notesByFname: this.noteFnames,
      };
      await Promise.all(
        opts.notes.map((note) => {
          NoteDictsUtils.add(note, noteDicts);
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
        data: notesChanged,
      };
    }
    const writeResponses = await Promise.all(
      opts.notes.flatMap(async (note) => {
        return this.writeNote(note, opts.opts);
      })
    );
    const errors = writeResponses
      .flatMap((response) => response.error)
      .filter(isNotUndefined);

    return {
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
      data: writeResponses
        .flatMap((response) => response.data)
        .filter(isNotUndefined),
    };
  }

  private referenceRangeParts(anchorHeader?: string): string[] {
    if (!anchorHeader || anchorHeader.indexOf(":") === -1) return [];
    let [start, end] = anchorHeader.split(":");
    start = start.replace(/^#*/, "");
    end = end.replace(/^#*/, "");
    return [start, end];
  }

  /**
   * Update the links inside this note that need to be updated for the rename from `oldLoc` to `newLoc`
   * Will update the note in place
   */
  private async processNoteChangedByRename({
    note,
    oldLoc,
    newLoc,
  }: {
    note: NoteProps;
    oldLoc: DNoteLoc;
    newLoc: DNoteLoc;
  }): Promise<NoteChangeUpdateEntry | undefined> {
    const ctx = "store:processNoteChangedByRename";
    const prevNote = { ...note };
    const vault = note.vault;
    const vaultPath = vault2Path({ vault, wsRoot: this.wsRoot });

    // read note in case its changed
    const resp = file2Note(path.join(vaultPath, note.fname + ".md"), vault);
    if (ErrorUtils.isErrorResp(resp)) {
      // couldn't read note. log it and return.
      this.logger.error({ ctx, error: stringifyError(resp.error) });
      return;
    }
    const _n = resp.data;
    const foundLinks = LinkUtils.findLinksFromBody({
      note: _n,
      filter: { loc: oldLoc },
      config: this.config,
    });

    // important to order by position since we replace links and this affects
    // subsequent links
    let allLinks = _.orderBy(
      foundLinks,
      (link) => {
        return link.position?.start.offset;
      },
      "desc"
    );

    // perform header updates as needed
    if (
      oldLoc.fname.toLowerCase() === newLoc.fname.toLowerCase() &&
      // TODO: we don't have a spec on vault name but to be consistent, we should also lowercase
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

    // filter all links for following criteria:
    // - only modify links that have same _to_ vault name
    // - explicitly same: has vault prefix
    // - implicitly same: to.vaultName is undefined, but link is in a note that's in the vault.
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

    // perform link substitution
    // TODO: this should be extracted into a re-usable utility since it comes up quite a lot
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

    // replace note body if needed
    const shouldChange = !(
      note.body === noteMod.body && note.tags === noteMod.tags
    );
    if (shouldChange) {
      note.body = noteMod.body;
      note.tags = noteMod.tags;
      return {
        note,
        prevNote,
        status: "update",
      };
    }
    return;
  }

  async renameNote(opts: RenameNoteOpts): Promise<NoteChangeEntry[]> {
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

    // TODO: Move this business logic to engine so we can update metadata
    // read from disk since contents might have changed
    const resp = file2Note(oldLocPath, oldVault);
    if (ErrorUtils.isErrorResp(resp)) {
      throw new DendronError({ message: "file not found" });
    }
    const noteRaw = resp.data;

    if (!this.notes[noteRaw.id]) {
      throw new DendronError({
        status: ERROR_STATUS.DOES_NOT_EXIST,
        message:
          `Unable to rename note "${
            noteRaw.fname
          }" in vault "${VaultUtils.getName(noteRaw.vault)}".` +
          ` Check that this note exists, and make sure it has a frontmatter with an id.`,
        severity: ERROR_SEVERITY.FATAL,
      });
    }
    const oldNote = NoteUtils.hydrate({
      noteRaw,
      noteHydrated: this.notes[noteRaw.id],
      opts: { keepBackLinks: true },
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

    let notesChangedEntries: NoteChangeEntry[] = [];

    this.logger.info({ ctx, msg: "updateAllNotes:pre" });
    const notesWithLinkTo = _.uniq(
      oldNote.links
        .filter((link) => link.type === "backlink")
        .map((link) => {
          if (link.from.id) return this.notes[link.from.id];
          else return undefined;
        })
        .filter(isNotUndefined)
    );

    this.logger.info({
      ctx,
      msg: "notesWithLinkTo:gather",
      notes: notesWithLinkTo.map((n) => NoteUtils.toLogObj(n)),
    });

    // update note body of all notes that have changed
    const notesToUpdate = (
      await Promise.all(
        notesWithLinkTo.map(async (note) => {
          const out = await this.processNoteChangedByRename({
            note,
            oldLoc,
            newLoc,
          });
          // If note being renamed has references to itself, make sure to update those as well
          if (out && out.note.id === oldNote.id) {
            oldNote.body = out.note.body;
            oldNote.tags = out.note.tags;
          }
          return out?.note;
        })
      )
    ).filter(isNotUndefined);

    // update all new notes
    const writeResp = await this.bulkWriteNotes({ notes: notesToUpdate });
    notesChangedEntries = notesChangedEntries.concat(writeResp.data);

    /**
     * If the event source is not engine(ie: vscode rename context menu), we do not want to
     * delete the original files. We just update the references on onWillRenameFiles and return.
     */
    const newNote: NoteProps = {
      ...oldNote,
      fname: newLoc.fname,
      vault: VaultUtils.getVaultByName({
        vaults: this.vaults,
        vname: newLoc.vaultName!,
      })!,
      title: newNoteTitle,
      // when renaming, we are moving a note into a completely different hierarchy. ^pojmz0g80gds
      // we are not concerned with the children it has, so the new note
      // shouldn't inherit the old note's children.
      children: [],
    };

    // NOTE: order matters. need to delete old note, otherwise can't write new note
    this.logger.info({
      ctx,
      msg: "deleteNote:meta:pre",
      note: NoteUtils.toLogObj(oldNote),
    });
    if (
      oldNote.fname.toLowerCase() === newNote.fname.toLowerCase() &&
      VaultUtils.isEqual(oldNote.vault, newNote.vault, wsRoot)
    ) {
      // The file is being renamed to itself. We do this to rename a header.
      this.logger.info({ ctx, msg: "Renaming the file to same name" });

      // we remove the children [[here|../packages/engine-server/src/drivers/file/storev2.ts#^pojmz0g80gds]],
      // but we don't want that in this case. we need to add the old note's children back in
      newNote.children = oldNote.children;
    } else {
      // The file is being renamed to a new file.
      this.logger.info({ ctx, msg: "Renaming the file to a new name" });
      try {
        const changedFromDelete = await this.deleteNote(oldNote.id, {
          metaOnly: opts.metaOnly,
        });
        notesChangedEntries = notesChangedEntries.concat(changedFromDelete);
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
    }

    this.logger.info({
      ctx,
      msg: "writeNewNote:pre",
      note: NoteUtils.toLogObj(newNote),
    });
    const out = await this.writeNote(newNote, {
      metaOnly: opts.metaOnly,
    });
    const changeFromWrite = out.data;

    // create needs to be very last element added
    if (changeFromWrite) {
      notesChangedEntries = notesChangedEntries.concat(changeFromWrite);
    }

    this.logger.info({ ctx, msg: "exit", opts, out: notesChangedEntries });
    return notesChangedEntries;
  }

  /**
   * Update a note.
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

    const changes: NoteChangeEntry[] = [];

    try {
      const noteDicts = {
        notesById: this.notes,
        notesByFname: this.noteFnames,
      };
      if (opts?.newNode) {
        const changesToParents = NoteUtils.addOrUpdateParents({
          note,
          noteDicts,
          createStubs: true,
        });
        changesToParents.forEach((changedEntry) => {
          NoteDictsUtils.add(changedEntry.note, noteDicts);
          changes.push(changedEntry);
        });

        changes.push({
          note,
          status: "create",
        });
      } else {
        const prevNote = noteDicts.notesById[note.id];
        changes.push({
          prevNote,
          note,
          status: "update",
        });
      }
      this.logger.debug({ ctx, note: NoteUtils.toLogObj(note) });
      NoteDictsUtils.add(note, noteDicts);
    } catch (error: any) {
      return { error };
    }

    return { data: changes, error: null };
  }

  /**
   * Write a new note. Also take care of updating logic of parents and children if new note replaces an existing note that has a different id.
   * If the existing and new note have the same id, then do nothing.
   *
   * @param param0
   * @returns - Changed Entries
   */
  private async _writeNewNote({
    note,
    existingNote,
    opts,
  }: {
    note: NoteProps;
    existingNote?: NoteProps;
    opts?: EngineWriteOptsV2;
  }): Promise<NoteChangeEntry[]> {
    const ctx = "_writeNewNote";
    this.logger.info({
      ctx,
      msg: "enter",
      note: NoteUtils.toLogObj(note),
    });

    // Update links/anchors based on note body
    EngineUtils.refreshNoteLinksAndAnchors({
      note,
      engine: this.engine,
      config: DConfig.readConfigSync(this.wsRoot),
    });

    let changed: NoteChangeEntry[] = [];
    const noteDicts = {
      notesById: this.notes,
      notesByFname: this.noteFnames,
    };
    const isSameNote = existingNote ? existingNote.id === note.id : false;

    // in this case, we are deleting the old note and writing a new note in its place with the same hierarchy
    // the parent of this note needs to have the old note removed (because the id is now different)
    // the new note needs to have the old note's children
    if (existingNote && !isSameNote) {
      // make sure existing note actually has a parent.
      if (!existingNote.parent) {
        // TODO: We should be able to handle rewriting of root. This happens
        // with certain operations such as Doctor FixFrontmatter
        throw new DendronError({
          message: `no parent found for ${note.fname}`,
        });
      }

      // save the state of the parent to later record changed entry.
      const parent = this.notes[existingNote.parent];
      const prevParentState = { ...parent };

      // delete the existing note.
      NoteDictsUtils.delete(existingNote, noteDicts);

      // first, update existing note's parent
      // so that it doesn't hold the deleted existing note's id as children
      DNodeUtils.removeChild(parent, existingNote);

      // then update parent note of existing note
      // so that the newly created note is a child
      DNodeUtils.addChild(parent, note);

      // add an entry for the updated parent if there was a change
      changed.push({
        prevNote: prevParentState,
        note: parent,
        status: "update",
      });

      // now move existing note's orphaned children to new note
      existingNote.children.forEach((child) => {
        const childNote = this.notes[child];
        const prevChildNoteState = { ...childNote };
        DNodeUtils.addChild(note, childNote);

        // add one entry for each child updated
        changed.push({
          prevNote: prevChildNoteState,
          note: childNote,
          status: "update",
        });
      });

      changed.push({ note: existingNote, status: "delete" });
    }
    // check if we need to add parents
    // eg. if user created `baz.one.two` and neither `baz` or `baz.one` exist, then they need to be created
    // this is the default behavior
    // only do this if we aren't writing to existing note. we never hit this case in that situation.
    if (!opts?.noAddParent && !existingNote) {
      const out = NoteUtils.addOrUpdateParents({
        note,
        noteDicts,
        createStubs: true,
      });
      // add one entry for each parent updated
      changed = changed.concat(out);
    }
    this.logger.info({
      ctx,
      msg: "exit",
      changed: changed.map((n) => NoteUtils.toLogObj(n.note)),
    });
    return changed;
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const ctx = `FileStore:writeNote:${note.fname}`;
    let changedEntries: NoteChangeEntry[] = [];
    this.logger.info({
      ctx,
      msg: "enter",
      opts,
      note: NoteUtils.toLogObj(note),
    });
    // check if note might already exist
    const maybeNote = NoteDictsUtils.findByFname(
      note.fname,
      { notesById: this.notes, notesByFname: this.noteFnames },
      note.vault
    )[0];
    this.logger.info({
      ctx,
      msg: "check:existing",
      maybeNoteId: _.pick(maybeNote || {}, ["id", "stub"]),
    });

    // Override existing note if ids are different
    changedEntries = await this._writeNewNote({
      note,
      existingNote: maybeNote,
      opts,
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
        this.logger.error({ ctx, error: stringifyError(resp) });
        return { error: resp };
      } else {
        const valResp = NoteUtils.validate(resp.note);
        if (valResp.error) {
          this.logger.error({ ctx, error: stringifyError(valResp.error) });
          return { error: valResp.error };
        } else {
          note = resp.note;
          this.logger.info({ ctx, msg: "fin:RunHooks", payload: resp.payload });
        }
      }
    }
    // order matters - only write file after parents are established @see(_writeNewNote)
    if (!opts?.metaOnly) {
      const hash = await note2File({
        note,
        vault: note.vault,
        wsRoot: this.wsRoot,
      });
      note.contentHash = hash;
    }

    // Try to attach schema if this is a new note
    // schema metadata is only applicable at runtime
    // we therefore write it after we persist note to store
    if (maybeNote) {
      note.schema = maybeNote.schema;
    } else {
      const schemaMatch = await SchemaUtils.matchPath({
        notePath: note.fname,
        engine: this.engine,
      });
      if (schemaMatch) {
        this.logger.info({
          ctx,
          msg: "pre:addSchema",
        });
        const { schema, schemaModule } = schemaMatch;
        NoteUtils.addSchema({ note, schema, schemaModule });
      }
    }
    // if we added a new note and it overwrote an existing note
    // we now need to update the metadata of existing notes ^change
    // TODO: Not sure the this.updateNote(ent) call is necessary, since it's already updated via _writeNewNote above.
    this.logger.info({
      ctx,
      msg: "pre:updateNotes",
    });
    await Promise.all(
      [note]
        .concat(
          changedEntries
            .filter((entry) => entry.status !== "delete")
            .map((entry) => entry.note)
        )
        .map((ent) => this.updateNote(ent))
    );

    if (maybeNote && maybeNote.id === note.id) {
      /**
       * Calculate diff of links with the `to` prop that have changed.
       * For links that have been removed, delete those backlinks from the toNotes.
       * For links that have been added, create backlinks for the toNotes
       */
      const deletedLinks = maybeNote.links.filter(
        (link) =>
          link.to?.fname &&
          !note.links.some((linkToCompare) =>
            DLinkUtils.isEquivalent(link, linkToCompare)
          )
      );
      const addedLinks = note.links.filter(
        (link) =>
          link.to?.fname &&
          !maybeNote.links.some((linkToCompare) =>
            DLinkUtils.isEquivalent(link, linkToCompare)
          )
      );

      const addedChanges = await Promise.all(
        addedLinks.map((link) => {
          return this.addBacklink(link);
        })
      );

      const removedChanges = await Promise.all(
        deletedLinks.map((link) => {
          return this.removeBacklink(link);
        })
      );
      changedEntries = changedEntries.concat(addedChanges.flat());
      changedEntries = changedEntries.concat(removedChanges.flat());
      changedEntries.push({ prevNote: maybeNote, note, status: "update" });
    } else {
      // If this is a new note, add backlinks if applicable to referenced notes
      const backlinkChanges = await Promise.all(
        note.links.map((link) => this.addBacklink(link))
      );
      changedEntries = changedEntries.concat(backlinkChanges.flat());
      changedEntries.push({ note, status: "create" });
    }
    this.logger.info({
      ctx,
      msg: "exit",
    });
    return {
      data: changedEntries,
    };
  }

  async writeSchema(
    schemaModule: SchemaModuleProps,
    opts?: EngineSchemaWriteOpts
  ): Promise<WriteSchemaResp> {
    this.schemas[schemaModule.root.id] = schemaModule;
    if (opts?.metaOnly) {
      return { data: undefined };
    }
    const vault = schemaModule.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    await schemaModuleProps2File(schemaModule, vpath, schemaModule.fname);
    return { data: undefined };
  }

  /**
   * Create backlink from given link that references another note (denoted by presence of link.to field)
   * and add that backlink to referenced note's links
   *
   * @param link Link potentionally referencing another note
   */
  private async addBacklink(link: DLink): Promise<NoteChangeEntry[]> {
    if (!link.to?.fname) {
      return [];
    }
    const maybeBacklink = BacklinkUtils.createFromDLink(link);
    if (maybeBacklink) {
      const maybeVault = link.to?.vaultName
        ? VaultUtils.getVaultByName({
            vname: link.to?.vaultName,
            vaults: this.vaults,
          })
        : undefined;
      const notes = NoteDictsUtils.findByFname(
        link.to.fname,
        { notesById: this.notes, notesByFname: this.noteFnames },
        maybeVault
      );
      return Promise.all(
        notes.map(async (note) => {
          const prevNote = _.cloneDeep(note);
          BacklinkUtils.addBacklinkInPlace({ note, backlink: maybeBacklink });
          NoteDictsUtils.add(note, {
            notesById: this.notes,
            notesByFname: this.noteFnames,
          });
          return {
            prevNote,
            note,
            status: "update",
          };
        })
      );
    }
    return [];
  }

  /**
   * Remove backlink associated with given link that references another note (denoted by presence of link.to field)
   * from that referenced note
   *
   * @param link Link potentionally referencing another note
   */
  private async removeBacklink(link: DLink): Promise<NoteChangeEntry[]> {
    if (!link.to?.fname) {
      return [];
    }
    const maybeBacklink = BacklinkUtils.createFromDLink(link);
    if (maybeBacklink) {
      const maybeVault = link.to?.vaultName
        ? VaultUtils.getVaultByName({
            vname: link.to?.vaultName,
            vaults: this.vaults,
          })
        : undefined;
      const notes = NoteDictsUtils.findByFname(
        link.to.fname,
        { notesById: this.notes, notesByFname: this.noteFnames },
        maybeVault
      );
      return Promise.all(
        notes.map(async (note) => {
          const prevNote = _.cloneDeep(note);
          BacklinkUtils.removeBacklinkInPlace({
            note,
            backlink: maybeBacklink,
          });
          NoteDictsUtils.add(note, {
            notesById: this.notes,
            notesByFname: this.noteFnames,
          });
          return {
            prevNote,
            note,
            status: "update",
          };
        })
      );
    }
    return [];
  }
}
