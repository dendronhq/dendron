import {
  ERROR_STATUS,
  ERROR_SEVERITY,
  NoteProps,
  NoteUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  TestPresetEntryV4,
  SCHEMA_PRESETS_V4,
  NoteTestUtilsV4,
  FileTestUtils,
  NOTE_PRESETS_V4,
} from "@dendronhq/common-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
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
        {
          actual: schemas.sort(),
          expected: ["foo", "root"],
          msg: "bad schema not included",
        },
        { actual: initResp.error?.severity, expected: ERROR_SEVERITY.MINOR },
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
  BASIC: new TestPresetEntryV4(
    async ({ engine }) => {
      return [
        {
          actual: _.omit(engine.notes["one"], ["body", "parent"]),
          expected: {
            children: [],
            created: 1,
            custom: {},
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
                vault: {
                  fsPath: "vault1",
                },
              },
              original: "beta",
              pos: {
                end: 8,
                start: 0,
              },
              to: {
                anchorHeader: undefined,
                fname: "beta",
                vault: undefined,
              },
              type: "wiki",
              value: "beta",
            },
            {
              from: {
                fname: "beta",
                vault: {
                  fsPath: "vault1",
                },
              },
              original: "alpha",
              pos: {
                end: 12,
                start: 0,
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
        {
          actual: initResp.error?.status,
          expected: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
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
