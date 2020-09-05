import { DNodeRawProps, Note, NoteRawProps } from "@dendronhq/common-all";
import {
  EngineTestUtils,
  FileTestUtils,
  node2MdFile,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { genPodConfig, getPodConfigPath } from "../..";
import { JSONExportPod } from "../JSONPod";

const createNotes = (vaultPath: string, notes: Partial<NoteRawProps>[]) => {
  node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
    root: vaultPath,
  });
  notes.map((n) => {
    // @ts-ignore
    node2MdFile(new Note(n), {
      root: vaultPath,
    });
  });
};

const assertNodeMeta = (opts: {
  expect: jest.Expect;
  payload: DNodeRawProps[];
  fields: string[];
  expected: Partial<DNodeRawProps>[];
}) => {
  const { expect, payload, fields, expected } = opts;
  expect(_.sortBy(_.map(payload, (ent) => _.pick(ent, fields)))).toEqual(
    expected
  );
};

const assertNodeBody = (opts: {
  expect: jest.Expect;
  payload: DNodeRawProps[];
  expected: { fname: string; body: string }[];
}) => {
  const { expect, payload, expected } = opts;
  expect(
    _.sortBy(
      _.map(payload, (ent) => {
        const { body, fname } = _.pick(ent, ["body", "fname"]);
        return {
          fname,
          body: _.trim(body),
        };
      })
    )
  ).toEqual(expected);
};

function setup(opts: { notes: Partial<NoteRawProps>[] }) {
  const podsDir = FileTestUtils.tmpDir().name;
  const storeDir = EngineTestUtils.setupStoreDir({
    copyFixtures: false,
    initDirCb: (dirPath: string) => {
      createNotes(dirPath, opts.notes);
    },
  });
  return { podsDir, storeDir };
}

describe("JSONExportPod", () => {
  let storeDir: string;
  let podsDir: string;

  const createNotes = (): Partial<NoteRawProps>[] => [
    { fname: "foo", body: "foo body" },
    { fname: "bar", body: "bar body" },
  ];

  beforeEach(async () => {
    ({ storeDir, podsDir } = await setup({ notes: createNotes() }));
  });

  test("basic", async () => {
    const pod = new JSONExportPod({ roots: [storeDir], podsDir });
    const mode = "notes";
    const metaOnly = false;
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config = { dest: destPath };
    await pod.plant({ mode, metaOnly, config });
    const payload = fs.readJSONSync(destPath) as NoteRawProps[];
    assertNodeMeta({
      expect,
      payload,
      fields: ["fname"],
      expected: [
        {
          fname: "root",
        },
        { fname: "bar" },
        { fname: "foo" },
      ],
    });
    assertNodeBody({
      expect,
      payload,
      expected: [
        {
          fname: "root",
          body: "",
        },
        { fname: "bar", body: "bar body" },
        { fname: "foo", body: "foo body" },
      ],
    });
  });

  test("basic no body", async () => {
    const pod = new JSONExportPod({ roots: [storeDir], podsDir });
    const mode = "notes";
    const metaOnly = true;
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config = { dest: destPath };
    await pod.plant({ mode, metaOnly, config });
    const payload = fs.readJSONSync(destPath) as NoteRawProps[];
    assertNodeMeta({
      expect,
      payload,
      fields: ["fname"],
      expected: [
        {
          fname: "root",
        },
        { fname: "bar" },
        { fname: "foo" },
      ],
    });
    assertNodeBody({
      expect,
      payload,
      expected: [
        {
          fname: "root",
          body: "",
        },
        { fname: "bar", body: "" },
        { fname: "foo", body: "" },
      ],
    });
  });

  test("write config", () => {
    genPodConfig(podsDir, JSONExportPod);
    const configPath = getPodConfigPath(podsDir, JSONExportPod);
    genPodConfig(podsDir, JSONExportPod);
    expect(fs.readFileSync(configPath, { encoding: "utf8" })).toMatchSnapshot();
  });
});
