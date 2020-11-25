import {
  DVault,
  NoteChangeEntry,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModulePropsV2,
  SchemaUtilsV2 as su,
} from "@dendronhq/common-all";
import {
  createLogger,
  DendronAPI,
  file2Schema,
  note2File,
  tmpDir,
} from "@dendronhq/common-server";
import {
  CreateEngineFunction,
  EngineTestUtilsV2,
  ENGINE_SERVER,
  INIT_TEST_PRESETS,
  NodeTestPresetsV2,
  NodeTestUtilsV2,
  NoteTestPresetsV2,
  RENAME_TEST_PRESETS,
  runEngineTestV4,
  SchemaTestPresetsV2,
} from "@dendronhq/common-test-utils";
import { DendronEngineClient, ParserUtilsV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runTest } from "./utils";

const { SCHEMAS } = ENGINE_SERVER.ENGINE_SINGLE_TEST_PRESET;

async function setupWS({ wsRoot, vault }: { wsRoot: string; vault: string }) {
  const payload = {
    uri: wsRoot,
    config: {
      vaults: [vault],
    },
  };
  const api = new DendronAPI({
    endpoint: "http://localhost:3005",
    apiPath: "api",
    logger: createLogger("api-server", "/tmp/api-server.log"),
  });
  await api.workspaceInit(payload);
  return api;
}

const getNotes = async ({
  api,
  wsRoot,
}: {
  api: DendronAPI;
  wsRoot: string;
}) => {
  const resp = await api.noteQuery({
    ws: wsRoot,
    qs: "*",
  });
  const notes: NotePropsDictV2 = {};
  _.forEach((resp.data as unknown) as NotePropsV2, (ent: NotePropsV2) => {
    notes[ent.id] = ent;
  });
  return notes;
};

describe("schema", () => {
  let wsRoot: string;
  let vaultString: string;

  beforeEach(async () => {
    wsRoot = tmpDir().name;
    vaultString = path.join(wsRoot, "vault");
    fs.ensureDirSync(vaultString);
    await EngineTestUtilsV2.setupVault({
      vaultDir: vaultString,
      initDirCb: async (vaultPath: string) => {
        await NodeTestUtilsV2.createNotes({ vaultPath });
        await NodeTestUtilsV2.createSchemas({ vaultPath });
        await NodeTestUtilsV2.createNoteProps({ vaultPath, rootName: "foo" });
        await NodeTestUtilsV2.createSchemaModuleOpts({
          vaultDir: vaultPath,
          rootName: "foo",
        });
      },
    });
  });

  describe("delete", () => {
    beforeEach(async () => {
      wsRoot = tmpDir().name;
      vaultString = path.join(wsRoot, "vault");
      fs.ensureDirSync(vaultString);
      await EngineTestUtilsV2.setupVault({
        vaultDir: vaultString,
        initDirCb: async (vaultPath: string) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("non-root", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      await api.schemaDelete({
        ws: wsRoot,
        id: "foo",
      });
      const schemaPath = path.join(vaultString, "foo.schema.yml");
      expect(fs.existsSync(schemaPath)).toBeFalsy();
    });
  });

  describe("init", () => {
    beforeEach(async () => {
      wsRoot = tmpDir().name;
      vaultString = path.join(wsRoot, "vault");
      fs.ensureDirSync(vaultString);
      await EngineTestUtilsV2.setupVault({
        vaultDir: vaultString,
        initDirCb: async (_vaultPath: string) => {
          return NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: _vaultPath,
          });
        },
      });
    });

    test(INIT_TEST_PRESETS.BAD_SCHEMA.label, async () => {
      const vaults = [vaultString];
      const vaultDir = vaultString;
      await INIT_TEST_PRESETS.BAD_SCHEMA.before({ vaultDir });
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      const engine = new EngineAPIShim({ api, wsRoot, vaults });
      const resp = await engine.init();
      const results = INIT_TEST_PRESETS.BAD_SCHEMA.results;
      await NodeTestPresetsV2.runJestHarness({
        opts: { engine, resp },
        results,
        expect,
      });
    });

    test("root", async () => {
      const vaults = [vaultString];
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      const engine = new EngineAPIShim({ api, wsRoot, vaults });
      const resp = await engine.init();
      const schemas = resp.data.schemas;
      await NodeTestPresetsV2.runJestHarness({
        opts: {
          schemas,
          vault: { fsPath: vaultString },
        },
        results: SCHEMAS.INIT.ROOT.results,
        expect,
      });
    });
  });

  describe("query", () => {
    beforeEach(async () => {
      wsRoot = tmpDir().name;
      vaultString = path.join(wsRoot, "vault");
      fs.ensureDirSync(vaultString);
      await EngineTestUtilsV2.setupVault({
        vaultDir: vaultString,
        initDirCb: async (vaultPath: string) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("root", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      const resp = await api.schemaQuery({
        ws: wsRoot,
        qs: "",
      });
      // expect(resp).toMatchSnapshot("root note");
      _.map(
        await SchemaTestPresetsV2.createQueryRootResults(
          resp.data as SchemaModulePropsV2[]
        ),
        (ent) => {
          const { actual, expected } = ent;
          expect(actual).toEqual(expected);
        }
      );
    });

    test("all", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      const resp = await api.schemaQuery({
        ws: wsRoot,
        qs: "*",
      });
      // expect(resp).toMatchSnapshot();
      _.map(
        await SchemaTestPresetsV2.createQueryAllResults(
          resp.data as SchemaModulePropsV2[]
        ),
        (ent) => {
          const { actual, expected } = ent;
          expect(actual).toEqual(expected);
        }
      );
    });

    test("non-root", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      const resp = await api.schemaQuery({
        ws: wsRoot,
        qs: "foo",
      });
      _.map(
        await SchemaTestPresetsV2.createQueryNonRootResults(
          resp.data as SchemaModulePropsV2[]
        ),
        (ent) => {
          const { actual, expected } = ent;
          expect(actual).toEqual(expected);
        }
      );
    });
  });

  describe("write", () => {
    test("simple schema", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      const schema = su.createModuleProps({
        fname: "pro",
        vault: { fsPath: "" },
      });
      await api.workspaceInit(payload);
      api.workspaceList();
      await api.schemaWrite({
        ws: wsRoot,
        schema,
      });
      const schemaPath = path.join(vaultString, "pro.schema.yml");
      const schemaOut = file2Schema(schemaPath);
      expect(
        fs.readFileSync(schemaPath, { encoding: "utf8" })
      ).toMatchSnapshot();
      expect(_.size(schemaOut.schemas)).toEqual(1);
    });
  });
});

const NOTE_DELETE_PRESET =
  NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.delete;
const NOTE_UPDATE_PRESET =
  NoteTestPresetsV2.presets.OneNoteOneSchemaPreset.update;

describe("notes", () => {
  let wsRoot: string;
  let vaultString: string;
  let vault: DVault;
  let api: DendronAPI;

  describe("getNoteByPath", async () => {
    test("get root", async () => {
      await runTest(async ({ api, vaults, wsRoot: ws }) => {
        const vault = vaults[0];
        const resp = await api.engineGetNoteByPath({
          npath: "root",
          vault,
          ws,
        });
        expect(resp).toMatchSnapshot();
        expect(resp.data?.changed).toEqual([]);
      });
    });
  });

  describe("query", () => {
    beforeEach(async () => {
      wsRoot = tmpDir().name;
      vaultString = path.join(wsRoot, "vault");
      fs.ensureDirSync(vaultString);
      await EngineTestUtilsV2.setupVault({
        vaultDir: vaultString,
        initDirCb: async (vaultPath: string) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
        },
      });
    });

    test("query root", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      const resp = await api.noteQuery({
        ws: wsRoot,
        qs: "",
      });
      expect(resp).toMatchSnapshot("root note");
    });

    // we aren't getting schema anymore
    test("query root note with schema", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      const resp = await api.noteQuery({
        ws: wsRoot,
        qs: "foo",
      });
      const note = (resp.data as NotePropsV2[])[0] as NotePropsV2;
      expect(resp).toMatchSnapshot();
      expect(note.schema).toEqual({
        moduleId: "foo",
        schemaId: "foo",
      });
    });

    test("query child note with schema", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vaultString],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      await api.workspaceInit(payload);
      const resp = await api.noteQuery({
        ws: wsRoot,
        qs: "foo.ch1",
      });
      const note = (resp.data as any[])[0] as NotePropsV2;
      expect(resp).toMatchSnapshot();
      expect(note.schema).toEqual({
        moduleId: "foo",
        schemaId: "ch1",
      });
    });
  });

  describe("rename/", () => {
    let engine: EngineAPIShim;

    beforeEach(async () => {
      wsRoot = tmpDir().name;
      vaultString = path.join(wsRoot, "vault");
      fs.ensureDirSync(vaultString);
      await EngineTestUtilsV2.setupVault({
        vaultDir: vaultString,
        initDirCb: async (vaultPath: string) => {
          await NodeTestPresetsV2.createOneNoteOneSchemaPreset({
            vaultDir: vaultPath,
          });
          let note = NoteUtilsV2.create({
            fname: "foo",
            id: "foo",
            created: "1",
            updated: "1",
            body: "[[bar]]",
            vault,
          });
          await note2File(note, vaultPath);
          note = NoteUtilsV2.create({
            fname: "bar",
            id: "bar",
            created: "1",
            updated: "1",
            body: "[[foo]]",
            vault,
          });
          await note2File(note, vaultPath);
        },
      });
      api = await setupWS({ wsRoot, vault: vaultString });
      engine = new EngineAPIShim({ api, wsRoot, vaults: [vaultString] });
    });

    test("basic", async () => {
      const vaultDir = vaultString;
      const changed = await api.engineRenameNote({
        ws: wsRoot,
        oldLoc: { fname: "foo", vault: { fsPath: vaultDir } },
        newLoc: { fname: "baz", vault: { fsPath: vaultDir } },
      });
      expect(changed).toMatchSnapshot();
      expect(_.trim((changed.data as NoteChangeEntry[])[0].note.body)).toEqual(
        "[[baz]]"
      );
      const notes = fs.readdirSync(vaultDir);
      expect(notes).toMatchSnapshot();
      expect(_.includes(notes, "foo.md")).toBeFalsy();
      expect(_.includes(notes, "baz.md")).toBeTruthy();
    });

    test(RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN.label, async () => {
      const vaultDir = vaultString;
      await RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN.before({ vaultDir });
      const resp = await api.engineRenameNote({
        ws: wsRoot,
        oldLoc: { fname: "bar", vault: { fsPath: vaultDir } },
        newLoc: { fname: "baz", vault: { fsPath: vaultDir } },
      });
      const changed = resp.data;
      await NodeTestPresetsV2.runJestHarness({
        opts: { changed, vaultDir } as Parameters<
          typeof RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN.results
        >[0],
        results: RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN.results,
        expect,
      });
    });

    test(RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.label, async () => {
      const vaultDir = vaultString;
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
      expect(changed).toMatchSnapshot("changed");
      await NodeTestPresetsV2.runJestHarness({
        opts: { changed, vaultDir } as Parameters<
          typeof RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.results
        >[0],
        results: RENAME_TEST_PRESETS.DOMAIN_NO_CHILDREN_V3.results,
        expect,
      });
    });
  });

  const createEngine: CreateEngineFunction = ({ wsRoot, vaults }) => {
    return DendronEngineClient.create({
      port: "3005",
      ws: wsRoot,
      vaults: vaults.map((ent) => ent.fsPath),
    });
  };

  describe("init", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_INIT_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });

  describe("delete", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_DELETE_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });

  describe.only("getNoteByPath/", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_GET_NOTE_BY_PATH_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });

  describe("update", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_UPDATE_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });

  describe("write", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_WRITE_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });
});
