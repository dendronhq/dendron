import {
  ConfigUtils,
  ERROR_SEVERITY,
  ERROR_STATUS,
  NoteProps,
  NoteUtils,
  Position,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  FileTestUtils,
  NoteTestUtilsV4,
  NOTE_PRESETS_V4,
  SCHEMA_PRESETS_V4,
  TestPresetEntryV4,
  TestResult,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { TestConfigUtils } from "../../config";
import { ENGINE_HOOKS, setupBasic } from "./utils";

const SCHEMAS = {
  BASICS: new TestPresetEntryV4(
    async ({ engine }) => {
      const fname = SCHEMA_PRESETS_V4.SCHEMA_SIMPLE.fname;
      const schema = engine.schemas[fname];
      return [
        {
          actual: _.size(schema.schemas),
          expected: 2,
        },
      ];
    },
    {
      preSetupHook: setupBasic,
    }
  ),
  BAD_SCHEMA: new TestPresetEntryV4(
    async ({ engine, initResp }) => {
      const schemas = _.keys(engine.schemas);
      return [
        // Should have caught the bad schema
        {
          actual: schemas.sort(),
          expected: ["foo", "root"],
          msg: "bad schema not included",
        },
        { actual: initResp.error?.severity, expected: ERROR_SEVERITY.MINOR },
        // Should have still finished initializing
        { actual: _.size(initResp.data?.notes), expected: 6 },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        await setupBasic({ vaults, wsRoot });
        await SCHEMA_PRESETS_V4.BAD_SCHEMA.create({ vault, wsRoot });
      },
    }
  ),
};

const NOTES = {
  VAULT_WORKSPACE: new TestPresetEntryV4(
    async ({ wsRoot }) => {
      return [
        {
          actual: fs.existsSync(path.join(wsRoot, "vault1", "regnote.md")),
          expected: true,
          msg: "regular note exist",
        },
        {
          actual: fs.existsSync(
            path.join(wsRoot, "workspace", "vault", "wsnote.md")
          ),
          expected: true,
          msg: "wsnote exists",
        },
      ] as TestResult[];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        const normalVault = vaults[0];
        const wsVault = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "regnote",
          vault: normalVault,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "wsnote",
          vault: wsVault,
          wsRoot,
        });
      },
      vaults: [{ fsPath: "vault1" }],
      workspaces: [
        {
          name: "workspace",
          vaults: [{ fsPath: "vault" }],
          remote: {
            type: "git",
            url: "dummy",
          },
        },
      ],
    }
  ),
  VAULT_WORKSPACE_W_SAME_VAULT_NAME: new TestPresetEntryV4(
    async ({ wsRoot }) => {
      return [
        {
          actual: fs.existsSync(path.join(wsRoot, "vault1", "regnote.md")),
          expected: true,
          msg: "regular note exist",
        },
        {
          actual: fs.existsSync(
            path.join(wsRoot, "workspace", "vault1", "wsnote.md")
          ),
          expected: true,
          msg: "wsnote exists",
        },
      ] as TestResult[];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        const normalVault = vaults[0];
        const wsVault = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "regnote",
          vault: normalVault,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "wsnote",
          vault: wsVault,
          wsRoot,
        });
      },
      vaults: [{ fsPath: "vault1" }],
      workspaces: [
        {
          name: "workspace",
          vaults: [{ fsPath: "vault1" }],
          remote: {
            type: "git",
            url: "dummy",
          },
        },
      ],
    }
  ),
  BASIC: new TestPresetEntryV4(
    async ({ engine }) => {
      return [
        {
          actual: _.omit(engine.notes["one"], ["body", "parent"]),
          expected: {
            children: [],
            created: 1,
            custom: {},
            contentHash: "bfe07d1374685b973379679f442a165c",
            data: {},
            desc: "",
            fname: "one",
            id: "one",
            links: [],
            anchors: {},
            title: "One",
            type: "note",
            updated: 1,
            vault: {
              fsPath: "vault1",
              name: undefined,
            },
          },
        },
        {
          actual: _.omit(engine.notes["three"], ["body", "parent"]),
          expected: {
            children: [],
            created: 1,
            custom: {},
            contentHash: "e68fa106a0a73e579c44c25f362f1ae3",
            data: {},
            desc: "",
            fname: "three",
            id: "three",
            links: [],
            anchors: {},
            title: "Three",
            type: "note",
            updated: 1,
            vault: {
              fsPath: "vault3",
              name: "vaultThree",
            },
          },
        },
      ];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault3 = vaults[2];
        await NoteTestUtilsV4.createNote({
          fname: "one",
          vault: vault1,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "three",
          vault: vault3,
          wsRoot,
        });
      },
    }
  ),
  NOTE_TOO_LONG: new TestPresetEntryV4(
    async ({ engine }) => {
      const one = engine.notes["one"];
      const two = engine.notes["two"];
      return [
        // Links in one didn't get parsed since it's too long, but two did
        { actual: one.links.length, expected: 1 },
        { actual: one.links[0].type, expected: "backlink" },
        { actual: two.links.length, expected: 1 },
        // Anchors in one didn't get parsed since it's too long
        { actual: Object.entries(one.anchors).length, expected: 0 },
      ];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault3 = vaults[2];
        // Create a really large note with outgoing links and anchors
        await NoteTestUtilsV4.createNote({
          fname: "one",
          vault: vault1,
          wsRoot,
          body: "# head\n[[two]]\n".repeat(20000),
        });
        // The target note
        await NoteTestUtilsV4.createNote({
          fname: "two",
          vault: vault3,
          wsRoot,
          body: "[[one]]",
        });
      },
    }
  ),
  NOTE_TOO_LONG_CONFIG: new TestPresetEntryV4(
    async ({ engine }) => {
      const one = engine.notes["one"];
      const two = engine.notes["two"];
      return [
        // Links in one didn't get parsed since it's too long, but two did
        { actual: one.links.length, expected: 1 },
        { actual: one.links[0].type, expected: "backlink" },
        { actual: two.links.length, expected: 1 },
        // Anchors in one didn't get parsed since it's too long
        { actual: Object.entries(one.anchors).length, expected: 0 },
      ];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        TestConfigUtils.withConfig(
          (config) => {
            ConfigUtils.setWorkspaceProp(config, "maxNoteLength", 10);
            return config;
          },
          { wsRoot }
        );
        const vault1 = vaults[0];
        const vault3 = vaults[2];
        // Not really a super long note, but we set the max in config to even shorter
        await NoteTestUtilsV4.createNote({
          fname: "one",
          vault: vault1,
          wsRoot,
          body: "# head\n[[two]]\n".repeat(3),
        });
        // The target note
        await NoteTestUtilsV4.createNote({
          fname: "two",
          vault: vault3,
          wsRoot,
          body: "[[one]]",
        });
      },
    }
  ),
  MIXED_CASE_PARENT: new TestPresetEntryV4(
    async ({ engine }) => {
      const notes = engine.notes;
      return [
        {
          actual: _.size(notes),
          // 3 root, 1 foo, 1 foo.one, 1 foo.two
          expected: 6,
        },
      ];
    },
    {
      preSetupHook: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        await NoteTestUtilsV4.createNote({
          fname: "foo.one",
          vault,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "Foo.two",
          vault,
          wsRoot,
        });
      },
    }
  ),
  LINKS: new TestPresetEntryV4(
    async ({ engine, vaults }) => {
      const noteAlpha = NoteUtils.getNoteByFnameV5({
        fname: "alpha",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;
      return [
        {
          actual: noteAlpha.links,
          expected: [
            {
              alias: "beta",
              from: {
                fname: "alpha",
                id: "alpha",
                vaultName: "vault1",
              },
              position: {
                end: {
                  column: 9,
                  line: 1,
                  offset: 8,
                },
                indent: [],
                start: {
                  column: 1,
                  line: 1,
                  offset: 0,
                },
              } as Position,
              sameFile: false,
              to: {
                anchorHeader: undefined,
                fname: "beta",
                vaultName: undefined,
              },
              type: "wiki",
              value: "beta",
              xvault: false,
            },
            {
              alias: "alpha",
              from: {
                fname: "beta",
                vaultName: "vault1",
              },
              position: {
                end: {
                  column: 13,
                  line: 1,
                  offset: 12,
                },
                indent: [],
                start: {
                  column: 1,
                  line: 1,
                  offset: 0,
                },
              },
              type: "backlink",
              value: "alpha",
            },
          ],
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupLinks(opts);
      },
    }
  ),
  DOMAIN_STUB: new TestPresetEntryV4(
    async ({ wsRoot, vaults, engine }) => {
      const noteRoot = NoteUtils.getNoteByFnameV5({
        fname: "root",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;

      const noteChild = NoteUtils.getNoteByFnameV5({
        wsRoot: engine.wsRoot,
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
      }) as NoteProps;
      const checkVault = await FileTestUtils.assertInVault({
        wsRoot,
        vault: vaults[0],
        match: ["foo.ch1.md"],
        nomatch: ["foo.md"],
      });
      return [
        {
          actual: noteRoot.children,
          expected: [noteChild.id],
        },
        {
          actual: checkVault,
          expected: true,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_SIMPLE_CHILD.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    }
  ),
  NOTE_WITH_CUSTOM_ATT: new TestPresetEntryV4(
    async ({ vaults, engine }) => {
      const noteRoot = NoteUtils.getNoteByFnameV5({
        fname: "foo",
        notes: engine.notes,
        vault: vaults[0],
        wsRoot: engine.wsRoot,
      }) as NoteProps;

      return [
        {
          actual: noteRoot.fname,
          expected: "foo",
        },
        {
          actual: noteRoot.custom,
          expected: { bond: 42 },
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        await NOTE_PRESETS_V4.NOTE_WITH_CUSTOM_ATT.create({
          wsRoot,
          vault: vaults[0],
        });
      },
    }
  ),
  BAD_PARSE: new TestPresetEntryV4(
    async ({ initResp }) => {
      return [
        // should have caught the broken note
        {
          actual: initResp.error?.status,
          expected: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
        },
        // should have still parsed remaining notes
        {
          actual: _.size(initResp.data?.notes),
          expected: 3,
        },
      ];
    },
    {
      preSetupHook: async ({ vaults, wsRoot }) => {
        const vault = vaults[0];
        const vpath = vault2Path({ vault, wsRoot });
        fs.writeFileSync(path.join(vpath, "foo.md"), "---\nbar:\n--\nfoo");
      },
    }
  ),
};
export const ENGINE_INIT_PRESETS = {
  NOTES,
  SCHEMAS,
};
