import { file2Note, tmpDir } from "@dendronhq/common-server";
import { NoteTestUtilsV4, runEngineTestV4 } from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import path from "path";
import { DoctorActions, DoctorCLICommand } from "../doctor";

describe("basic", () => {
  test("basic", async () => {
    await runEngineTestV4(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const cmd = new DoctorCLICommand();
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
