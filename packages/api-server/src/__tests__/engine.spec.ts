import { DendronAPI, NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import { NodeTestUtilsV2 } from "@dendronhq/common-test-utils";
import { EngineTestUtils, tmpDir } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";

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
    expect(wsRoot).toMatchSnapshot();
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
    expect(wsRoot).toMatchSnapshot();
  });

  test("write", async () => {
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
