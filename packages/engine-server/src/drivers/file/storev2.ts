import {
  assert,
  DendronError,
  DEngineDeleteSchemaRespV2,
  DEngineInitRespV2,
  DEngineInitSchemaRespV2,
  DLink,
  DNodeUtilsV2,
  DStoreV2,
  DVault,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ENGINE_ERROR_CODES,
  ERROR_CODES,
  NoteChangeEntry,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  RenameNoteOptsV2,
  RenameNotePayload,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaUtilsV2,
  StoreDeleteNoteResp,
  WriteNoteResp,
} from "@dendronhq/common-all";
import {
  DLogger,
  file2Note,
  getAllFiles,
  globMatch,
  note2File,
  schemaModuleProps2File,
  SchemaParserV2 as cSchemaParserV2,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import YAML from "yamljs";
import { ParserUtilsV2 } from "../../topics/markdown/utilsv2";

type BulkAddNoteOpts = {
  notes: NotePropsV2[];
};
type FileMetaV2 = {
  // file name: eg. foo.md, name = foo
  prefix: string;
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
type FileMetaDictV2 = { [key: string]: FileMetaV2[] };

function getFileMetaV2(fpaths: string[]): FileMetaDictV2 {
  const metaDict: FileMetaDictV2 = {};
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

export class ParserBaseV2 {
  constructor(public opts: { store: DStoreV2; logger: DLogger }) {}

  get logger() {
    return this.opts.logger;
  }
}

export class NoteParserV2 extends ParserBaseV2 {
  public cache: NotePropsCacheV2;

  constructor(
    public opts: { store: DStoreV2; cache: NotePropsCacheV2; logger: DLogger }
  ) {
    super(opts);
    this.cache = opts.cache;
  }

  async parseFile(fpath: string[], vault: DVault): Promise<NotePropsV2[]> {
    const ctx = "parseFile";
    const fileMetaDict: FileMetaDictV2 = getFileMetaV2(fpath);
    const maxLvl = _.max(_.keys(fileMetaDict).map((e) => _.toInteger(e))) || 2;
    const notesByFname: NotePropsDictV2 = {};
    const notesById: NotePropsDictV2 = {};
    this.logger.debug({ ctx, msg: "enter", fpath });

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND });
    }
    const rootFile = fileMetaDict[1].find(
      (n) => n.fpath === "root.md"
    ) as FileMetaV2;
    if (!rootFile) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND });
    }
    const rootNote = this.parseNoteProps({
      fileMeta: rootFile,
      addParent: false,
      vault,
    })[0];
    this.logger.debug({ ctx, rootNote, msg: "post-parse-rootNote" });

    notesByFname[rootNote.fname] = rootNote;
    notesById[rootNote.id] = rootNote;

    // get root of hiearchies
    let lvl = 2;
    let prevNodes: NotePropsV2[] = fileMetaDict[1]
      // don't count root node
      .filter((n) => n.fpath !== "root.md")
      .flatMap((ent) => {
        const notes = this.parseNoteProps({
          fileMeta: ent,
          addParent: false,
          vault,
        });
        return notes;
      });
    prevNodes.forEach((ent) => {
      DNodeUtilsV2.addChild(rootNote, ent);
      notesByFname[ent.fname] = ent;
      notesById[ent.id] = ent;
    });

    // get everything else
    while (lvl <= maxLvl) {
      const currNodes: NotePropsV2[] = (fileMetaDict[lvl] || [])
        .filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        })
        .flatMap((ent) => {
          const node = this.parseNoteProps({
            fileMeta: ent,
            parents: prevNodes,
            notesByFname,
            addParent: true,
            vault,
          });
          // need to be inside this loop
          // deal with `src/__tests__/enginev2.spec.ts`, with stubs/ test case
          node.forEach((ent) => {
            notesByFname[ent.fname] = ent;
            notesById[ent.id] = ent;
          });
          return node;
        });
      lvl += 1;
      prevNodes = currNodes;
    }

    // add schemas
    const out = _.values(notesByFname);
    const domains = rootNote.children.map(
      (ent) => notesById[ent]
    ) as NotePropsV2[];
    const schemas = this.opts.store.schemas;
    await Promise.all(
      domains.map(async (d) => {
        return SchemaUtilsV2.matchDomain(d, notesById, schemas);
      })
    );
    return out;
  }

  parseNoteProps(opts: {
    fileMeta: FileMetaV2;
    notesByFname?: NotePropsDictV2;
    parents?: NotePropsV2[];
    addParent: boolean;
    createStubs?: boolean;
    vault: DVault;
  }): NotePropsV2[] {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      createStubs: true,
      notesByFname: {},
      parents: [] as NotePropsV2[],
    });
    const { fileMeta, parents, notesByFname, vault } = cleanOpts;
    const ctx = "parseNoteProps";
    this.logger.debug({ ctx, msg: "enter", fileMeta });
    const wsRoot = this.opts.store.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    let out: NotePropsV2[] = [];
    let noteProps: NotePropsV2;

    // get note props
    try {
      noteProps = file2Note(path.join(vpath, fileMeta.fpath), vault);
    } catch (_err) {
      const err = {
        status: ENGINE_ERROR_CODES.BAD_PARSE_FOR_NOTE,
        msg: JSON.stringify({
          fname: fileMeta.fpath,
          error: _err.message,
        }),
      };
      this.logger.error({ ctx, fileMeta, err });
      throw new DendronError(err);
    }

    // add parent
    if (cleanOpts.addParent) {
      const stubs = NoteUtilsV2.addParent({
        note: noteProps,
        notesList: _.uniqBy(_.values(notesByFname).concat(parents), "id"),
        createStubs: cleanOpts.createStubs,
        wsRoot: this.opts.store.wsRoot,
      });
      out = out.concat(stubs);
    }
    out.push(noteProps);
    return out;
  }

  async parse(fpaths: string[], vault: DVault): Promise<NotePropsV2[]> {
    return this.parseFile(fpaths, vault);
  }
}

export class SchemaParserV2 extends ParserBaseV2 {
  parseFile(fpath: string, root: DVault): SchemaModulePropsV2 {
    const fname = path.basename(fpath, ".schema.yml");
    const wsRoot = this.opts.store.wsRoot;
    const vpath = vault2Path({ vault: root, wsRoot });
    const schemaOpts: any = YAML.parse(
      fs.readFileSync(path.join(vpath, fpath), "utf8")
    );
    return cSchemaParserV2.parseRaw(schemaOpts, { root, fname, wsRoot });
  }

  async parse(
    fpaths: string[],
    vault: DVault
  ): Promise<{
    schemas: SchemaModulePropsV2[];
    errors: DendronError[] | null;
  }> {
    const ctx = "parse";
    this.logger.info({ ctx, msg: "enter", fpaths, vault });

    const out = await Promise.all(
      fpaths.flatMap((fpath) => {
        try {
          return this.parseFile(fpath, vault);
        } catch (err) {
          return new DendronError({
            msg: ENGINE_ERROR_CODES.BAD_PARSE_FOR_SCHEMA,
            payload: { fpath },
          });
        }
      })
    );
    let errors = _.filter(
      out,
      (ent) => ent instanceof DendronError
    ) as DendronError[];
    return {
      schemas: _.reject(
        out,
        (ent) => ent instanceof DendronError
      ) as SchemaModulePropsV2[],
      errors: _.isEmpty(errors) ? null : errors,
    };
  }
}

type NotePropsCacheV2 = {};

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

export class FileStorageV2 implements DStoreV2 {
  public vaults: string[];
  public notes: NotePropsDictV2;
  public schemas: SchemaModuleDictV2;
  public notesCache: NotePropsCacheV2;
  public logger: DLogger;
  public links: DLink[];
  public vaultsv3: DVault[];
  public wsRoot: string;
  public configRoot: string;

  constructor(props: { wsRoot: string; logger: DLogger; vaultsv3: DVault[] }) {
    const { vaultsv3, logger, wsRoot } = props;
    this.wsRoot = wsRoot;
    this.configRoot = wsRoot;
    this.vaultsv3 = vaultsv3;
    this.vaults = vaultsv3.map((ent) => ent.fsPath);
    this.notes = {};
    this.schemas = {};
    this.notesCache = {};
    this.links = [];
    this.logger = logger;
    const ctx = "FileStorageV2";
    this.logger.info({ ctx, wsRoot, vaultsv3, level: this.logger.level });
  }

  async init(): Promise<DEngineInitRespV2> {
    try {
      let error: DendronError | null = null;
      const resp = await this.initSchema();
      if (!_.isNull(resp.error)) {
        error = new DendronError({
          code: ERROR_CODES.MINOR,
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

      // FIXME: for testing
      // const _notes = await fs.readJSON("/tmp/notes.json") as NotePropsDictV2;
      // this.notes = _notes;

      const { notes, schemas } = this;
      return { data: { notes, schemas }, error };
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
      throw new DendronError({ status: ENGINE_ERROR_CODES.CANT_DELETE_ROOT });
    }
    const noteToDelete = this.notes[id];
    const ext = ".md";
    const vault = noteToDelete.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    const fpath = path.join(vpath, noteToDelete.fname + ext);
    let out: NoteChangeEntry[] = [];
    this.logger.info({ ctx, noteToDelete, opts });

    // remove from fs
    if (!opts?.metaOnly) {
      this.logger.info({ ctx, noteToDelete, msg: "removing from disk", fpath });
      fs.unlinkSync(fpath);
    }

    // if have children, keep this node around as a stub
    if (!_.isEmpty(noteToDelete.children)) {
      this.logger.info({ ctx, noteToDelete, msg: "keep as stub" });
      noteToDelete.stub = true;
      this.updateNote(noteToDelete);
      out.push({ note: noteToDelete, status: "update" });
    } else {
      // no children, delete reference from parent
      this.logger.info({ ctx, noteToDelete, msg: "delete from parent" });
      if (!noteToDelete.parent) {
        throw new DendronError({
          status: ENGINE_ERROR_CODES.NO_PARENT_FOR_NOTE,
        });
      }
      // remove from parent
      let parentNote = this.notes[noteToDelete.parent] as NotePropsV2;
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
  ): Promise<DEngineDeleteSchemaRespV2> {
    const ctx = "deleteSchema";
    this.logger.info({ ctx, msg: "enter", id });
    if (id === "root") {
      throw new DendronError({ status: ENGINE_ERROR_CODES.CANT_DELETE_ROOT });
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

  loadNotesCache(): NotePropsCacheV2 {
    return {};
  }

  async initSchema(): Promise<DEngineInitSchemaRespV2> {
    const ctx = "initSchema";
    this.logger.info({ ctx, msg: "enter" });
    const out = await Promise.all(
      (this.vaultsv3 as DVault[]).map(async (vault) => {
        return this._initSchema(vault);
      })
    );
    const _out = _.reduce<
      { data: SchemaModulePropsV2[]; errors: any[] },
      { data: SchemaModulePropsV2[]; errors: any[] }
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
        : new DendronError({ msg: "multiple errors", payload: errors }),
    };
  }

  async _initSchema(
    vault: DVault
  ): Promise<{ data: SchemaModulePropsV2[]; errors: any[] }> {
    const ctx = "initSchema";
    this.logger.info({ ctx, msg: "enter" });
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    const schemaFiles = getAllFiles({
      root: vpath,
      include: ["*.schema.yml"],
    }) as string[];
    this.logger.info({ ctx, schemaFiles });
    if (_.isEmpty(schemaFiles)) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_SCHEMA_FOUND });
    }
    const { schemas, errors } = await new SchemaParserV2({
      store: this,
      logger: this.logger,
    }).parse(schemaFiles, vault);
    return {
      data: schemas,
      errors: _.isNull(errors) ? [] : errors,
    };
  }

  async initNotes(): Promise<NotePropsV2[]> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    let notesWithLinks: NotePropsV2[] = [];
    const out = await Promise.all(
      (this.vaultsv3 as DVault[]).map(async (vault) => {
        const notes = await this._initNotes(vault);
        notesWithLinks = notesWithLinks.concat(
          _.filter(notes, (n) => !_.isEmpty(n.links))
        );
        return notes;
      })
    );
    const allNotes = _.flatten(out);
    // await this._addBacklinks({ notesWithLinks, allNotes });
    return allNotes;
  }

  async _addBacklinks({
    notesWithLinks,
    allNotes,
  }: {
    notesWithLinks: NotePropsV2[];
    allNotes: NotePropsV2[];
  }) {
    return _.map(notesWithLinks, async (noteFrom) => {
      return Promise.all(
        noteFrom.links.map(async (link) => {
          const fname = link.to?.fname;
          if (fname) {
            const notes = NoteUtilsV2.getNotesByFname({
              fname,
              notes: allNotes,
            });
            return notes.map((noteTo) => {
              return NoteUtilsV2.addBacklink({
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

  async _initNotes(vault: DVault): Promise<NotePropsV2[]> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    const wsRoot = this.wsRoot;
    const vpath = vault2Path({ vault, wsRoot });
    const noteFiles = getAllFiles({
      root: vpath,
      include: ["*.md"],
    }) as string[];
    const cache = this.loadNotesCache();
    const notes = await new NoteParserV2({
      store: this,
      cache,
      logger: this.logger,
    }).parse(noteFiles, vault);
    await Promise.all(
      notes.map(async (n) => {
        if (n.stub) {
          return;
        }
        const links = ParserUtilsV2.findLinks({ note: n });
        n.links = links;
        return;
      })
    );
    return notes;
  }

  async bulkAddNotes(opts: BulkAddNoteOpts) {
    return Promise.all(
      opts.notes.map(async (note) => {
        await note2File({
          note,
          vault: note.vault,
          wsRoot: this.wsRoot,
        });
      })
    );
  }

  async renameNote(opts: RenameNoteOptsV2): Promise<RenameNotePayload> {
    const ctx = "Store:renameNote";
    const { oldLoc, newLoc } = opts;
    const { wsRoot } = this;
    this.logger.info({ ctx, msg: "enter", opts });
    const oldVault = oldLoc.vault;
    if (!oldVault) {
      throw new DendronError({ msg: "vault not set for loation" });
    }
    const vpath = vault2Path({ wsRoot, vault: oldVault });
    const oldLocPath = path.join(vpath, oldLoc.fname + ".md");
    // read from disk since contents migh have changed
    const noteRaw = file2Note(oldLocPath, oldVault);
    const oldNote = NoteUtilsV2.hydrate({
      noteRaw,
      noteHydrated: this.notes[noteRaw.id],
    });
    const notesToChange = await NoteUtilsV2.getNotesWithLinkTo({
      note: oldNote,
      notes: this.notes,
    });
    // update note body of all notes that have changed
    const notesChanged = await Promise.all(
      notesToChange.map(async (n) => {
        const vault = n.vault;
        const vaultPath = vault2Path({ vault, wsRoot });
        // read note in case its changed
        const _n = file2Note(path.join(vaultPath, n.fname + ".md"), vault);
        n.body = await ParserUtilsV2.replaceLinks({
          content: _n.body,
          from: oldLoc,
          to: newLoc,
        });

        return n;
      })
    );
    const newNote: NotePropsV2 = {
      ...oldNote,
      fname: newLoc.fname,
      vault: newLoc.vault!,
      title: NoteUtilsV2.isDefaultTitle(oldNote)
        ? NoteUtilsV2.genTitle(newLoc.fname)
        : oldNote.title,
    };

    // NOTE: order matters. need to delete old note, otherwise can't write new note
    const changedFromDelete = await this.deleteNote(oldNote.id, {
      metaOnly: true,
    });
    await this.writeNote(newNote, { newNode: true });
    // update all new notes
    await Promise.all(
      notesChanged.map(async (n) => this.writeNote(n, { updateExisting: true }))
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

  async updateNote(
    note: NotePropsV2,
    _opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    const ctx = "updateNote";
    const maybeNote = this.notes[note.id];
    if (maybeNote) {
      note = NoteUtilsV2.hydrate({ noteRaw: note, noteHydrated: maybeNote });
    }
    // TODO: remove
    this.logger.debug({ ctx, note });
    this.notes[note.id] = note;
    return;
  }

  async updateSchema(schemaModule: SchemaModulePropsV2) {
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
    note: NotePropsV2;
    maybeNote?: NotePropsV2;
    opts?: EngineWriteOptsV2;
  }): Promise<NotePropsV2[]> {
    let changed: NotePropsV2[] = [];
    // if note exists, remove from parent and transplant children
    if (maybeNote) {
      // update changed
      const parentNote = this.notes[maybeNote.parent as string] as NotePropsV2;

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
      changed = NoteUtilsV2.addParent({
        note,
        notesList: _.values(this.notes),
        createStubs: true,
        wsRoot: this.wsRoot,
      });
    }
    return changed;
  }

  async writeNote(
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const ctx = "FileStore:writeNote";
    let changed: NotePropsV2[] = [];
    this.logger.info({
      ctx,
      msg: "enter",
      opts,
      note: NoteUtilsV2.toLogObj(note),
    });
    const maybeNote = NoteUtilsV2.getNoteByFnameV4({
      fname: note.fname,
      notes: this.notes,
      vault: note.vault,
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
    const match = SchemaUtilsV2.matchPath({
      notePath: note.fname,
      schemaModDict: this.schemas,
    });
    // order matters - only write file after parents are established @see(_writeNewNote)
    await note2File({
      note,
      vault: note.vault,
      wsRoot: this.wsRoot,
      opts: { writeHierarchy: opts?.writeHierarchy },
    });

    if (match) {
      const { schema, schemaModule } = match;
      NoteUtilsV2.addSchema({ note, schema, schemaModule });
    }
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
    return {
      error: null,
      data: changedEntries,
    };
  }

  async writeSchema(schemaModule: SchemaModulePropsV2) {
    this.schemas[schemaModule.root.id] = schemaModule;
    const vault = schemaModule.vault;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    await schemaModuleProps2File(schemaModule, vpath, schemaModule.fname);
  }
}
