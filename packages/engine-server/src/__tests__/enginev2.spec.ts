import {
  DendronError,
  DEngineV2,
  DVault,
  ENGINE_ERROR_CODES,
  NoteUtilsV2,
  SchemaUtilsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  createLogger,
  note2File,
  readYAML,
  schemaModuleOpts2File,
  SchemaParserV2 as cSchemaParserV2,
} from "@dendronhq/common-server";
import {
  AssertUtils,
  EngineTestUtilsV2,
  ENGINE_PRESETS,
  ENGINE_SERVER,
  INIT_TEST_PRESETS,
  NodeTestPresetsV2,
  NodeTestUtilsV2,
  NoteTestUtilsV3,
  RENAME_TEST_PRESETS,
  runEngineTest,
  runEngineTestV4,
  runJestHarness,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path, { toNamespacedPath } from "path";
import { DendronEngineV2 } from "../enginev2";
import { ParserUtilsV2 } from "../topics/markdown";

const { SCHEMAS, NOTES } = ENGINE_SERVER.ENGINE_SINGLE_TEST_PRESET;
const { ENGINE_UPDATE_PRESETS } = ENGINE_SERVER;
const { normalizeNote, normalizeNotes } = NodeTestUtilsV2;

const createEngine = ({ vaults, wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", "/tmp/engine-server.txt");
  const engine = DendronEngineV2.createV3({ vaults, wsRoot, logger });
  return engine;
};

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
  const wsRoot = "";
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
  const engine = DendronEngineV2.createV3({
    wsRoot,
    vaults: [{ fsPath: vaultDir }],
  });
  return { vaultDir, engine };
};

describe("engine, schema/", () => {
  let vaultDir: string;
  let engine: DEngineV2;
  let wsRoot = "";

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
      engine = DendronEngineV2.createV3({
        wsRoot,
        vaults: [{ fsPath: vaultDir }],
      });
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

describe.only("engine, schemas/", () => {
  const nodeType = "SCHEMAS";

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, notes/", () => {
  const nodeType = "NOTES";

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("note and schema", async () => {
  let vaultDir: string;
  let engine: DEngineV2;
  let wsRoot = "";

  beforeEach(async () => {
    vaultDir = await EngineTestUtilsV2.setupVault({
      initDirCb: async (dirPath: string) => {
        await NodeTestUtilsV2.createSchemas({ vaultPath: dirPath });
        await NodeTestUtilsV2.createNotes({ vaultPath: dirPath });
      },
    });
    engine = DendronEngineV2.createV3({
      wsRoot,
      vaults: [{ fsPath: vaultDir }],
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
      engine = DendronEngineV2.createV3({
        wsRoot,
        vaults: [{ fsPath: vaultDir }],
      });
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
