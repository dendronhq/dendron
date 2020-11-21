import {
  DendronError,
  DEngineV2,
  DNodeUtilsV2,
  DVault,
  ENGINE_ERROR_CODES,
  NoteChangeEntry,
  NotePropsV2,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  note2File,
  readYAML,
  schemaModuleOpts2File,
  SchemaParserV2 as cSchemaParserV2,
} from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  ENGINE_SERVER,
  INIT_TEST_PRESETS,
  NodeTestPresetsV2,
  NodeTestUtilsV2,
  NoteTestPresetsV2,
  RENAME_TEST_PRESETS,
  runJestHarness,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DendronEngineV2 } from "../enginev2";
import { ParserUtilsV2 } from "../topics/markdown";

const { SCHEMAS, NOTES } = ENGINE_SERVER.ENGINE_SINGLE_TEST_PRESET;
const { normalizeNote, normalizeNotes } = NodeTestUtilsV2;

const createNotes = async (opts: { rootName: string; vaultDir: string }) => {
  const { rootName, vaultDir } = opts;
  const vault = { fsPath: vaultDir };
  const foo = NoteUtilsV2.create({
    fname: `${rootName}`,
    id: `${rootName}`,
    created: "1",
    updated: "1",
    children: ["ch1"],
    vault,
  });
  const ch1 = NoteUtilsV2.create({
    fname: `${rootName}.ch1`,
    id: `${rootName}.ch1`,
    created: "1",
    updated: "1",
    vault,
  });
  await note2File(foo, vaultDir);
  await note2File(ch1, vaultDir);
  return { foo, ch1 };
};

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
  const engine = DendronEngineV2.create({ vaults: [vaultDir] });
  return { vaultDir, engine };
};

describe("engine, schema/", () => {
  let vaultDir: string;
  let engine: DEngineV2;
  let wsRoot = "";

  describe("delete/", () => {
    let vaultDir: string;
    let engine: DEngineV2;
    let vault: DVault;

    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
      vault = { fsPath: vaultDir };
    });

    test("delete non-root", async () => {
      await engine.init();
      await engine.deleteSchema("foo");

      // node deleted from memory
      expect(_.values(engine.schemas).length).toEqual(1);
      expect(engine.schemas["foo"]).toBeUndefined();

      // node removed from disk
      expect(fs.readdirSync(vaultDir)).toMatchSnapshot();
      expect(
        _.includes(fs.readdirSync(vaultDir), "foo.schema.yml")
      ).toBeFalsy();

      // node not in index
      const index = (engine as DendronEngineV2).fuseEngine.notesIndex;
      expect((index.getIndex().toJSON() as any).records.length).toEqual(3);

      const resp = await engine.queryNotes({ qs: "foo", vault });
      expect(resp.data[0].schema).toBeUndefined();
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
      await engine.init();
      const vault = { fsPath: vaultDir };
      await SCHEMAS.WRITE.BASICS.postSetupHook({
        wsRoot,
        vaults: [vault],
        engine,
      });
      await runJestHarness(SCHEMAS.WRITE.BASICS.results, expect, { engine });
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
        root: { fsPath: vaultDir },
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
      engine = DendronEngineV2.create({ vaults: [vaultDir] });
    });

    test("root", async () => {
      await engine.init();
      const resp = await engine.querySchema("");
      expect(_.size(resp.data[0].schemas)).toEqual(1);
    });

    test("all", async () => {
      await engine.init();
      const resp = await engine.querySchema("*");
      expect(_.size(resp.data)).toEqual(2);
    });

    test("non-root", async () => {
      await engine.init();
      const resp = await engine.querySchema("foo");
      expect(_.size(resp.data[0].schemas)).toEqual(2);
    });
  });

  describe("basics/", () => {
    let vault: DVault;
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      vault = { fsPath: vaultDir };
      engine = DendronEngineV2.create({ vaults: [vaultDir] });
    });

    test("no root", async () => {
      fs.removeSync(path.join(vaultDir, "root.schema.yml"));
      const { error } = (await engine.init()) as { error: DendronError };
      expect(error.status).toEqual(ENGINE_ERROR_CODES.NO_SCHEMA_FOUND);
    });

    test("root", async () => {
      const { data } = await engine.init();
      await runJestHarness(SCHEMAS.INIT.ROOT.results, expect, {
        schemas: data.schemas,
        vault,
      });
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

    test("schema with no root node", async () => {
      await INIT_TEST_PRESETS.BAD_SCHEMA.before({ vaultDir });
      const resp = await engine.init();
      const results = INIT_TEST_PRESETS.BAD_SCHEMA.results;
      await NodeTestPresetsV2.runJestHarness({
        opts: { engine, resp },
        results,
        expect,
      });
    });
  });

  describe("import", () => {
    let vaultDir: string;
    let engine: DEngineV2;

    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          const vault = { fsPath: dirPath };
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });

          await NodeTestUtilsV2.createSchemaModuleOpts({
            vaultDir: dirPath,
            rootName: "bar",
          });

          let fname = "foo";
          const fooSchema = SchemaUtilsV2.create({
            fname,
            id: fname,
            parent: "root",
            created: "1",
            updated: "1",
            children: ["bar.bar", "baz.baz"],
            vault,
          });
          let module = SchemaUtilsV2.createModule({
            version: 1,
            schemas: [fooSchema],
            imports: ["bar", "baz"],
          });
          await schemaModuleOpts2File(module, dirPath, fname);

          fname = "baz";
          const bazSchema = SchemaUtilsV2.create({
            fname,
            id: fname,
            parent: "root",
            created: "1",
            updated: "1",
            children: ["bar.bar", "ns"],
            vault,
          });
          let childSchema = SchemaUtilsV2.create({
            id: "ns",
            namespace: true,
            vault,
          });
          module = SchemaUtilsV2.createModule({
            version: 1,
            schemas: [bazSchema, childSchema],
            imports: ["bar"],
          });
          await schemaModuleOpts2File(module, dirPath, fname);
        },
      });
      engine = DendronEngineV2.create({ vaults: [vaultDir] });
    });

    test("basic", async () => {
      const { error } = await engine.init();
      expect(error).toBe(null);
      expect(_.size(engine.schemas["foo"].schemas)).toEqual(7);
      expect(_.size(engine.schemas["bar"].schemas)).toEqual(2);
      expect(_.size(engine.schemas["baz"].schemas)).toEqual(4);
      const vault = { fsPath: vaultDir };
      await engine.writeNote(
        NoteUtilsV2.create({ id: "foo.bar", fname: "foo.bar", vault })
      );
      const note = engine.notes["foo.bar"];
      expect(note.schema).toEqual({
        moduleId: "foo",
        schemaId: "bar.bar",
      });
    });

    test("double import", async () => {
      const { error } = await engine.init();
      expect(error).toBe(null);
      const vault = { fsPath: vaultDir };
      await engine.writeNote(
        NoteUtilsV2.create({ id: "foo.baz.bar", fname: "foo.baz.bar", vault })
      );
      const note = engine.notes["foo.baz.bar"];
      expect(note.schema).toEqual({
        moduleId: "foo",
        schemaId: "baz.bar.bar",
      });
    });

    test("import and namespace", async () => {
      const { error } = await engine.init();
      expect(error).toBe(null);
      const vault = { fsPath: vaultDir };
      await engine.writeNote(
        NoteUtilsV2.create({
          id: "foo.baz.ns.one",
          fname: "foo.baz.ns.one",
          vault,
        })
      );
      const note = engine.notes["foo.baz.ns.one"];
      expect(note.schema).toEqual({
        moduleId: "foo",
        schemaId: "baz.ns",
      });
    });
  });
});

describe("engine, notes/", () => {
  let vaultDir: string;
  let engine: DEngineV2;
  let vault: DVault;

  describe("basic test v0/", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      vault = { fsPath: vaultDir };
      engine = DendronEngineV2.create({ vaults: [vaultDir] });
    });

    test("fetch node with custom att", async () => {
      const vault = { fsPath: vaultDir };
      await NodeTestUtilsV2.createNotes({
        vaultPath: vaultDir,
        noteProps: [
          {
            id: "foo",
            fname: "foo",
            custom: {
              bond: 42,
            },
            vault,
          },
        ],
      });
      await engine.init();
      const resp = await engine.queryNotes({ qs: "foo", vault });
      expect(resp.data[0].title).toEqual("Foo");
      expect(resp.data[0].custom).toEqual({ bond: 42 });
    });

    test("write node with custom att", async () => {
      const vault = { fsPath: vaultDir };
      await NodeTestUtilsV2.createNotes({
        vaultPath: vaultDir,
        noteProps: [
          {
            id: "foo",
            fname: "foo",
            custom: {
              bond: 42,
            },
            vault,
          },
        ],
      });
      await engine.init();
      let resp = await engine.queryNotes({ qs: "foo", vault });
      const note = resp.data[0];
      note.body = "custom body";
      await engine.writeNote(note);

      resp = await engine.queryNotes({ qs: "foo", vault });
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
            vault,
          },
        ],
      });
      await engine.init();
      let resp = await engine.queryNotes({ qs: "foo", vault });
      const note = resp.data[0];
      note.custom = { bond: 43 };
      await engine.writeNote(note);
      resp = await engine.queryNotes({ qs: "foo", vault });
      expect(resp.data[0].title).toEqual("Foo");
      expect(resp.data[0].custom).toEqual({ bond: 43 });
    });
  });

  const NOTE_INIT_PRESET =
    NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.init;

  const { WITH_BACKLINKS, WITH_BACKLINKS_V2 } = NOTES.INIT;

  describe("init/", () => {
    let vaultDir: string;
    let engine: DEngineV2;
    let vault: DVault;
    let wsRoot = "";

    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
      vault = { fsPath: vaultDir };
    });

    test.skip("with backlinks/", async () => {
      await WITH_BACKLINKS.preSetupHook({ wsRoot, vaults: [vault] });
      await engine.init();
      expect(engine.notes).toMatchSnapshot("bond");
      await runJestHarness(WITH_BACKLINKS.results, expect, {
        notes: engine.notes,
      });
    });

    test.skip(WITH_BACKLINKS_V2.label, async () => {
      await WITH_BACKLINKS_V2.preSetupHook({ wsRoot, vaults: [vault] });
      await engine.init();
      expect(engine.notes).toMatchSnapshot("bond");
      await runJestHarness(WITH_BACKLINKS_V2.results, expect, {
        notes: engine.notes,
      });
    });

    test("with stubs/", async () => {
      const createNotes = (vaultPath: string) => {
        return Promise.all([
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.29", vault }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.30", vault }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.31", vault }),
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
      const index = (engine as DendronEngineV2).fuseEngine.notesIndex;
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
      const index = (engine as DendronEngineV2).fuseEngine.notesIndex;
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
    let vault: DVault;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
      vault = { fsPath: vaultDir };
    });

    test("get root", async () => {
      await engine.init();
      const { data } = await engine.getNoteByPath({ npath: "root", vault });
      expect(data?.note).toEqual(_.find(engine.notes, DNodeUtilsV2.isRoot));
      expect(data?.changed).toEqual([]);
    });

    test("get existing note", async () => {
      await engine.init();
      const { data } = await engine.getNoteByPath({ npath: "foo", vault });
      expect(data?.note).toEqual(engine.notes["foo"]);
      expect(data?.changed).toEqual([]);
    });

    test("get existing note with caps", async () => {
      fs.writeFileSync(
        path.join(vaultDir, "000 Index.md"),
        `---\n
id: f95b2ebf-7cb5-47be-a8c0-def1236f0a8e
title: 000 index
desc: ''
updated: 1603892680423
created: 1603892680423
---

This is some content`,
        { encoding: "utf8" }
      );
      await engine.init();
      const { data } = await engine.getNoteByPath({
        npath: "000 Index",
        vault,
        createIfNew: true,
      });
      expect(
        normalizeNote({ note: data?.note as NotePropsV2 })
      ).toMatchSnapshot();
    });

    test("get new note", async () => {
      await engine.init();
      const { data } = await engine.getNoteByPath({
        npath: "bar",
        vault,
        createIfNew: true,
      });
      expect(data?.note?.fname).toEqual("bar");
      expect(
        _.sortBy(
          _.map(data?.changed, (ent) => ent.note),
          "fname"
        )
      ).toEqual([data?.note, NoteUtilsV2.getNoteByFname("root", engine.notes)]);
    });
  });

  describe("query/", () => {
    let engine: DEngineV2;
    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
    });

    test("empty string", async () => {
      await engine.init();
      const { data } = await engine.queryNotes({ qs: "", vault });
      expect(normalizeNotes(data)).toMatchSnapshot();
      expect(data[0]).toEqual(NoteUtilsV2.getNoteByFname("root", engine.notes));
    });

    test("*", async () => {
      await engine.init();
      const { data } = await engine.queryNotes({ qs: "*", vault });
      expect(normalizeNotes(data)).toMatchSnapshot();
      expect(data.length).toEqual(3);
    });

    test("foo", async () => {
      await engine.init();
      const { data } = await engine.queryNotes({ qs: "foo", vault });
      expect(normalizeNotes(data)).toMatchSnapshot();
      expect(data[0]).toEqual(engine.notes["foo"]);
    });
  });

  describe("rename/", () => {
    let engine: DEngineV2;
    let vault: DVault;

    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
      vault = { fsPath: vaultDir };
      let note = NoteUtilsV2.create({
        fname: "foo",
        id: "foo",
        created: "1",
        updated: "1",
        body: "[[bar]]",
        vault,
      });
      await note2File(note, vaultDir);
      note = NoteUtilsV2.create({
        fname: "bar",
        id: "bar",
        created: "1",
        updated: "1",
        body: "[[foo]]",
        vault,
      });
      await note2File(note, vaultDir);
    });

    test("with note ref", async () => {
      const note = NoteUtilsV2.create({
        fname: "bar",
        id: "bar",
        created: "1",
        updated: "1",
        body:
          "[[foo]]\n((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))",
        vault,
      });
      await note2File(note, vaultDir);

      await engine.init();
      const changed = await engine.renameNote({
        oldLoc: { fname: "foo", vault: { fsPath: vaultDir } },
        newLoc: { fname: "baz", vault: { fsPath: vaultDir } },
      });
      expect(changed.data?.length).toEqual(3);
      expect(_.trim((changed.data as NoteChangeEntry[])[0].note.body)).toEqual(
        "[[baz]]\n((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))"
      );
      const notes = fs.readdirSync(vaultDir);
      expect(notes).toMatchSnapshot();
      expect(_.includes(notes, "foo.md")).toBeFalsy();
      expect(_.includes(notes, "baz.md")).toBeTruthy();
      expect(
        fs
          .readFileSync(path.join(vaultDir, "bar.md"), { encoding: "utf8" })
          .indexOf("[[baz]]") >= 0
      ).toBeTruthy();
    });

    test(RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN.label, async () => {
      await engine.init();
      const resp = await engine.renameNote({
        oldLoc: { fname: "bar", vault: { fsPath: vaultDir } },
        newLoc: { fname: "baz", vault: { fsPath: vaultDir } },
      });
      const changed = resp.data;
      await runJestHarness(
        RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN.results,
        expect,
        { changed, vaultDir }
      );
    });

    // doesn't work yet
    test.skip(RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V2.label, async () => {
      await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V2.before({ vaultDir });
      await engine.init();
      const {
        alpha,
        beta,
      } = await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V2.after({ vaultDir });
      await engine.writeNote(alpha);
      await engine.writeNote(beta);
      const resp = await engine.renameNote({
        oldLoc: { fname: "beta", vault: { fsPath: vaultDir } },
        newLoc: { fname: "gamma", vault: { fsPath: vaultDir } },
      });
      const changed = resp.data;
      expect(changed).toMatchSnapshot("bond");
      await NodeTestPresetsV2.runJestHarness({
        opts: { changed, vaultDir } as Parameters<
          typeof RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V2.results
        >[0],
        results: RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V2.results,
        expect,
      });
    });

    test(RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.label, async () => {
      await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.before({ vaultDir });
      await engine.init();
      const {
        alpha,
        beta,
      } = await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.after({
        vaultDir,
        findLinks: ParserUtilsV2.findLinks,
      });
      await engine.updateNote(alpha);
      await engine.writeNote(beta);
      const resp = await engine.renameNote({
        oldLoc: { fname: "beta", vault: { fsPath: vaultDir } },
        newLoc: { fname: "gamma", vault: { fsPath: vaultDir } },
      });
      const changed = resp.data;
      await NodeTestPresetsV2.runJestHarness({
        opts: { changed, vaultDir } as Parameters<
          typeof RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.results
        >[0],
        results: RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.results,
        expect,
      });
    });

    test(RENAME_TEST_PRESETS.DOMAIN_DIFF_TITLE.label, async () => {
      let wsRoot = "";
      const vaults = [{ fsPath: vaultDir }];
      await RENAME_TEST_PRESETS.DOMAIN_DIFF_TITLE.preSetupHook({
        vaults,
        wsRoot,
      });
      await engine.init();
      const resp = await RENAME_TEST_PRESETS.DOMAIN_DIFF_TITLE.postSetupHook({
        vaults,
        wsRoot,
        engine,
      });
      await runJestHarness(
        RENAME_TEST_PRESETS.DOMAIN_DIFF_TITLE.results,
        expect,
        { changed: resp.data }
      );
    });
  });

  const NOTE_WRITE_PRESET =
    NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.write;

  describe("write/", () => {
    let vaultDir: string;
    let engine: DEngineV2;
    let vault: DVault;

    beforeEach(async () => {
      ({ vaultDir, engine } = await beforePreset());
      vault = { fsPath: vaultDir };
    });

    test(NOTE_WRITE_PRESET["domainStub"].label, async () => {
      await NoteTestPresetsV2.createJestTest({
        entry: NOTE_WRITE_PRESET["domainStub"],
        beforeArgs: { vaultDir },
        executeCb: async () => {
          await engine.init();
          const notes = engine.notes;
          return { notes };
        },
        expect,
      });
    });

    test(NOTE_WRITE_PRESET["serializeChildWithHierarchy"].label, async () => {
      await NoteTestPresetsV2.createJestTest({
        entry: NOTE_WRITE_PRESET["serializeChildWithHierarchy"],
        beforeArgs: { vaultDir },
        executeCb: async () => {
          await engine.init();
          const noteNew = NoteUtilsV2.create({
            fname: "foo.ch1",
            id: "foo.ch1",
            created: "1",
            updated: "1",
            vault,
          });
          await engine.writeNote(noteNew, { writeHierarchy: true });
          return { vaultDir };
        },
        expect,
      });
    });

    test("write note, no schema, new domain", async () => {
      await engine.init();
      const barNote = NoteUtilsV2.create({
        fname: "bar",
        id: "bar",
        created: "1",
        updated: "1",
        vault,
      });
      await engine.writeNote(barNote);
      expect(normalizeNotes(engine.notes)).toMatchSnapshot();
      const resp = await engine.queryNotes({ qs: "bar", vault });
      const note = resp.data[0];
      expect(_.values(engine.notes).length).toEqual(4);
      expect(note).toEqual(engine.notes["bar"]);
      // parent is added
      const noteParent = engine.notes[note.parent as string] as NotePropsV2;
      expect(noteParent.fname).toEqual("root");
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
        vault,
      });
      await engine.writeNote(noteNew);
      expect(normalizeNotes(engine.notes)).toMatchSnapshot("notes");
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
    let vault: DVault;

    beforeEach(async () => {
      vault = { fsPath: vaultDir };
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      engine = DendronEngineV2.create({ vaults: [vaultDir] });
    });

    test("no root", async () => {
      fs.removeSync(path.join(vaultDir, "root.md"));
      const { error } = (await engine.init()) as { error: DendronError };
      expect(error.status).toEqual(ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND);
    });

    test("root", async () => {
      const { data } = await engine.init();
      expect(normalizeNotes(data.notes)).toMatchSnapshot();
    });

    test("bad parse ", async () => {
      fs.writeFileSync(path.join(vaultDir, "foo.md"), "---\nbar:\n--\nfoo");
      const { error } = (await engine.init()) as { error: DendronError };
      expect(error.status).toEqual(ENGINE_ERROR_CODES.BAD_PARSE_FOR_NOTE);
    });

    test("stub note", async () => {
      await note2File(
        NoteUtilsV2.create({ fname: "foo.ch1", vault }),
        vaultDir
      );
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
      expect(normalizeNotes(engine.notes)).toMatchSnapshot();
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
    engine = DendronEngineV2.create({ vaults: [vaultDir] });
  });

  describe("basics/", () => {
    beforeEach(async () => {
      vaultDir = await EngineTestUtilsV2.setupVault({
        initDirCb: async (dirPath: string) => {
          await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
          await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
        },
      });
      engine = DendronEngineV2.create({ vaults: [vaultDir] });
    });

    test("root and two notes", async () => {
      await createNotes({ rootName: "foo", vaultDir });
      await NodeTestUtilsV2.createSchemaModuleOpts({
        vaultDir,
        rootName: "foo",
      });
      await engine.init();
      expect(normalizeNotes(engine.notes)).toMatchSnapshot();
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
