import { NoteChangeEntry, NoteUtilsV2 } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { AssertUtils, NoteTestUtilsV4 } from "../..";
import { FileTestUtils } from "../../fileUtils";
import { TestPresetEntryV4 } from "../../utilsv2";
import { NOTE_BODY_PRESETS_V4, NOTE_PRESETS_V4 } from "../notes";

const findCreated = (changed: NoteChangeEntry[]) => {
  const created = _.find(changed, { status: "create" });
  return created;
};

const findByName = (
  fname: string,
  changed: NoteChangeEntry[]
): NoteChangeEntry => {
  const created = _.find(changed, (ent) => ent.note.fname === fname);
  if (!created) {
    throw Error("not found");
  }
  return created;
};

// const findUpdated = (changed: NoteChangeEntry[]) => {
//   const note = _.find(changed, { status: "update" });
//   return note;
// };

const NOTES = {
  NOTE_REF: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];

      const changed = await engine.renameNote({
        oldLoc: { fname: "foo", vault },
        newLoc: { fname: "baz", vault },
      });

      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["baz.md"],
        nomatch: ["foo.md"],
      });
      const barChange = _.find(changed.data, (ent) => ent.note.fname === "bar");
      return [
        {
          actual: changed.data?.length,
          expected: 4,
        },
        {
          actual: _.trim(barChange?.note.body),
          expected:
            "[[baz]]\n((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))",
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
          vault,
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
          vault,
          wsRoot,
          fname: "bar",
          body: `[[foo]]\n${NOTE_BODY_PRESETS_V4.NOTE_REF}`,
        });
      },
    }
  ),
  // TODO: doesn't work in extension test wright now
  // no way to stub diff vault
  // SAME_NAME_DIFF_VAULT: new TestPresetEntryV4(
  //   async ({ wsRoot, vaults, engine }) => {
  //     const [vault1, vault2] = vaults;
  //     const alpha = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
  //     const changed = await engine.renameNote({
  //       oldLoc: { fname: alpha, vault: vault1 },
  //       newLoc: { fname: alpha, vault: vault2 },
  //     });
  //     const checkVault = await FileTestUtils.assertInVault({
  //       wsRoot,
  //       vault: vault1,
  //       match: [],
  //       nomatch: [`${alpha}.md`],
  //     });
  //     return [
  //       {
  //         actual: changed.data?.length,
  //         expected: 3,
  //       },
  //       {
  //         actual: checkVault,
  //         expected: true,
  //       },
  //       {
  //         actual: await FileTestUtils.assertInVault({
  //           wsRoot,
  //           vault: vault2,
  //           match: [`${alpha}.md`],
  //           nomatch: [],
  //         }),
  //         expected: true,
  //       },
  //     ];
  //   },
  //   {
  //     preSetupHook: async ({ vaults, wsRoot }) => {
  //       const vault = vaults[0];
  //       await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
  //         vault,
  //         wsRoot,
  //       });
  //       await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
  //         vault,
  //         wsRoot,
  //       });
  //     },
  //   }
  // ),
  DOMAIN_NO_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const alpha = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const changed = await engine.renameNote({
        oldLoc: { fname: alpha, vault },
        newLoc: { fname: "gamma", vault },
      });

      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${alpha}.md`],
      });
      console.log(JSON.stringify(changed.data));

      return [
        {
          actual: changed.data?.length,
          expected: 4,
        },
        {
          actual: _.trim(findByName("alpha", changed.data!).note.body),
          expected: "[[gamma]]",
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault,
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          vault,
          wsRoot,
        });
      },
    }
  ),
  SCRATCH_NOTE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const alpha = "scratch.2020.02.03.0123";
      //const alpha = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const changed = await engine.renameNote({
        oldLoc: { fname: alpha, vault },
        newLoc: { fname: "gamma", vault },
      });
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${alpha}.md`],
      });
      const notes = engine.notes;
      return [
        // alpha deleted, gamma created
        {
          actual: changed.data?.length,
          expected: 7,
        },
        // 3 notes, gamma and 2 roots
        {
          actual: _.size(notes),
          expected: 3,
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "scratch.2020.02.03.0123",
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
  DOMAIN_DIFF_TITLE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const fnameOld = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
      const changed = await engine.renameNote({
        oldLoc: { fname: fnameOld, vault },
        newLoc: { fname: "gamma", vault },
      });

      const createdChange = findCreated(changed.data as NoteChangeEntry[]);
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${fnameOld}.md`],
      });
      return [
        {
          actual: changed.data?.length,
          expected: 4,
        },
        {
          actual: createdChange?.note.title,
          expected: "a title",
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault,
          wsRoot,
          props: { title: "a title" },
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          vault,
          wsRoot,
        });
      },
    }
  ),
  LINK_AT_ROOT: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const fnameOld = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
      const changed = await engine.renameNote({
        oldLoc: { fname: fnameOld, vault },
        newLoc: { fname: "gamma", vault },
      });

      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${fnameOld}.md`],
      });
      const changedNote = NoteUtilsV2.getNoteByFnameV4({
        fname: "root",
        notes: engine.notes,
        vault,
      });
      return [
        {
          actual: changed.data?.length,
          expected: 4,
        },
        {
          actual: await AssertUtils.assertInString({
            body: changedNote?.body as string,
            match: ["[[gamma]]"],
          }),
          expected: true,
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault,
          wsRoot,
        });
        const vpath = vault2Path({ vault, wsRoot });
        const root = path.join(vpath, "root.md");
        fs.appendFileSync(root, "[[alpha]]");
      },
    }
  ),
  TARGET_IN_VAULT1_AND_LINK_IN_VAULT2: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const fnameTarget = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
      const fnameNew = "gamma";
      const fnameLink = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const resp = await engine.renameNote({
        oldLoc: { fname: fnameTarget, vault: vaults[0] },
        newLoc: { fname: fnameNew, vault: vaults[0] },
      });
      const changed = resp.data;
      const updated = _.map(changed, (ent) => ({
        status: ent.status,
        fname: ent.note.fname,
      })).sort();
      const checkVault1 = await FileTestUtils.assertInVault({
        vault: vaults[0],
        wsRoot,
        match: [fnameNew],
        nomatch: [fnameTarget],
      });
      const checkVault2 = await FileTestUtils.assertInVault({
        vault: vaults[1],
        wsRoot,
        match: [fnameLink],
        nomatch: [fnameTarget, fnameNew],
      });

      return [
        {
          actual: updated,
          expected: [
            { status: "update", fname: "root" },
            { status: "delete", fname: fnameTarget },
            { status: "update", fname: fnameLink },
            { status: "create", fname: fnameNew },
          ],
        },
        {
          actual: checkVault1,
          expected: true,
        },
        {
          actual: checkVault2,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault: vaults[0],
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          vault: vaults[1],
          wsRoot,
        });
      },
    }
  ),
  TARGET_IN_VAULT2_AND_LINK_IN_VAULT2: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const fnameTarget = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
      const fnameNew = "gamma";
      const fnameLink = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const resp = await engine.renameNote({
        oldLoc: { fname: fnameTarget, vault: vaults[1] },
        newLoc: { fname: fnameNew, vault: vaults[1] },
      });
      const changed = resp.data;
      const updated = _.map(changed, (ent) => ({
        status: ent.status,
        fname: ent.note.fname,
      })).sort();
      const checkVault1 = await FileTestUtils.assertInVault({
        vault: vaults[0],
        wsRoot,
        nomatch: [fnameLink, fnameNew],
      });
      const checkVault2 = await FileTestUtils.assertInVault({
        vault: vaults[1],
        wsRoot,
        match: [fnameLink, fnameNew],
        nomatch: [fnameTarget],
      });
      return [
        {
          actual: updated,
          expected: [
            { status: "update", fname: "root" },
            { status: "delete", fname: "alpha" },
            { status: "update", fname: "beta" },
            { status: "create", fname: "gamma" },
          ],
        },
        {
          actual: checkVault1,
          expected: true,
        },
        {
          actual: checkVault2,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault: vaults[1],
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          vault: vaults[1],
          wsRoot,
        });
      },
    }
  ),
  TARGET_IN_VAULT2_AND_LINK_IN_VAULT1: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const fnameTarget = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
      const fnameNew = "gamma";
      const fnameLink = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const resp = await engine.renameNote({
        oldLoc: { fname: fnameTarget, vault: vaults[1] },
        newLoc: { fname: fnameNew, vault: vaults[1] },
      });
      const changed = resp.data;
      const updated = _.map(changed, (ent) => ({
        status: ent.status,
        fname: ent.note.fname,
      })).sort();
      const checkVault1 = await FileTestUtils.assertInVault({
        vault: vaults[0],
        wsRoot,
        match: [fnameLink],
      });
      const checkVault2 = await FileTestUtils.assertInVault({
        vault: vaults[1],
        wsRoot,
        match: [fnameNew],
        nomatch: [fnameTarget],
      });
      return [
        {
          actual: updated,
          expected: [
            { status: "update", fname: "root" },
            { status: "delete", fname: "alpha" },
            { status: "update", fname: "beta" },
            { status: "create", fname: "gamma" },
          ],
        },
        {
          actual: checkVault1,
          expected: true,
        },
        {
          actual: checkVault2,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
          vault: vaults[1],
          wsRoot,
        });
        await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
  // TODO: need a way of adding findlinks to this test
  /**
   * - pre:init
   *    - note A without body
   * - post:init
   *    - note A is updated with link to note B
   *    - note B is written
   *    - note B is re-written
   * - expect
   *    - note A should be updated
   */
  // DOMAIN_NO_CHILDREN_V3: new TestPresetEntryV4(
  //   async ({ vaults, engine }) => {
  //     const vault = vaults[0];
  //     const notes = engine.notes;
  //     const alphaFname = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
  //     const noteOrig = NoteUtilsV2.getNoteByFnameV4({fname: alphaFname, vault, notes});

  //   let alphaNoteNew = NoteUtilsV2.create({
  //     fname: "alpha",
  //     id: "alpha",
  //     created: "1",
  //     updated: "1",
  //     body: "[[beta]]",
  //     vault,
  //   });
  //   const links = ParserUtilsV2.findLinks({ note: alpha });
  //   alpha.links = links;
  //   await engine.updateNote(alphaNoteNew);

  //     // const changed = await engine.renameNote({
  //     //   oldLoc: { fname: alpha, vault },
  //     //   newLoc: { fname: "gamma", vault },
  //     // });

  //     // const checkVault = await FileTestUtils.assertInVault({
  //     //   wsRoot,
  //     //   vault,
  //     //   match: ["gamma.md"],
  //     //   nomatch: [`${alpha}.md`],
  //     // });
  //     return [
  //       {
  //         actual: _.trim(noteOrig?.body),
  //         expected: "",
  //       },
  //     ];
  //   },
  //   {
  //     preSetupHook: async ({ vaults, wsRoot }) => {
  //       const vault = vaults[0];
  //       await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
  //         vault,
  //         wsRoot,
  //         body: "",
  //       });
  //       await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
  //         vault,
  //         wsRoot,
  //       });
  //     },
  //   }
  // ),
  // TODO: currently , new nodes not picked up by refactor
  // DOMAIN_NO_CHILDREN_POST_INIT: new TestPresetEntryV4(
  //   async ({ wsRoot, vaults, engine }) => {
  //     const vault = vaults[0];
  //     const alphaNote = await NOTE_PRESETS_V4.NOTE_WITH_TARGET.create({
  //       vault,
  //       wsRoot,
  //       noWrite: true,
  //     });
  //     const betaNote = await NOTE_PRESETS_V4.NOTE_WITH_LINK.create({
  //       vault,
  //       wsRoot,
  //       noWrite: true,
  //     });
  //     await engine.writeNote(alphaNote);
  //     await engine.writeNote(betaNote);
  //     const alpha = alphaNote.fname;
  //     const changed = await engine.renameNote({
  //       oldLoc: { fname: alpha, vault },
  //       newLoc: { fname: "gamma", vault },
  //     });

  //     const checkVault = await FileTestUtils.assertInVault({
  //       wsRoot,
  //       vault,
  //       match: ["gamma.md"],
  //       nomatch: [`${alpha}.md`],
  //     });
  //     return [
  //       {
  //         actual: changed.data?.length,
  //         expected: 2,
  //       },
  //       {
  //         actual: _.trim((changed.data as NoteChangeEntry[])[0].note.body),
  //         expected: "[[gamma]]",
  //       },
  //       {
  //         actual: checkVault,
  //         expected: true,
  //       },
  //     ];
  //   }
  // ),
};
export const ENGINE_RENAME_PRESETS = {
  // use the below to test a sepcific test
  //NOTES: {NOTE_REF: NOTES["NOTE_REF"]},
  NOTES,
  SCHEMAS: {},
};
