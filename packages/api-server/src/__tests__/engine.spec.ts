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

describe.only("notes", () => {
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

  describe("getNoteByPath/", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_GET_NOTE_BY_PATH_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });

  describe("query/", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_QUERY_PRESETS.NOTES, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
    });
  });

  describe("rename/", () => {
    test.each(
      _.map(ENGINE_SERVER.ENGINE_RENAME_PRESETS.NOTES, (v, k) => {
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

  describe.only("write", () => {
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
