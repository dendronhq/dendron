import { WorkspaceOpts } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import path from "path";
import { DoctorActions, DoctorCLICommand } from "../doctor";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
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
};

describe("H1_TO_TITLE", () => {
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
        // const fpath = path.join(wsRoot, vault.fsPath, "foo.md");
        // const note = file2Note(fpath, vault);
        // expect(note).toMatchSnapshot();
        const names = ["Foo", "Bar"];
        await Promise.all(
          names.map(async (nm) => {
            const fpath = path.join(
              wsRoot,
              vault.fsPath,
              `${nm.toLowerCase()}.md`
            );
            const note = file2Note(fpath, vault);
            expect(note).toMatchSnapshot();
            expect(note.title).toEqual(`${nm} Header`);
          })
        );
      },
      {
        createEngine,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});

describe(DoctorActions.HI_TO_H2, () => {
  const action = DoctorActions.HI_TO_H2;

  test("basic", async () => {
    await runEngineTestV4(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const cmd = new DoctorCLICommand();
        await cmd.execute({
          wsRoot,
          engine,
          actions: [action],
        });
        const names = ["Foo", "Bar"];
        await Promise.all(
          names.map(async (nm) => {
            const fpath = path.join(
              wsRoot,
              vault.fsPath,
              `${nm.toLowerCase()}.md`
            );
            const note = file2Note(fpath, vault);
            expect(note).toMatchSnapshot();
            expect(
              await AssertUtils.assertInString({
                body: note.body,
                match: [`## ${nm} Header`],
              })
            ).toBeTruthy();
          })
        );
      },
      {
        createEngine,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });

  test("dry run", async () => {
    await runEngineTestV4(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        const cmd = new DoctorCLICommand();
        await cmd.execute({
          wsRoot,
          engine,
          actions: [action],
          dryRun: true,
        });
        const names = ["Foo", "Bar"];
        await Promise.all(
          names.map(async (nm) => {
            const fpath = path.join(
              wsRoot,
              vault.fsPath,
              `${nm.toLowerCase()}.md`
            );
            const note = file2Note(fpath, vault);
            expect(note).toMatchSnapshot();
            expect(
              await AssertUtils.assertInString({
                body: note.body,
                nomatch: [`## ${nm} Header`],
              })
            ).toBeTruthy();
          })
        );
      },
      {
        createEngine,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});
