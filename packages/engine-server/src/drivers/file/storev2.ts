import {
  DendronError,
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
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import YAML from "yamljs";
import { ParserUtilsV2 } from "../../topics/markdown/utilsv2";

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

  async parseFile(fpath: string[]): Promise<NotePropsV2[]> {
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
        const notes = this.parseNoteProps({ fileMeta: ent, addParent: false });
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
  }): NotePropsV2[] {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      createStubs: true,
      notesByFname: {},
      parents: [] as NotePropsV2[],
    });
    const { fileMeta, parents, notesByFname } = cleanOpts;
    const ctx = "parseNoteProps";
    this.logger.debug({ ctx, msg: "enter", fileMeta });
    const root = this.opts.store.vaults[0];
    let out: NotePropsV2[] = [];
    let noteProps: NotePropsV2;

    // get note props
    try {
      noteProps = file2Note(path.join(root, fileMeta.fpath));
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
        notesList: _.values(notesByFname).concat(parents),
        createStubs: cleanOpts.createStubs,
      });
      out = out.concat(stubs);
    }
    out.push(noteProps);
    return out;
  }

  async parse(fpaths: string[]): Promise<NotePropsV2[]> {
    return this.parseFile(fpaths);
  }
}

export class SchemaParserV2 extends ParserBaseV2 {
  static parseFile(fpath: string, root: string): SchemaModulePropsV2 {
    const fname = path.basename(fpath, ".schema.yml");
    const schemaOpts: any = YAML.parse(
      fs.readFileSync(path.join(root, fpath), "utf8")
    );
    return cSchemaParserV2.parseRaw(schemaOpts, { root, fname });
  }
  async parse(
    fpaths: string[],
    root: string
  ): Promise<{
    schemas: SchemaModulePropsV2[];
    errors: DendronError[] | null;
  }> {
    const ctx = "parse";
    this.logger.info({ ctx, msg: "enter", fpaths, root });
    const out = await Promise.all(
      fpaths.flatMap((fpath) => {
        try {
          return SchemaParserV2.parseFile(fpath, root);
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
  public vaultsv3?: DVault[];

  constructor(props: {
    vaults: string[];
    logger: DLogger;
    vaultsv3?: DVault[];
  }) {
    const { vaults, logger } = props;
    this.vaults = vaults;
    this.vaultsv3 = !_.isUndefined(props.vaultsv3)
      ? props.vaultsv3
      : this.vaults.map((ent) => ({ fsPath: ent }));
    this.notes = {};
    this.schemas = {};
    this.notesCache = {};
    this.links = [];
    this.logger = logger;
    const ctx = "FileStorageV2";
    this.logger.info({ ctx, vaults });
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
    const vault = this.vaults[0];
    const fpath = path.join(vault, noteToDelete.fname + ext);
    const out: NoteChangeEntry[] = [];
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
      this.logger.info({ ctx, noteToDelete, msg: "delete from parent" });
      if (!noteToDelete.parent) {
        throw new DendronError({
          status: ENGINE_ERROR_CODES.NO_PARENT_FOR_NOTE,
        });
      }
      // no more children, delete from parent
      const parentNote = this.notes[noteToDelete.parent] as NotePropsV2;
      parentNote.children = _.reject(
        parentNote.children,
        (ent) => ent === noteToDelete.id
      );
      delete this.notes[noteToDelete.id];
      out.push({ note: parentNote, status: "update" });
      out.push({ note: noteToDelete, status: "delete" });
    }
    return out;
  }

  async deleteSchema(id: string, opts?: EngineDeleteOptsV2) {
    const ctx = "deleteSchema";
    this.logger.info({ ctx, msg: "enter", id });
    if (id === "root") {
      throw new DendronError({ status: ENGINE_ERROR_CODES.CANT_DELETE_ROOT });
    }
    const noteToDelete = this.schemas[id];
    const ext = ".schema.yml";
    const vault = this.vaults[0];
    const fpath = path.join(vault, noteToDelete.fname + ext);

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
    const schemaFiles = getAllFiles({
      root: this.vaults[0],
      include: ["*.schema.yml"],
    }) as string[];
    this.logger.info({ ctx, schemaFiles });
    const root = this.vaults[0];
    if (_.isEmpty(schemaFiles)) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_SCHEMA_FOUND });
    }
    const { schemas, errors } = await new SchemaParserV2({
      store: this,
      logger: this.logger,
    }).parse(schemaFiles, root);
    return {
      data: schemas,
      error: _.isNull(errors)
        ? null
        : new DendronError({ msg: "multiple errors", payload: errors }),
    };
  }

  async initNotes(): Promise<NotePropsV2[]> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    const noteFiles = getAllFiles({
      root: this.vaults[0],
      include: ["*.md"],
    }) as string[];
    const cache = this.loadNotesCache();
    const notes = await new NoteParserV2({
      store: this,
      cache,
      logger: this.logger,
    }).parse(noteFiles);
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

  async renameNote(opts: RenameNoteOptsV2): Promise<RenameNotePayload> {
    const { oldLoc, newLoc } = opts;
    const vaultDir = this.vaults[0];
    // read from disk since contents migh have changed
    const oldNote = file2Note(path.join(vaultDir, oldLoc.fname + ".md"));
    const notesToChange = await NoteUtilsV2.getNotesWithLinkTo({
      note: oldNote,
      notes: this.notes,
    });
    const notesChanged = await Promise.all(
      notesToChange.map(async (n) => {
        const vaultDir = this.vaults[0];
        // read note in case its changed
        const _n = file2Note(path.join(vaultDir, n.fname + ".md"));
        n.body = await ParserUtilsV2.replaceLinks({
          content: _n.body,
          from: oldLoc,
          to: newLoc,
        });
        const links = ParserUtilsV2.findLinks({ note: n });
        n.links = links;
        return n;
      })
    );
    const newNote = { ...oldNote, fname: newLoc.fname };
    await this.deleteNote(oldNote.id);
    await this.writeNote(newNote, { newNode: true });
    await Promise.all(notesChanged.map(async (n) => this.writeNote(n)));
    let out: NoteChangeEntry[] = notesChanged.map((note) => ({
      status: "update" as const,
      note,
    }));
    out = out.concat([{ status: "delete" as const, note: oldNote }]);
    out = out.concat([{ status: "create" as const, note: newNote }]);
    return out;
  }

  async updateNote(
    note: NotePropsV2,
    _opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    this.notes[note.id] = note;
    return;
  }

  async updateSchema(schemaModule: SchemaModulePropsV2) {
    this.schemas[schemaModule.root.id] = schemaModule;
    // const vaultDir = this.vaults[0];
    // await schemaModuleProps2File(schemaModule, vaultDir, schemaModule.fname);
    // TODO: update notes
  }

  async writeNote(
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    let changed: NotePropsV2[] = [];
    if (!opts?.noAddParent) {
      changed = NoteUtilsV2.addParent({
        note,
        notesList: _.values(this.notes),
        createStubs: true,
      });
    }
    const match = SchemaUtilsV2.matchPath({
      notePath: note.fname,
      schemaModDict: this.schemas,
    });
    // order matters - only write file after parents are established
    await note2File(note, this.vaults[0], opts);
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
    return {
      error: null,
      data: changedEntries,
    };
  }

  async writeSchema(schemaModule: SchemaModulePropsV2) {
    this.schemas[schemaModule.root.id] = schemaModule;
    const vaultDir = this.vaults[0];
    await schemaModuleProps2File(schemaModule, vaultDir, schemaModule.fname);
  }
}
