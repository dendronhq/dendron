import { WorkspaceOpts } from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import {
  AssertUtils,
  NoteTestUtilsV4,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import path from "path";
import {
  DoctorActions,
  DoctorCLICommand,
  DoctorCLICommandOpts,
} from "../doctor";

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

const runDoctor = (opts: DoctorCLICommandOpts) => {
  const cmd = new DoctorCLICommand();
  return cmd.execute({
    exit: false,
    ...opts,
  });
};

// const setupNoFM= async (opts: WorkspaceOpts) => {
//   const { wsRoot, vaults } = opts;
//   const vpath = path.join(wsRoot, vaults[0].fsPath)

//   fs.writeFileSync( path.join(vpath, "foo.md"), "Foo Body", {encoding: "utf8"})
//   fs.writeFileSync( path.join(vpath, "bar.md"), "Bar Body", {encoding: "utf8"})
// };

describe(DoctorActions.HI_TO_H2, () => {
  const action = DoctorActions.HI_TO_H2;

  test("basic", async () => {
    await runEngineTestV4(
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
        createEngine,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});

describe("H1_TO_TITLE", () => {
  const action = DoctorActions.H1_TO_TITLE;
  test("basic", async () => {
    await runEngineTestV4(
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
        createEngine,
        expect,
        preSetupHook: setupBasic,
      }
    );
  });
});

// describe.only(DoctorActions.FIX_FM, () => {
//   const action = DoctorActions.FIX_FM;
//   test("basic", async () => {
//     await runEngineTestV4(
//       async ({ engine, wsRoot, vaults }) => {
//         const vault = vaults[0];
//         const cmd = new DoctorCLICommand();
//         await cmd.execute({
//           wsRoot,
//           engine,
//           action,
//         });
//         const names = ["Foo", "Bar"];
//         await Promise.all(
//           names.map(async (nm) => {
//             const fpath = path.join(
//               wsRoot,
//               vault.fsPath,
//               `${nm.toLowerCase()}.md`
//             );
//             const note = file2Note(fpath, vault);
//             expect(note).toMatchSnapshot();
//           })
//         );
//       },
//       {
//         createEngine,
//         expect,
//         preSetupHook: setupNoFM,
//       }
//     );
//   });
// });
