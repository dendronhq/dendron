import {
  CONSTANTS,
  DEngineClient,
  DVault,
  IDendronError,
  NoteChangeEntry,
  NoteUtils,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  TestPresetEntryV4,
  TestResult,
} from "@dendronhq/common-test-utils";
import {
  DendronEngineClient,
  NotesFileSystemCache,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { checkFileNoExpect } from "../../utils";

const findCreated = (changed: NoteChangeEntry[]) => {
  const created = _.find(changed, { status: "create" });
  return created;
};

const runRename = async ({
  engine,
  vaults,
  wsRoot,
  numChanges,
  cb,
  noNameChange,
}: {
  engine: DEngineClient;
  vaults: DVault[];
  wsRoot: string;
  numChanges?: number;
  cb: (opts: {
    barChange: NoteChangeEntry;
    allChanged: NoteChangeEntry[];
  }) => TestResult[];
  noNameChange?: boolean; // newLoc is oldLoc
}) => {
  const vault = vaults[0];
  const vaultName = VaultUtils.getName(vault);
  const oldLoc = { fname: "foo", vaultName };
  const newLoc = noNameChange ? oldLoc : { fname: "baz", vaultName };
  const changed = await engine.renameNote({
    oldLoc,
    newLoc,
  });

  const checkVaultMatch = noNameChange ? ["foo.md"] : ["baz.md"];
  const checkVaultNoMatch = noNameChange ? ["baz.md"] : ["foo.md"];

  const checkVault = await FileTestUtils.assertInVault({
    wsRoot,
    vault,
    match: checkVaultMatch,
    nomatch: checkVaultNoMatch,
  });
  const barChange = _.find(changed.data, (ent) => ent.note.fname === "bar")!;
  const out = cb({ barChange, allChanged: changed.data! });
  return out.concat([
    {
      actual: changed.data!.length,
      expected: numChanges || 6,
    },
    {
      actual: checkVault,
      expected: true,
    },
  ]);
};

const preSetupHook = async (
  { vaults, wsRoot }: WorkspaceOpts,
  { fooBody, barBody }: { fooBody?: string; barBody: string }
) => {
  const vault = vaults[0];
  await NOTE_PRESETS_V4.NOTE_SIMPLE.create({
    vault,
    wsRoot,
    body: fooBody || "",
  });
  await NOTE_PRESETS_V4.NOTE_SIMPLE_OTHER.create({
    vault,
    wsRoot,
    body: barBody,
  });
};

const NOTES = {
  NO_UPDATE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        numChanges: 1, // there should be no unnecessary updates added in resp
        cb: ({ barChange }) => {
          return [
            {
              actual: barChange,
              expected: undefined,
            },
          ];
        },
        noNameChange: true,
      });
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          wsRoot,
          vault: vaults[0],
        });
        await NoteTestUtilsV4.createNote({
          fname: "bar",
          wsRoot,
          vault: vaults[0],
          body: "[[foo]]",
        });
      },
    }
  ),
  NO_UPDATE_NUMBER_IN_FM: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        numChanges: 1, // no unecessary updates in resp
        cb: ({ barChange }) => {
          return [
            {
              actual: barChange,
              expected: undefined,
            },
          ];
        },
        noNameChange: true,
      });
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          wsRoot,
          vault: vaults[0],
        });
        await NoteTestUtilsV4.createNote({
          fname: "bar",
          wsRoot,
          vault: vaults[0],
          body: "[[foo]]",
          props: { title: "09" }, // testing for cases where frontmatter is read as number instead of string, which malforms the title
        });
      },
    }
  ),
  NO_UPDATE_DOUBLE_QUOTE_IN_FM: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        numChanges: 1,
        cb: ({ barChange }) => {
          return [
            {
              actual: barChange,
              expected: undefined,
            },
          ];
        },
        noNameChange: true,
      });
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          wsRoot,
          vault: vaults[0],
        });
        await NoteTestUtilsV4.createNote({
          fname: "bar",
          wsRoot,
          vault: vaults[0],
          body: "[[foo]]",
          props: { title: '"wow"' }, // testing for cases where double quotes are unnecessarily changed to single quotes
        });
      },
    }
  ),
  WITH_INLINE_CODE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        numChanges: 4,
        cb: ({ barChange }) => {
          return [
            {
              actual: barChange,
              expected: undefined,
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) => preSetupHook(opts, { barBody: "`[[foo]]`" }),
    }
  ),
  WITH_ALIAS: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "[[secret|baz]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) => preSetupHook(opts, { barBody: `[[secret|foo]]` }),
    }
  ),
  UPDATES_DEFAULT_ALIAS: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "[[Baz|baz]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) => preSetupHook(opts, { barBody: `[[Foo|foo]]` }),
    }
  ),
  MULTIPLE_LINKS: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        numChanges: 7, // extra update due to extra link
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "[[baz]] [[baz]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `[[foo]] [[foo]]` }),
    }
  ),
  XVAULT_LINK: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "[[dendron://vault1/baz#head1]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `[[dendron://vault1/foo#head1]]` }),
    }
  ),
  RELATIVE_LINK: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "[[baz#head1]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) => preSetupHook(opts, { barBody: `[[foo#head1]]` }),
    }
  ),
  NOTE_REF: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "![[baz]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) => preSetupHook(opts, { barBody: `![[foo]]` }),
    }
  ),
  NOTE_REF_WITH_HEADER: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "![[baz#header]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `![[foo#header]]` }),
    }
  ),
  NOTE_REF_WITH_ANCHOR: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "![[baz#^anchor-0-id-0]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `![[foo#^anchor-0-id-0]]` }),
    }
  ),
  NOTE_REF_WITH_RANGE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "![[baz#start:#end]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `![[foo#start:#end]]` }),
    }
  ),
  NOTE_REF_WITH_RANGE_WILDCARD_OFFSET: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "![[baz#start,1:#*]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `![[foo#start,1:#*]]` }),
    }
  ),
  NOTE_REF_WITH_RANGE_BLOCK_ANCHOR: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      return runRename({
        wsRoot,
        vaults,
        engine,
        cb: ({ barChange }) => {
          return [
            {
              actual: _.trim(barChange?.note.body),
              expected: "![[baz#^start:#^end]]",
            },
          ];
        },
      });
    },
    {
      preSetupHook: (opts) =>
        preSetupHook(opts, { barBody: `![[foo#^start:#^end]]` }),
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
  RENAME_FOR_CACHE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const beta = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const changed = await engine.renameNote({
        oldLoc: { fname: beta, vaultName: VaultUtils.getName(vault) },
        newLoc: { fname: "gamma", vaultName: VaultUtils.getName(vault) },
      });

      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${beta}.md`],
      });
      await engine.init();
      const cachePath = path.join(
        vault2Path({ wsRoot, vault }),
        CONSTANTS.DENDRON_CACHE_FILE
      );
      const notesCache = new NotesFileSystemCache({
        cachePath,
        logger: (engine as DendronEngineClient).logger,
      });
      const keySet = notesCache.getCacheEntryKeys();
      return [
        {
          actual: changed.data?.length,
          expected: 8,
        },
        {
          actual: _.trim(changed.data![1].note.body),
          expected: "[[gamma]]",
        },
        {
          actual: checkVault,
          expected: true,
        },
        {
          actual: keySet.size,
          expected: 3,
        },
        {
          actual: keySet.has("beta"),
          expected: false,
        },
        {
          actual: keySet.has("gamma"),
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
  DOMAIN_NO_CHILDREN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const beta = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const alphaBefore = await engine.getNoteMeta(
        NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname
      );
      const alphaBackLinksBefore = alphaBefore.data!.links.filter(
        (link) => link.type === "backlink"
      );
      const changed = await engine.renameNote({
        oldLoc: { fname: beta, vaultName: VaultUtils.getName(vault) },
        newLoc: { fname: "gamma", vaultName: VaultUtils.getName(vault) },
      });
      const alphaAfter = await engine.getNoteMeta(
        NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname
      );
      const alphaBackLinksAfter = alphaAfter.data!.links.filter(
        (link) => link.type === "backlink"
      );

      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${beta}.md`],
      });
      return [
        {
          actual: changed.data?.length,
          expected: 8,
        },
        {
          actual: _.trim(changed.data![1].note.body),
          expected: "[[gamma]]",
        },
        {
          actual: checkVault,
          expected: true,
        },
        {
          actual: alphaBackLinksBefore.length,
          expected: 1,
        },
        {
          actual: alphaBackLinksBefore[0].from.fname,
          expected: beta,
        },
        {
          actual: alphaBackLinksAfter.length,
          expected: 1,
        },
        {
          actual: alphaBackLinksAfter[0].from.fname,
          expected: "gamma",
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
  SINGLE_NOTE_DEEP_IN_DOMAIN: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const origName = "baz.one.two";
      const newName = "baz.one.three";
      const changed = await engine.renameNote({
        oldLoc: { fname: origName, vaultName: VaultUtils.getName(vault) },
        newLoc: { fname: newName, vaultName: VaultUtils.getName(vault) },
      });
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: [newName],
        nomatch: [origName],
      });
      return [
        {
          actual: changed.data?.length,
          expected: 8,
        },
        {
          actual: changed
            .data!.sort((a, b) => a.status.localeCompare(b.status))
            .map((ent) => [ent.note.fname, ent.status]),
          expected: [
            ["baz", "create"],
            ["baz.one", "create"],
            ["baz.one.three", "create"],
            ["baz.one", "delete"],
            ["baz", "delete"],
            ["baz.one.two", "delete"],
            ["root", "update"],
            ["root", "update"],
          ],
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
        await NoteTestUtilsV4.createNote({
          fname: "baz.one.two",
          vault,
          wsRoot,
          genRandomId: false,
          body: "baz body",
        });
      },
    }
  ),
  SCRATCH_NOTE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const vault = vaults[0];
      const alpha = "scratch.2020.02.03.0123";
      //const alpha = NOTE_PRESETS_V4.NOTE_WITH_LINK.fname;
      const notesInVaultBefore = await engine.findNotesMeta({ vault });
      const changed = await engine.renameNote({
        oldLoc: { fname: alpha, vaultName: VaultUtils.getName(vault) },
        newLoc: { fname: "gamma", vaultName: VaultUtils.getName(vault) },
      });
      const notesInVaultAfter = await engine.findNotesMeta({ vault });
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${alpha}.md`],
      });
      return [
        // alpha deleted, gamma created
        {
          actual: changed.data?.length,
          expected: 8,
        },
        // 6 notes in vault before
        {
          actual: _.size(notesInVaultBefore),
          expected: 6,
        },
        // 2 notes in vault after (gamma + root)
        {
          actual: _.size(notesInVaultAfter),
          expected: 2,
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
        oldLoc: { fname: fnameOld, vaultName: VaultUtils.getName(vault) },
        newLoc: { fname: "gamma", vaultName: VaultUtils.getName(vault) },
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
          expected: 8,
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
        oldLoc: { fname: fnameOld, vaultName: VaultUtils.getName(vault) },
        newLoc: { fname: "gamma", vaultName: VaultUtils.getName(vault) },
      });

      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault,
        match: ["gamma.md"],
        nomatch: [`${fnameOld}.md`],
      });
      const changedNote = (
        await engine.findNotes({
          fname: "root",
          vault,
        })
      )[0];
      return [
        {
          actual: changed.data?.length,
          expected: 6,
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
        oldLoc: {
          fname: fnameTarget,
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: fnameNew, vaultName: VaultUtils.getName(vaults[0]) },
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
            { status: "update", fname: "beta" },
            { status: "delete", fname: fnameTarget },
            { status: "update", fname: "root" },
            { status: "update", fname: "beta" },
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
  NOTE_REF_XVAULT: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const resp = await engine.renameNote({
        oldLoc: {
          fname: "foo",
          vaultName: VaultUtils.getName(vaults[1]),
        },
        newLoc: {
          fname: "baz",
          vaultName: VaultUtils.getName(vaults[1]),
        },
      });
      const changed = resp.data;
      const updated = _.map(changed, (ent) => ({
        status: ent.status,
        fname: ent.note.fname,
      })).sort();
      const checkVault = await FileTestUtils.assertInVault({
        vault: vaults[1],
        wsRoot,
        match: ["baz"],
        nomatch: ["foo"],
      });
      return [
        {
          actual: updated,
          expected: [
            { status: "update", fname: "foo" },
            { status: "update", fname: "bar" },
            { status: "update", fname: "root" },
            { status: "delete", fname: "foo" },
            { status: "update", fname: "root" },
            { status: "create", fname: "baz" },
          ],
        },
        {
          actual: _.trim(changed![1].note.body),
          expected: `![[dendron://${VaultUtils.getName(vaults[1])}/baz]]`,
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
          wsRoot,
          fname: "bar",
          vault: vaults[0],
          body: `![[dendron://${VaultUtils.getName(vaults[1])}/foo]]`,
        });
        await NoteTestUtilsV4.createNote({
          wsRoot,
          fname: "foo",
          vault: vaults[1],
          body: "Facilis repellat aliquam quas.",
        });
      },
    }
  ),
  NOTE_REF_XVAULT_VAULT_CHANGE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const resp = await engine.renameNote({
        oldLoc: {
          fname: "foo",
          vaultName: VaultUtils.getName(vaults[1]),
        },
        newLoc: {
          fname: "baz",
          vaultName: VaultUtils.getName(vaults[2]),
        },
      });
      const changed = resp.data;
      const updated = _.map(changed, (ent) => ({
        status: ent.status,
        fname: ent.note.fname,
      })).sort();
      const checkVault = await FileTestUtils.assertInVault({
        vault: vaults[2],
        wsRoot,
        match: ["baz"],
        nomatch: ["foo"],
      });

      return [
        {
          actual: updated,
          expected: [
            { status: "update", fname: "foo" },
            { status: "update", fname: "bar" },
            { status: "update", fname: "root" },
            { status: "delete", fname: "foo" },
            // this is a diff vault
            { status: "update", fname: "root" },
            { status: "create", fname: "baz" },
          ],
        },
        {
          actual: _.trim(changed![1].note.body),
          expected: `![[dendron://${VaultUtils.getName(vaults[2])}/baz]]`,
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
          wsRoot,
          fname: "bar",
          vault: vaults[0],
          body: `![[dendron://${VaultUtils.getName(vaults[1])}/foo]]`,
        });
        await NoteTestUtilsV4.createNote({
          wsRoot,
          fname: "foo",
          vault: vaults[1],
          body: "Facilis repellat aliquam quas.",
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
        oldLoc: {
          fname: fnameTarget,
          vaultName: VaultUtils.getName(vaults[1]),
        },
        newLoc: { fname: fnameNew, vaultName: VaultUtils.getName(vaults[1]) },
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
            { status: "update", fname: "alpha" },
            { status: "update", fname: "beta" },
            { status: "update", fname: "root" },
            { status: "update", fname: "beta" },
            { status: "delete", fname: "alpha" },
            { status: "update", fname: "root" },
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
        oldLoc: {
          fname: fnameTarget,
          vaultName: VaultUtils.getName(vaults[1]),
        },
        newLoc: { fname: fnameNew, vaultName: VaultUtils.getName(vaults[1]) },
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
            { status: "update", fname: "beta" },
            { status: "delete", fname: "alpha" },
            { status: "update", fname: "root" },
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
  NOTE_WITHOUT_ID: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      let error: IDendronError;
      try {
        const out = await engine.renameNote({
          oldLoc: {
            fname: "tag.foo",
            alias: "#foo",
            vaultName: VaultUtils.getName(vaults[0]),
          },
          newLoc: {
            fname: "tags.foo",
            vaultName: VaultUtils.getName(vaults[0]),
          },
        });
        error = out.error!;
      } catch (err: any) {
        // Need to check both `out.error` and caught error
        // since this runs in both API and engine tests
        error = err;
      }
      // Renaming a note without a frontmatter fails.
      // Make sure we fail gracefully.
      return [
        {
          actual: _.pick(error, "severity"),
          expected: { severity: "fatal" },
        },
        {
          actual: error?.message?.includes("Unable to rename"),
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        // Create an empty file without a frontmatter.
        await fs.writeFile(
          path.join(wsRoot, vaults[0].fsPath, "tag.foo.md"),
          ""
        );
      },
    }
  ),
  HASHTAG: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      await engine.renameNote({
        oldLoc: {
          fname: "tags.foo",
          alias: "#foo",
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: "tags.bar", vaultName: VaultUtils.getName(vaults[0]) },
      });
      const note = (
        await engine.findNotesMeta({
          fname: "primary",
          vault: vaults[0],
        })
      )[0];
      const containsTag = checkFileNoExpect({
        fpath: NoteUtils.getFullPath({ note: note!, wsRoot }),
        match: ["#bar"],
        nomatch: ["#foo"],
      });

      return [
        {
          actual: containsTag,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "primary",
          vault: vaults[0],
          wsRoot,
          body: "Lorem ipsum #foo dolor amet",
        });
      },
    }
  ),
  USERTAG: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      await engine.renameNote({
        oldLoc: {
          fname: "user.foo",
          alias: "@foo",
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: "user.bar", vaultName: VaultUtils.getName(vaults[0]) },
      });
      const note = (
        await engine.findNotesMeta({
          fname: "primary",
          vault: vaults[0],
        })
      )[0];
      const containsTag = checkFileNoExpect({
        fpath: NoteUtils.getFullPath({ note: note!, wsRoot }),
        match: ["@bar"],
        nomatch: ["@foo"],
      });

      return [
        {
          actual: containsTag,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "user.foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "primary",
          vault: vaults[0],
          wsRoot,
          body: "Lorem ipsum @foo dolor amet",
        });
      },
    }
  ),
  FRONTMATTER_TAG_SINGLE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      await engine.renameNote({
        oldLoc: {
          fname: "tags.foo",
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: "tags.bar", vaultName: VaultUtils.getName(vaults[0]) },
      });
      const note = (
        await engine.findNotesMeta({
          fname: "primary",
          vault: vaults[0],
        })
      )[0];
      const containsTag = checkFileNoExpect({
        fpath: NoteUtils.getFullPath({ note: note!, wsRoot }),
        match: ["tags: bar"],
        nomatch: ["tags: foo"],
      });

      return [
        {
          actual: note?.tags,
          expected: "bar",
        },
        {
          actual: containsTag,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "primary",
          vault: vaults[0],
          wsRoot,
          props: {
            tags: "foo",
          },
        });
      },
    }
  ),
  FRONTMATTER_TAG_MULTI: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      await engine.renameNote({
        oldLoc: {
          fname: "tags.foo",
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: "tags.bar", vaultName: VaultUtils.getName(vaults[0]) },
      });
      const note = (
        await engine.findNotesMeta({
          fname: "primary",
          vault: vaults[0],
        })
      )[0];
      const containsTag = checkFileNoExpect({
        fpath: NoteUtils.getFullPath({ note: note!, wsRoot }),
        match: ["bar"],
        nomatch: ["foo"],
      });

      return [
        {
          actual: note?.tags,
          expected: ["head", "bar", "tail"],
        },
        {
          actual: containsTag,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "primary",
          vault: vaults[0],
          wsRoot,
          props: {
            tags: ["head", "foo", "tail"],
          },
        });
      },
    }
  ),
  FRONTMATTER_TAG_SINGLE_REMOVE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      await engine.renameNote({
        oldLoc: {
          fname: "tags.foo",
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: "bar", vaultName: VaultUtils.getName(vaults[0]) },
      });
      const note = (
        await engine.findNotesMeta({
          fname: "primary",
          vault: vaults[0],
        })
      )[0];
      const containsTag = checkFileNoExpect({
        fpath: NoteUtils.getFullPath({ note: note!, wsRoot }),
        nomatch: [
          "tags: foo",
          "tags: bar",
          "tags: undefined",
          'tags: "undefined"',
        ],
      });

      return [
        {
          actual: note?.tags,
          expected: undefined,
        },
        {
          actual: containsTag,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "primary",
          vault: vaults[0],
          wsRoot,
          props: {
            tags: "foo",
          },
        });
      },
    }
  ),
  FRONTMATTER_TAG_MULTI_REMOVE: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      await engine.renameNote({
        oldLoc: {
          fname: "tags.foo",
          vaultName: VaultUtils.getName(vaults[0]),
        },
        newLoc: { fname: "bar", vaultName: VaultUtils.getName(vaults[0]) },
      });
      const note = (
        await engine.findNotesMeta({
          fname: "primary",
          vault: vaults[0],
        })
      )[0];
      const containsTag = checkFileNoExpect({
        fpath: NoteUtils.getFullPath({ note: note!, wsRoot }),
        nomatch: ["foo", "bar", "undefined"],
      });

      return [
        {
          actual: note?.tags,
          expected: ["head", "tail"],
        },
        {
          actual: containsTag,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "tags.foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "primary",
          vault: vaults[0],
          wsRoot,
          props: {
            tags: ["head", "foo", "tail"],
          },
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
  //     const alphaFname = NOTE_PRESETS_V4.NOTE_WITH_TARGET.fname;
  //     const noteOrig = (
  //      await engine.findNotes({
  //        fname: "alphaFname",
  //        vault,
  //      })
  //    )[0];
  //   let alphaNoteNew = NoteUtils.create({
  //     fname: "alpha",
  //     id: "alpha",
  //     created: 1
  //     updated: 1
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
  NOTE_WITH_STUB_CHILD: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const vaultName = VaultUtils.getName(vaults[0]);
      const out = await engine.renameNote({
        oldLoc: {
          fname: "foo",
          vaultName,
        },
        newLoc: {
          fname: "foo1",
          vaultName,
        },
      });

      const changedEntries: NoteChangeEntry[] | undefined = out.data;
      const fooStub = changedEntries?.find((entry) => {
        return entry.status === "create" && entry.note.fname === "foo";
      })?.note;
      const root = (
        await engine.findNotesMeta({
          fname: "root",
          vault: vaults[0],
        })
      )[0];
      const fooChild = (
        await engine.findNotesMeta({
          fname: "foo.bar",
          vault: vaults[0],
        })
      )[0];

      return [
        {
          actual: fooStub?.stub,
          expected: true,
        },
        {
          actual: (await engine.getNoteMeta("foo")).data!.fname,
          expected: "foo1",
        },
        {
          actual: changedEntries && changedEntries.length === 6,
          expected: true,
        },
        {
          // root's children is now the replacing stub and renamed note
          actual: root.children.length === 2,
          expected: true,
        },
        {
          // children's parent points to replaced stub
          actual: fooChild.parent,
          expected: fooStub?.id,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NoteTestUtilsV4.createNote({
          fname: "foo",
          vault: vaults[0],
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "foo.bar.baz",
          vault: vaults[0],
          wsRoot,
        });
      },
    }
  ),
};
export const ENGINE_RENAME_PRESETS = {
  // use the below to test a specific test
  //NOTES: {NOTE_REF: NOTES["NOTE_REF"]},
  NOTES,
  SCHEMAS: {},
};
