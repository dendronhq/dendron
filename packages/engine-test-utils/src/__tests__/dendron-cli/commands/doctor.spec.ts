import { WorkspaceOpts } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import {
  DoctorActions,
  DoctorCLICommand,
  DoctorCLICommandOpts,
} from "@dendronhq/dendron-cli";
import path from "path";
import { createEngineFromServer, runEngineTestV5 } from "../../../engine";

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

const runDoctor = (opts: Omit<DoctorCLICommandOpts, "server">) => {
  const cmd = new DoctorCLICommand();
  return cmd.execute({
    exit: false,
    ...opts,
    server: {} as any,
  });
};

describe(DoctorActions.HI_TO_H2, () => {
  const action = DoctorActions.HI_TO_H2;

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
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
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });

  test("dry run", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
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
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});

describe("H1_TO_TITLE", () => {
  const action = DoctorActions.H1_TO_TITLE;
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, wsRoot, vaults }) => {
        const vault = vaults[0];
        await runDoctor({
          wsRoot,
          engine,
          action,
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
            expect(note.title).toEqual(`${nm} Header`);
          })
        );
      },
      {
        createEngine: createEngineFromServer,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});
