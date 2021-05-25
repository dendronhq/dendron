import { DNoteAnchorPositioned } from "@dendronhq/common-all";
import {
  assert,
  BulkAddNoteOpts,
  DendronConfig,
  DendronError,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineInitResp,
  DEngineInitSchemaResp,
  DHookEntry,
  DLink,
  DStore,
  DVault,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ERROR_STATUS,
  ERROR_SEVERITY,
  NoteChangeEntry,
  NoteProps,
  NotePropsDict,
  NotesCache,
  NotesCacheAll,
  NotesCacheEntryMap,
  NoteUtils,
  RenameNoteOpts,
  RenameNotePayload,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaUtils,
  StoreDeleteNoteResp,
  VaultUtils,
  WriteNoteResp,
  stringifyError,
} from "@dendronhq/common-all";
import {
  DLogger,
  file2Note,
  getAllFiles,
  note2File,
  schemaModuleProps2File,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { MDUtilsV4 } from "../../markdown";
import { AnchorUtils, LinkUtils } from "../../markdown/remark/utils";
import { HookUtils, RequireHookResp } from "../../topics/hooks";
import { readNotesFromCache, writeNotesToCache } from "../../utils";
import { NoteParser } from "./noteParser";
import { SchemaParser } from "./schemaParser";

export type FileMeta = {
  // file name: eg. foo.md, name = foo
  prefix: string;
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
export type FileMetaDict = { [key: string]: FileMeta[] };

// type NoteEntryV2 = {
//   mtime: number;
//   size: number;
//   hash: number;
// };

// type MetaEntryV2 = {
//   links: any[];
//   embeds: any[];
//   tags: any[];
//   headings: any[];
// };

export class FileStorage implements DStore {
  public vaults: DVault[];
  public notes: NotePropsDict;
  public schemas: SchemaModuleDict;
  public notesCache: NotesCache;
  public logger: DLogger;
  public links: DLink[];
  public anchors: DNoteAnchorPositioned[];
  public wsRoot: string;
  public configRoot: string;
  public config: DendronConfig;
  private engine: DEngineClient;

  constructor(props: { engine: DEngineClient; logger: DLogger }) {
    const { vaults, wsRoot, config } = props.engine;
    const { logger } = props;
    this.wsRoot = wsRoot;
    this.configRoot = wsRoot;
    this.vaults = vaults;
    this.notes = {};
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
    try {
      let error: DendronError | null = null;
      const resp = await this.initSchema();
      if (!_.isNull(resp.error)) {
        error = DendronError.createPlainError({
          message: "schema malformed",
          severity: ERROR_SEVERITY.MINOR,
          payload: { schema: resp.error },
        });
      }
      resp.data.map((ent) => {
        this.schemas[ent.root.id] = ent;
      });
      const _notes = await this.initNotes();
      _notes.map((ent) => {
        this.notes[ent.id] = ent;
      });

      const { notes, schemas } = this;
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
    const ext = ".md";
    const vault = noteToDelete.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    const fpath = path.join(vpath, noteToDelete.fname + ext);
    let out: NoteChangeEntry[] = [];
    this.logger.info({ ctx, noteToDelete, opts });

    const noteAsLog = NoteUtils.toLogObj(noteToDelete);

    // remove from fs
    if (!opts?.metaOnly) {
      this.logger.info({ ctx, noteAsLog, msg: "removing from disk", fpath });
      fs.unlinkSync(fpath);
    }

    // if have children, keep this node around as a stub
    if (!_.isEmpty(noteToDelete.children)) {
      this.logger.info({ ctx, noteAsLog, msg: "keep as stub" });
      noteToDelete.stub = true;
      this.updateNote(noteToDelete);
      out.push({ note: noteToDelete, status: "update" });
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
      parentNote.children = _.reject(
        parentNote.children,
        (ent) => ent === noteToDelete.id
      );
      // delete from note dictionary
      delete this.notes[noteToDelete.id];
      // if parent note is not a stub, update it
      if (!parentNote.stub) {
        out.push({ note: parentNote, status: "update" });
      }
      out.push({ note: noteToDelete, status: "delete" });
      // check all stubs
      while (parentNote.stub && !opts?.noDeleteParentStub) {
        const newParent = parentNote.parent;
        const resp = await this.deleteNote(parentNote.id, {
          metaOnly: true,
          noDeleteParentStub: true,
        });
        if (newParent) {
          parentNote = this.notes[newParent];
        } else {
          assert(false, "illegal state in note delte");
        }
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
    return {
      data,
      error: _.isEmpty(errors)
        ? null
        : new DendronError({ message: "multiple errors", payload: errors }),
    };
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
      store: this,
      logger: this.logger,
    }).parse(schemaFiles, vault);
    return {
      data: schemas,
      errors: _.isNull(errors) ? [] : errors,
    };
  }

  async initNotes(): Promise<NoteProps[]> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    let notesWithLinks: NoteProps[] = [];
    const allNotesCache: NotesCacheAll = {};
    const out = await Promise.all(
      (this.vaults as DVault[]).map(async (vault) => {
        const { notes, cacheUpdates, cache } = await this._initNotes(vault);
        notesWithLinks = notesWithLinks.concat(
          _.filter(notes, (n) => !_.isEmpty(n.links))
        );
        allNotesCache[VaultUtils.getName(vault)] = {
          cache,
          cacheUpdates,
        };
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
    this._addBacklinks({ notesWithLinks, allNotes, allNotesCache });
    return allNotes;
  }

  async _addBacklinks({
    notesWithLinks,
    allNotes,
  }: {
    notesWithLinks: NoteProps[];
    allNotes: NoteProps[];
    allNotesCache: NotesCacheAll;
  }) {
    return _.map(notesWithLinks, async (noteFrom) => {
      return Promise.all(
        noteFrom.links.map(async (link) => {
          const fname = link.to?.fname;
          if (fname) {
            const notes = NoteUtils.getNotesByFname({
              fname,
              notes: allNotes,
            });
            return notes.map((noteTo) => {
              return NoteUtils.addBacklink({
                from: noteFrom,
                to: noteTo,
                link,
              });
            });
          }
          return;
        })
      );
    });
  }

  async _initNotes(vault: DVault): Promise<{
    notes: NoteProps[];
    cacheUpdates: NotesCacheEntryMap;
    cache: NotesCache;
  }> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    const wsRoot = this.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    const noteFiles = getAllFiles({
      root: vpath,
      include: ["*.md"],
    }) as string[];

    const cache: NotesCache = !this.engine.config.noCaching
      ? readNotesFromCache(vpath)
      : { version: 0, notes: {} };
    const { notes, cacheUpdates } = await new NoteParser({
      store: this,
      cache,
      logger: this.logger,
    }).parseFile(noteFiles, vault);
    await Promise.all(
      notes.map(async (n) => {
        if (n.stub) {
          return;
        }
        if (_.has(cacheUpdates, n.fname)) {
          const links = LinkUtils.findLinks({
            note: n,
            engine: this.engine,
          });
          const anchors = await AnchorUtils.findAnchors({
            note: n,
            wsRoot: wsRoot,
          });
          cacheUpdates[n.fname].data.links = links;
          cacheUpdates[n.fname].data.anchors = anchors;
          n.links = links;
          n.anchors = anchors;
        } else {
          n.links = cache.notes[n.fname].data.links;
        }
        return;
      })
    );
    return { notes, cacheUpdates, cache };
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

  async renameNote(opts: RenameNoteOpts): Promise<RenameNotePayload> {
    const ctx = "Store:renameNote";
    const { oldLoc, newLoc } = opts;
    const { wsRoot } = this;
    this.logger.info({ ctx, msg: "enter", opts });
    const oldVault = oldLoc.vault;
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
    const notesToChange = await NoteUtils.getNotesWithLinkTo({
      note: oldNote,
      notes: this.notes,
    });
    this.logger.info({
      ctx,
      msg: "notesToChange:gather",
      notes: notesToChange.map((n) => NoteUtils.toLogObj(n)),
    });
    // update note body of all notes that have changed
    const notesChanged = await Promise.all(
      notesToChange.map(async (n) => {
        const vault = n.vault;
        const vaultPath = vault2Path({ vault, wsRoot });
        // read note in case its changed
        const _n = file2Note(path.join(vaultPath, n.fname + ".md"), vault);
        const resp = await MDUtilsV4.procTransform(
          { engine: this.engine, fname: n.fname, vault: n.vault },
          { from: oldLoc, to: newLoc }
        ).process(_n.body);
        n.body = resp.contents as string;
        return n;
      })
    ).catch((err) => {
      this.logger.error({ err });
      throw new DendronError({ message: " error rename note", payload: err });
    });
    const newNote: NoteProps = {
      ...oldNote,
      fname: newLoc.fname,
      vault: newLoc.vault!,
      title: NoteUtils.isDefaultTitle(oldNote)
        ? NoteUtils.genTitle(newLoc.fname)
        : oldNote.title,
    };

    // NOTE: order matters. need to delete old note, otherwise can't write new note
    this.logger.info({
      ctx,
      msg: "deleteNote:meta:pre",
      note: NoteUtils.toLogObj(oldNote),
    });
    const changedFromDelete = await this.deleteNote(oldNote.id, {
      metaOnly: true,
    });
    this.logger.info({
      ctx,
      msg: "writeNewNote:pre",
      note: NoteUtils.toLogObj(newNote),
    });
    await this.writeNote(newNote, { newNode: true });
    this.logger.info({ ctx, msg: "updateAllNotes:pre" });
    // update all new notes
    await Promise.all(
      notesChanged.map(async (n) => {
        this.logger.info({
          ctx,
          msg: "writeNote:pre",
          note: NoteUtils.toLogObj(n),
        });
        return this.writeNote(n, { updateExisting: true });
      })
    );
    let out: NoteChangeEntry[] = notesChanged.map((note) => ({
      status: "update" as const,
      note,
    }));

    // remove old note only when rename is success
    fs.removeSync(oldLocPath);

    // create needs to be very last element added
    out = changedFromDelete
      .concat(out)
      .concat([{ status: "create" as const, note: newNote }]);
    this.logger.info({ ctx, msg: "exit", opts, out });
    return out;
  }

  async updateNote(note: NoteProps, opts?: EngineUpdateNodesOptsV2) {
    const ctx = "updateNote";
    const maybeNote = this.notes[note.id];
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
    return note;
  }

  async updateSchema(schemaModule: SchemaModuleProps) {
    this.schemas[schemaModule.root.id] = schemaModule;
    // const vaultDir = this.vaults[0];
    // await schemaModuleProps2File(schemaModule, vaultDir, schemaModule.fname);
    // TODO: update notes
  }

  async _writeNewNote({
    note,
    maybeNote,
    opts,
  }: {
    note: NoteProps;
    maybeNote?: NoteProps;
    opts?: EngineWriteOptsV2;
  }): Promise<NoteProps[]> {
    const ctx = "_writeNewNote";
    this.logger.info({
      ctx,
      msg: "enter",
      note: NoteUtils.toLogObj(note),
    });
    let changed: NoteProps[] = [];
    // if note exists, remove from parent and transplant children
    if (maybeNote) {
      // update changed
      const parentNote = this.notes[maybeNote.parent as string] as NoteProps;

      // remove existing note from parent's children
      parentNote.children = _.reject<string[]>(
        parentNote.children,
        (ent: string) => ent === maybeNote.id
      ) as string[];
      // update parent's children
      this.notes[maybeNote.parent as string].children = parentNote.children;
      // move maybeNote's children to newly written note
      note.children = maybeNote.children;
      // delete maybeNote
      delete this.notes[maybeNote.id];
    }
    // after we have deleted parent, add the current note as a parent
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
    let noDelete = false;
    if (maybeNote?.stub || opts?.updateExisting) {
      note = { ...maybeNote, ...note };
      noDelete = true;
    } else {
      changed = await this._writeNewNote({ note, maybeNote, opts });
    }

    // add schema if applicable
    const match = SchemaUtils.matchPath({
      notePath: note.fname,
      schemaModDict: this.schemas,
    });
    this.logger.info({
      ctx,
      msg: "pre:note2File",
    });

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
        return await HookUtils.requireHook({
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
    // order matters - only write file after parents are established @see(_writeNewNote)
    await note2File({
      note,
      vault: note.vault,
      wsRoot: this.wsRoot,
      opts: { writeHierarchy: opts?.writeHierarchy },
    });

    if (match) {
      this.logger.info({
        ctx,
        msg: "pre:addSchema",
      });
      const { schema, schemaModule } = match;
      NoteUtils.addSchema({ note, schema, schemaModule });
    }
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
