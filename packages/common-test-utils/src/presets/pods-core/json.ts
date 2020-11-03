import { NotePropsV2 } from "@dendronhq/common-all";
import { writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { NodeTestUtilsV2 } from "../..";
import { TestPresetEntry } from "../../utils";

const EXPORT_BASIC = new TestPresetEntry({
  label: "basic",
  before: async ({
    configPath,
    exportDest,
  }: {
    configPath: string;
    exportDest: string;
  }) => {
    fs.ensureDirSync(path.dirname(configPath));
    writeYAML(configPath, { dest: exportDest });
  },
  results: async ({ destPath }: { destPath: string }) => {
    const payload = fs.readJSONSync(destPath) as NotePropsV2[];
    return [
      {
        actual: _.map(payload, (note) =>
          NodeTestUtilsV2.normalizeNote({ note })
        ),
        expected: [
          {
            body: "",
            children: ["foo"],
            created: "1",
            custom: {},
            data: {},
            desc: "",
            fname: "root",
            id: "root",
            links: [],
            parent: null,
            title: "Root",
            type: "note",
            updated: "1",
          },
          {
            body: "foo body",
            children: ["foo.ch1"],
            created: "1",
            custom: {},
            data: {},
            desc: "",
            fname: "foo",
            id: "foo",
            links: [],
            parent: "root",
            schema: { moduleId: "foo", schemaId: "foo" },
            title: "Foo",
            type: "note",
            updated: "1",
          },
          {
            body: "foo body",
            children: [],
            created: "1",
            custom: {},
            data: {},
            desc: "",
            fname: "foo.ch1",
            id: "foo.ch1",
            links: [],
            parent: "foo",
            schema: { moduleId: "foo", schemaId: "ch1" },
            title: "Ch1",
            type: "note",
            updated: "1",
          },
        ],
      },
    ];
  },
});

const JSON_TEST_PRESET = {
  EXPORT: {
    BASIC: EXPORT_BASIC,
  },
  IMPORT: {},
};
export default JSON_TEST_PRESET;
