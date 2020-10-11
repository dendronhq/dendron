import {
  DendronError,
  DEngineV2,
  DNodeUtilsV2,
  ENGINE_ERROR_CODES,
  NoteChangeEntry,
  NoteUtilsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  createLogger,
  note2File,
  readYAML,
  schemaModuleOpts2File,
  SchemaParserV2 as cSchemaParserV2,
} from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
  NodeTestUtilsV2,
  NoteTestPresetsV2,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { FileStorageV2 } from "../drivers/file/storev2";
import { DendronEngineV2 } from "../enginev2";

const _su = SchemaUtilsV2;

const createNotes = async (opts: { rootName: string; vaultDir: string }) => {
  const { rootName, vaultDir } = opts;
  const foo = NoteUtilsV2.create({
    fname: `${rootName}`,
    id: `${rootName}`,
    created: "1",
    updated: "1",
    children: ["ch1"],
  });
  const ch1 = NoteUtilsV2.create({
    fname: `${rootName}.ch1`,
    id: `${rootName}.ch1`,
    created: "1",
    updated: "1",
  });
  await note2File(foo, vaultDir);
  await note2File(ch1, vaultDir);
  return { foo, ch1 };
};

let LOGGER = createLogger("enginev2.spec", "/tmp/engine-server.log");

const beforePreset = async () => {
  const vaultDir = await EngineTestUtilsV2.setupVault({
    initDirCb: async (vaultPath: string) => {
      await NodeTestUtilsV2.createSchemas({ vaultPath });
      await NodeTestUtilsV2.createNotes({ vaultPath });
      await NodeTestUtilsV2.createNoteProps({ vaultPath, rootName: "foo" });
      await NodeTestUtilsV2.createSchemaModuleOpts({
        vaultDir: vaultPath,
        rootName: "foo",
      });
    },
  });
  const engine = new DendronEngineV2({
    vaults: [vaultDir],
    forceNew: true,
    store: new FileStorageV2({ vaults: [vaultDir], logger: LOGGER }),
    mode: "fuzzy",
    logger: LOGGER,
  });
  return { vaultDir, engine };
};

describe("engine, schema/", () => {
  let vaultDir: string;
  let engine: DEngineV2;

  describe("delete/", () => {
    let vaultDir: string;
    let engine: DEngineV2;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test("delete non-root", async () => {
      await engine.init();
      await engine.deleteSchema("foo");
      expect(engine.schemas).toMatchSnapshot();

      // node deleted from memory
      expect(_.values(engine.schemas).length).toEqual(1);
      expect(engine.schemas["foo"]).toBeUndefined();

      // node removed from disk
      expect(fs.readdirSync(vaultDir)).toMatchSnapshot();
      expect(
        _.includes(fs.readdirSync(vaultDir), "foo.schema.yml")
      ).toBeFalsy();

      // node not in index
      const index = (engine as DendronEngineV2).notesIndex;
      expect((index.getIndex().toJSON() as any).records.length).toEqual(3);
    });

    test("delete root", async () => {
      await engine.init();
      const { error } = await engine.deleteSchema("root");
      expect(error?.status).toEqual(ENGINE_ERROR_CODES.CANT_DELETE_ROOT);
    });
  });

  describe("write/", () => {
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test("update schema, add new prop to module", async () => {
      const { error } = await engine.init();
      expect(error).toBeNull();
      // update schema
      const module = engine.schemas["foo"];
      const moduleRoot = module.schemas[module.root.id];
      const ch2 = SchemaUtilsV2.create({
        fname: "foo",
        id: "ch2",
        created: "1",
        updated: "1",
      });
      DNodeUtilsV2.addChild(moduleRoot, ch2);
      module.schemas[ch2.id] = ch2;
      await engine.updateSchema(module);

      expect(_.values(engine.schemas).length).toEqual(2);
      expect(_.values(engine.schemas["foo"].schemas).length).toEqual(3);

      // query should have same results
      const resp = await engine.querySchema("*");
      expect(resp.data.length).toEqual(2);

      // should be written to file
      const data = readYAML(path.join(vaultDir, "foo.schema.yml"));
      expect(data).toMatchSnapshot("new schema file");
      expect(data.schemas.length).toEqual(3);
      // should have added new child
      expect(_.find(data.schemas, { id: "foo" }).children.length).toEqual(2);
    });

    test("write new module", async () => {
      await engine.init();

      // update schema
      const mOpts = await NodeTestUtilsV2.createSchemaModuleOpts({
        vaultDir,
        rootName: "bar",
      });
      const mProps = cSchemaParserV2.parseSchemaModuleOpts(mOpts, {
        fname: "bar",
        root: vaultDir,
      });
      await engine.writeSchema(mProps);

      expect(_.values(engine.schemas).length).toEqual(3);
      expect(_.values(engine.schemas["foo"].schemas).length).toEqual(2);
      expect(_.values(engine.schemas["bar"].schemas).length).toEqual(2);

      // should be written to file
      const data = readYAML(path.join(vaultDir, "bar.schema.yml"));
      expect(data.schemas.length).toEqual(2);
    });
  });

  describe("query/", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (vaultPath: string) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
      engine = new DendronEngineV2({
        vaults: [vaultDir],
        forceNew: true,
        store: new FileStorageV2({ vaults: [vaultDir], logger: LOGGER }),
        mode: "fuzzy",
        logger: LOGGER,
      });
    });

    test("root", async () => {
      await engine.init();
      const resp = await engine.querySchema("");
      // expect(resp).toMatchSnapshot();
      expect(_.size(resp.data[0].schemas)).toEqual(1);
    });

    test("all", async () => {
      await engine.init();
      const resp = await engine.querySchema("*");
      // expect(resp).toMatchSnapshot();
      expect(_.size(resp.data)).toEqual(2);
    });

    test("non-root", async () => {
      await engine.init();
      const resp = await engine.querySchema("foo");
      // expect(resp).toMatchSnapshot();
      expect(_.size(resp.data[0].schemas)).toEqual(2);
    });
  });

  describe("basics/", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      engine = new DendronEngineV2({
        vaults: [vaultDir],
        forceNew: true,
        store: new FileStorageV2({ vaults: [vaultDir], logger: LOGGER }),
        mode: "fuzzy",
        logger: LOGGER,
      });
    });

    test("no root", async () => {
      fs.removeSync(path.join(vaultDir, "root.schema.yml"));
      const { error } = (await engine.init()) as { error: DendronError };
      expect(error.status).toEqual(ENGINE_ERROR_CODES.NO_SCHEMA_FOUND);
    });

    test("root", async () => {
      const { data } = await engine.init();
      const schemaModRoot = (data?.schemas as SchemaModuleDictV2)[
        "root"
      ] as SchemaModulePropsV2;
      expect(_su.serializeModuleProps(schemaModRoot)).toMatchSnapshot();
    });

    test("root and one schem", async () => {
      await NodeTestUtilsV2.createSchemaModuleOpts({
        vaultDir,
        rootName: "foo",
      });
      await engine.init();
      expect(_.values(engine.schemas).length).toEqual(2);
      expect(_.values(engine.schemas["foo"].schemas).length).toEqual(2);
    });

    test.skip("delete schema", async () => {});
  });

  describe.skip("import", () => {
    let vaultDir: string;
    let engine: DEngineV2;

    describe("write/", () => {
      beforeEach(async () => {
        ({ vaultDir, engine } = await beforePreset());
        const sMO = SchemaUtilsV2.createModule({
          version: 1,
          schemas: [
            SchemaUtilsV2.create({
              fname: "bar",
              id: "bar",
              children: ["foo.foo"],
            }),
          ],
          imports: ["foo"],
        });
        await schemaModuleOpts2File(sMO, vaultDir, "bar");
      });

      test("basic", async () => {
        await engine.init();
        await engine.writeNote(NoteUtilsV2.create({ fname: "bar.foo" }));
        const resp = await engine.query("bar.foo", "note");
        const note = resp.data[0];
        expect(note.schema).toEqual({ moduleId: "bar", schemaId: "foo.foo" });
      });
    });
  });
});

describe("engine, notes/", () => {
  let vaultDir: string;
  let engine: DEngineV2;
  let logger = createLogger("enginev2.spec");

  describe("basic test v0/", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      engine = new DendronEngineV2({
        vaults: [vaultDir],
        forceNew: true,
        store: new FileStorageV2({ vaults: [vaultDir], logger }),
        mode: "fuzzy",
        logger,
      });
    });

    test("fetch node with custom att", async () => {
      await NodeTestUtilsV2.createNotes({
        vaultPath: vaultDir,
        noteProps: [
          {
            id: "foo",
            fname: "foo",
            custom: {
              bond: 42,
            },
          },
        ],
      });
      await engine.init();
      const resp = await engine.query("foo", "note");
      expect(resp.data[0].title).toEqual("Foo");
      expect(resp.data[0].custom).toEqual({ bond: 42 });
    });

    test("write node with custom att", async () => {
      await NodeTestUtilsV2.createNotes({
        vaultPath: vaultDir,
        noteProps: [
          {
            id: "foo",
            fname: "foo",
            custom: {
              bond: 42,
            },
          },
        ],
      });
      await engine.init();
      let resp = await engine.query("foo", "note");
      const note = resp.data[0];
      note.body = "custom body";
      await engine.writeNote(note);

      resp = await engine.query("foo", "note");
      expect(resp.data[0].title).toEqual("Foo");
      expect(resp.data[0].body).toEqual(note.body);
      expect(resp.data[0].custom).toEqual({ bond: 42 });
    });

    test("add custom att to node", async () => {
      await NodeTestUtilsV2.createNotes({
        vaultPath: vaultDir,
        noteProps: [
          {
            id: "foo",
            fname: "foo",
          },
        ],
      });
      await engine.init();
      let resp = await engine.query("foo", "note");
      const note = resp.data[0];
      note.custom = { bond: 43 };
      await engine.writeNote(note);
      resp = await engine.query("foo", "note");
      expect(resp.data[0].title).toEqual("Foo");
      expect(resp.data[0].custom).toEqual({ bond: 43 });
    });
  });

  const NOTE_INIT_PRESET =
    NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.init;

  describe("init/", () => {
    let vaultDir: string;
    let engine: DEngineV2;

    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test("with stubs/", async () => {
      const createNotes = (vaultPath: string) => {
        return Promise.all([
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.29" }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.30" }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.31" }),
            vaultPath
          ),
        ]);
      };
      await createNotes(vaultDir);
      await engine.init();
      const notes = engine.notes;
      expect(
        notes["foo"].children.map((id) => _.pick(notes[id], ["fname"])).sort()
      ).toEqual([{ fname: "foo.ch1" }, { fname: "foo.journal" }]);
    });

    test(NOTE_INIT_PRESET.domainStub.label, async () => {
      await NOTE_INIT_PRESET.domainStub.before({ vaultDir });
      await engine.init();
      const notes = engine.notes;
      await NodeTestPresetsV2.runJestHarness({
        opts: { notes },
        results: NOTE_INIT_PRESET.domainStub.results,
        expect,
      });
    });
  });

  const NOTE_DELETE_PRESET =
    NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.delete;

  describe("delete/", () => {
    let vaultDir: string;
    let engine: DEngineV2;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test("delete node w/ no children", async () => {
      await engine.init();
      const changed = await engine.deleteNote("foo.ch1");

      _.map(
        await NoteTestPresetsV2.createDeleteNoteWNoChildrenResults({
          changed: changed.data,
          notes: engine.notes,
          vaultDir,
        }),
        (ent) => {
          expect(ent.expected).toEqual(ent.actual);
        }
      );

      // note not in index
      const index = (engine as DendronEngineV2).notesIndex;
      expect((index.getIndex().toJSON() as any).records.length).toEqual(2);
    });

    test(NOTE_DELETE_PRESET.domainChildren.label, async () => {
      await engine.init();
      const resp = await engine.deleteNote("foo");
      const changed = resp.data as NoteChangeEntry[];
      const notes = engine.notes;
      _.map(
        await NOTE_DELETE_PRESET.domainChildren.results({
          changed,
          notes,
          vaultDir,
        }),
        (ent) => expect(ent.expected).toEqual(ent.actual)
      );
      const index = (engine as DendronEngineV2).notesIndex;
      expect((index.getIndex().toJSON() as any).records.length).toEqual(3);
    });

    test(NOTE_DELETE_PRESET.domainNoChildren.label, async () => {
      fs.removeSync(path.join(vaultDir, "foo.ch1.md"));
      await engine.init();
      const resp = await engine.deleteNote("foo");
      const changed = resp.data as NoteChangeEntry[];
      const notes = engine.notes;
      _.map(
        await NOTE_DELETE_PRESET.domainNoChildren.results({
          changed,
          notes,
          vaultDir,
        }),
        (ent) => expect(ent.expected).toEqual(ent.actual)
      );
    });

    test("root", async () => {
      await engine.init();
      const { error } = await engine.deleteNote("root");
      expect(error?.status).toEqual(ENGINE_ERROR_CODES.CANT_DELETE_ROOT);
    });
  });

  describe("getNoteByPath/", () => {
    let engine: DEngineV2;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test("get existing note", async () => {
      await engine.init();
      const { data } = await engine.getNoteByPath({ npath: "foo" });
      expect(data).toMatchSnapshot();
      expect(data?.note).toEqual(engine.notes["foo"]);
      expect(data?.changed).toEqual([]);
    });

    test("get new note", async () => {
      await engine.init();
      const { data } = await engine.getNoteByPath({
        npath: "bar",
        createIfNew: true,
      });
      expect(data).toMatchSnapshot();
      expect(data?.note?.fname).toEqual("bar");
      expect(
        _.sortBy(
          _.map(data?.changed, (ent) => ent.note),
          "id"
        )
      ).toEqual([data?.note, engine.notes["root"]]);
    });
  });

  const NOTE_WRITE_PRESET =
    NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.write;

  describe("write/", () => {
    let vaultDir: string;
    let engine: DEngineV2;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test(NOTE_WRITE_PRESET["domainStub"].label, async () => {
      await NOTE_WRITE_PRESET["domainStub"].before({ vaultDir });
      const results = NOTE_WRITE_PRESET["domainStub"].results;
      await engine.init();
      const notes = engine.notes;
      await NodeTestPresetsV2.runJestHarness({
        opts: { notes },
        results,
        expect,
      });
    });

    test("write note, no schema", async () => {
      await engine.init();
      const barNote = NoteUtilsV2.create({
        fname: "bar",
        id: "bar",
        created: "1",
        updated: "1",
      });
      await engine.writeNote(barNote);
      expect(engine.notes).toMatchSnapshot();
      const resp = await engine.query("bar", "note");
      const note = resp.data[0];
      expect(_.values(engine.notes).length).toEqual(4);
      expect(note).toEqual(engine.notes["bar"]);
      expect(note.schema).toBeUndefined();
      expect(fs.readdirSync(vaultDir)).toEqual([
        "bar.md",
        "foo.ch1.md",
        "foo.md",
        "foo.schema.yml",
        "root.md",
        "root.schema.yml",
      ]);
    });

    test("write note, match schema", async () => {
      fs.removeSync(path.join(vaultDir, "foo.ch1.md"));
      await engine.init();
      const noteNew = NoteUtilsV2.create({
        fname: "foo.ch1",
        id: "foo.ch1",
        created: "1",
        updated: "1",
      });
      await engine.writeNote(noteNew);
      expect(engine.notes).toMatchSnapshot("notes");
      expect(engine.notes["foo.ch1"].schema).toEqual({
        moduleId: "foo",
        schemaId: "ch1",
      });
    });
  });

  describe("update", () => {
    const PRESET = NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.update;

    let vaultDir: string;
    let engine: DEngineV2;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test(PRESET.noteNoChildren.label, async () => {
      await engine.init();
      const note = engine.notes["foo.ch1"];
      const cnote = _.clone(note);
      cnote.body = "new body";
      await engine.updateNote(cnote);
      const notes = engine.notes;
      _.map(
        await PRESET.noteNoChildren.results({
          notes,
          vaultDir,
        }),
        (ent) => expect(ent.expected).toEqual(ent.actual)
      );
    });
  });

  describe("basics", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      engine = new DendronEngineV2({
        vaults: [vaultDir],
        forceNew: true,
        store: new FileStorageV2({ vaults: [vaultDir], logger }),
        mode: "fuzzy",
        logger,
      });
    });

    test("no root", async () => {
      fs.removeSync(path.join(vaultDir, "root.md"));
      const { error } = (await engine.init()) as { error: DendronError };
      expect(error.status).toEqual(ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND);
    });

    test("root", async () => {
      const { data } = await engine.init();
      expect(data.notes).toMatchSnapshot();
    });

    test("bad parse ", async () => {
      fs.writeFileSync(path.join(vaultDir, "foo.md"), "---\nbar:\n--\nfoo");
      const { error } = (await engine.init()) as { error: DendronError };
      expect(JSON.stringify(error)).toMatchSnapshot();
      expect(error.status).toEqual(ENGINE_ERROR_CODES.BAD_PARSE_FOR_NOTE);
    });

    test("stub note", async () => {
      await note2File(NoteUtilsV2.create({ fname: "foo.ch1" }), vaultDir);
      await engine.init();
      expect(_.values(engine.notes).length).toEqual(3);
      const stubNote = NoteUtilsV2.getNoteByFname("foo", engine.notes);
      expect(_.pick(stubNote, ["stub"])).toEqual({ stub: true });
      const vaultFiles = fs.readdirSync(vaultDir);
      expect(vaultFiles).toMatchSnapshot();
      expect(vaultFiles.length).toEqual(3);
    });

    test("root and two notes", async () => {
      await createNotes({ rootName: "foo", vaultDir });
      await engine.init();
      expect(engine.notes).toMatchSnapshot();
      expect(_.values(engine.notes).length).toEqual(3);
    });
  });
});

describe("note and schema", async () => {
  let vaultDir: string;
  let engine: DEngineV2;

  beforeEach(async () => {
    vaultDir = await EngineTestUtilsV2.setupVault({
      initDirCb: async (dirPath: string) => {
        await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
        await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
      },
    });
    engine = new DendronEngineV2({
      vaults: [vaultDir],
      forceNew: true,
      store: new FileStorageV2({ vaults: [vaultDir], logger: LOGGER }),
      mode: "fuzzy",
      logger: LOGGER,
    });
  });

  describe("basics/", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      engine = new DendronEngineV2({
        vaults: [vaultDir],
        forceNew: true,
        store: new FileStorageV2({ vaults: [vaultDir], logger: LOGGER }),
        mode: "fuzzy",
        logger: LOGGER,
      });
    });

    test("root and two notes", async () => {
      await createNotes({ rootName: "foo", vaultDir });
      await NodeTestUtilsV2.createSchemaModuleOpts({
        vaultDir,
        rootName: "foo",
      });
      await engine.init();
      expect(engine.notes).toMatchSnapshot();
      expect(_.values(engine.notes).length).toEqual(3);
      expect(engine.notes["foo"].schema).toEqual({
        schemaId: "foo",
        moduleId: "foo",
      });
      expect(engine.notes["foo.ch1"].schema).toEqual({
        schemaId: "ch1",
        moduleId: "foo",
      });
    });
  });
});
