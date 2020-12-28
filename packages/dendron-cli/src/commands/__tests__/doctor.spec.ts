import { file2Note, note2File, tmpDir } from "@dendronhq/common-server";
import {
  ENGINE_HOOKS,
  NoteTestUtilsV4,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import { ConfigUtils } from "@dendronhq/engine-test-utils";
import path from "path";
import { BuildSiteCommandV2 } from "../build-site-v2";
import { DoctorActions, DoctorCommand } from "../doctor";

describe("basic", () => {
  let siteRootDir: string;
  beforeEach(async () => {
    siteRootDir = tmpDir().name;
  });

  test("basic", async () => {
    await runEngineTestV4(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const cmd = new DoctorCommand();
        await cmd.execute({
          wsRoot,
          engine,
          actions: [DoctorActions.H1_TO_TITLE],
        });
        const fpath = path.join(wsRoot, vault.fsPath, "foo.md");
        const note = file2Note(fpath, vault);
        expect(note).toMatchSnapshot();
      },
      {
        createEngine,
        expect,
        preSetupHook: async ({ wsRoot, vaults }) => {
          //const txt = `# Hello Heading\nHello Content`;
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "foo",
            body: [`# Foo Header`, `## Foo Content`].join("\n"),
          });
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: vaults[0],
            fname: "bar",
            body: [`# Bar Header`, `## Bar Content`].join("\n"),
          });
        },
      }
    );
  });
});
