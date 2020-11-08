import { NotePropsV2 } from "@dendronhq/common-all";
import { FileTestUtils, writeYAML } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { EngineTestUtilsV2, NodeTestPresetsV2, NodeTestUtilsV2 } from "../..";
import { TestPresetEntry } from "../../utils";

const IMPORT_BASIC = new TestPresetEntry({
  label: "basic",
  before: async (opts: { wsRoot?: string }) => {
    const importDir = tmpDir().name;
    const importSrc = path.join(importDir, "import.json");
    const jsonEntries = [
      {
        fname: "foo",
        body: "foo body 2",
      },
      {
        fname: "bar",
        body: "bar body",
      },
    ];
    fs.writeJSONSync(importSrc, jsonEntries);
    const { vaults, wsRoot } = await EngineTestUtilsV2.setupWS({
      wsRoot: opts.wsRoot,
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    });
    return { wsRoot, vaults, importSrc };
  },
  results: async ({
    vaultPath,
    vscode,
  }: {
    vaultPath: string;
    vscode: boolean;
  }) => {
    const filesInit = [
      ".git",
      "assets",
      "foo.md",
      "foo.ch1.md",
      "foo.schema.yml",
      "root.md",
      "root.schema.yml",
    ];
    if (vscode) {
      filesInit.push(".vscode");
    }
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
      vaultPath,
      filesInit,
      {
        add: ["bar.md"],
      }
    );
    const importedNote = fs.readFileSync(path.join(vaultPath, "foo.md"), {
      encoding: "utf8",
    });
    return [
      {
        actual: actualFiles,
        expected: expectedFiles,
      },
      {
        actual: _.every(["foo body 2"], (ent) => importedNote.match(ent)),
        expected: true,
      },
    ];
  },
});

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
  IMPORT: {
    BASIC: IMPORT_BASIC,
  },
};
export default JSON_TEST_PRESET;
