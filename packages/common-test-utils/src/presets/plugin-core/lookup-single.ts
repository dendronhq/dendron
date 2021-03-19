import { DVault, NoteProps } from "@dendronhq/common-all";
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
    results: async ({ items }: { items: NoteProps }) => {
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

const ACCEPT_ITEMS = {
  EXISTING_ITEM: new TestPresetEntry({
    label: "existing item",
    results: async ({
      activeFileName,
      activeNote,
    }: {
      activeFileName: string;
      activeNote: NoteProps;
    }) => {
      return [
        {
          actual: activeFileName,
          expected: "foo",
        },
        {
          actual: _.pick(activeNote, ["title", "created"]),
          expected: {
            title: "Foo",
            created: "1",
          },
        },
      ];
    },
  }),
};

const LOOKUP_SINGLE_TEST_PRESET = {
  UPDATE_ITEMS,
  ACCEPT_ITEMS,
};

export default LOOKUP_SINGLE_TEST_PRESET;
