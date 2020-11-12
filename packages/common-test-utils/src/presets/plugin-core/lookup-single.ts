import { DVault, NotePropsV2 } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { TestPresetEntry } from "../../utils";

const UPDATE_ITEMS = {
  SCHEMA_SUGGESTION: new TestPresetEntry({
    label: "schema suggestion",
    before: async ({ vault }: { vault: DVault }) => {
      fs.removeSync(path.join(vault.fsPath, "foo.ch1.md"));
    },
    results: async ({ items }: { items: NotePropsV2 }) => {
      const schemaItem = _.pick(_.find(items, { fname: "foo.ch1" }), [
        "fname",
        "schemaStub",
      ]);
      return [
        {
          actual: schemaItem,
          expected: {
            fname: "foo.ch1",
            schemaStub: true,
          },
        },
      ];
    },
  }),
};

const LOOKUP_SINGLE_TEST_PRESET = {
  UPDATE_ITEMS,
};

export default LOOKUP_SINGLE_TEST_PRESET;
