import {
  NotePropsV2,
  NoteUtilsV2,
  SchemaUtilsV2 as su,
} from "@dendronhq/common-all";
import { NodeTestUtilsV2 } from "@dendronhq/common-test-utils";
import {
  DendronAPI,
  EngineTestUtils,
  file2Schema,
  tmpDir,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import _ from "lodash";

describe("schema", () => {
  let wsRoot: string;
  let vault: string;

  beforeEach(async () => {
    wsRoot = tmpDir().name;
    vault = path.join(wsRoot, "vault");
    fs.ensureDirSync(vault);
    await EngineTestUtils.setupVault({
      vaultDir: vault,
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

  describe("write", () => {
    test("simple schema", async () => {
      const payload = {
        uri: wsRoot,
        config: {
          vaults: [vault],
        },
      };
      const api = new DendronAPI({
        endpoint: "http://localhost:3005",
        apiPath: "api",
      });
      const schema = su.createModuleProps({ fname: "pro" });
      await api.workspaceInit(payload);
      let resp: any = await api.workspaceList();
      resp = await api.schemaWrite({
        ws: wsRoot,
        schema,
      });
      const schemaPath = path.join(vault, "pro.schema.yml");
      const schemaOut = file2Schema(schemaPath);
      expect(
        fs.readFileSync(schemaPath, { encoding: "utf8" })
      ).toMatchSnapshot();
      expect(_.size(schemaOut.schemas)).toEqual(1);
    });
  });
});

describe("main", () => {
  let wsRoot: string;
  let vault: string;

  beforeEach(async () => {
    wsRoot = tmpDir().name;
    vault = path.join(wsRoot, "vault");
    fs.ensureDirSync(vault);
    await EngineTestUtils.setupVault({
      vaultDir: vault,
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

  test("query root", async () => {
    const payload = {
      uri: wsRoot,
      config: {
        vaults: [vault],
      },
    };
    const api = new DendronAPI({
      endpoint: "http://localhost:3005",
      apiPath: "api",
    });
    await api.workspaceInit(payload);
    const resp = await api.engineQuery({
      ws: wsRoot,
      queryString: "",
      mode: "note" as const,
    });
    expect(resp).toMatchSnapshot("root note");
    const schemas = await api.engineQuery({
      ws: wsRoot,
      queryString: "",
      mode: "schema" as const,
    });
    expect(schemas).toMatchSnapshot("root schema ");
  });

  test("query root note with schema", async () => {
    const payload = {
      uri: wsRoot,
      config: {
        vaults: [vault],
      },
    };
    const api = new DendronAPI({
      endpoint: "http://localhost:3005",
      apiPath: "api",
    });
    await api.workspaceInit(payload);
    const resp = await api.engineQuery({
      ws: wsRoot,
      queryString: "foo",
      mode: "note" as const,
    });
    const note = resp.data[0] as NotePropsV2;
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
        vaults: [vault],
      },
    };
    const api = new DendronAPI({
      endpoint: "http://localhost:3005",
      apiPath: "api",
    });
    await api.workspaceInit(payload);
    const resp = await api.engineQuery({
      ws: wsRoot,
      queryString: "foo.ch1",
      mode: "note" as const,
    });
    const note = resp.data[0] as NotePropsV2;
    expect(resp).toMatchSnapshot();
    expect(note.schema).toEqual({
      moduleId: "foo",
      schemaId: "ch1",
    });
  });

  test.skip("write", async () => {
    const payload = {
      uri: wsRoot,
      config: {
        vaults: [vault],
      },
    };
    const api = new DendronAPI({
      endpoint: "http://localhost:3005",
      apiPath: "api",
    });
    await api.workspaceInit(payload);
    const resp = await api.engineWrite({
      ws: wsRoot,
      node: NoteUtilsV2.create({ fname: "bond" }),
    });
    expect(resp).toMatchSnapshot();
    const out = fs.readdirSync(vault);
    expect(out).toEqual([
      "bond.md",
      "foo.ch1.md",
      "foo.md",
      "foo.schema.yml",
      "root.md",
      "root.schema.yml",
    ]);
  });
});
