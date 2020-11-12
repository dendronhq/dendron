import {
  DVault,
  NotePropsDictV2,
  NoteUtilsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { note2File } from "@dendronhq/common-server";
import _ from "lodash";
import { TestPresetEntry } from "../../utils";

const SCHEMAS = {
  INIT: {
    ROOT: new TestPresetEntry({
      label: "root",
      results: async ({
        schemas,
        vault,
      }: {
        schemas: SchemaModuleDictV2;
        vault: DVault;
      }) => {
        const schemaModRoot = schemas["root"] as SchemaModulePropsV2;
        return [
          {
            actual: _.trim(SchemaUtilsV2.serializeModuleProps(schemaModRoot)),
            expected: _.trim(`
version: 1
imports: []
schemas:
  - id: root
    children: []
    title: root
    parent: root
            `),
          },
          {
            actual: schemaModRoot.vault.fsPath,
            expected: vault.fsPath,
          },
        ];
      },
    }),
  },
};

const INIT = {
  WITH_STUBS: new TestPresetEntry({
    label: "with stubs",
    before: async ({ vault }: { vault: DVault }) => {
      const createNotes = ({ vault }: { vault: DVault }) => {
        const vaultPath = vault.fsPath;
        return Promise.all([
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.29", vault }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.30", vault }),
            vaultPath
          ),
          note2File(
            NoteUtilsV2.create({ fname: "foo.journal.2020.08.31", vault }),
            vaultPath
          ),
        ]);
      };
      await createNotes({ vault });
    },
    results: async ({
      notes,
      vault,
    }: {
      notes: NotePropsDictV2;
      vault: DVault;
    }) => {
      const stubNotes = _.filter(notes, { stub: true });
      return [
        {
          actual: _.size(stubNotes),
          expected: 3,
        },
        {
          actual: stubNotes[0].vault,
          expected: vault,
        },
      ];
    },
  }),
};

const ENGINE_SINGLE_TEST_PRESET = {
  INIT,
  SCHEMAS,
};

export default ENGINE_SINGLE_TEST_PRESET;
