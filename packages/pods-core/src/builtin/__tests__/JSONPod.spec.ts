import { DNodeRawProps, Note, NoteRawProps } from "@dendronhq/common-all";
import {
  EngineTestUtils,
  FileTestUtils,
  node2MdFile,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import { ExportPod } from "../JSONPod";

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
  return EngineTestUtils.setupStoreDir({
    copyFixtures: false,
    initDirCb: (dirPath: string) => {
      createNotes(dirPath, opts.notes);
    },
  });
}

describe("ExportPod", () => {
  let root: string;

  const createNotes = (): Partial<NoteRawProps>[] => [
    { fname: "foo", body: "foo body" },
    { fname: "bar", body: "bar body" },
  ];

  test("basic", async () => {
    root = await setup({ notes: createNotes() });
    const pod = new ExportPod({ roots: [root] });
    const mode = "notes";
    const metaOnly = false;
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config = { dest: URI.file(destPath) };
    await pod.plant({ mode, metaOnly, config });
    const payload = fs.readJSONSync(destPath) as NoteRawProps[];
    expect(payload).toMatchSnapshot();
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
    root = await setup({ notes: createNotes() });
    const pod = new ExportPod({ roots: [root] });
    const mode = "notes";
    const metaOnly = true;
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config = { dest: URI.file(destPath) };
    await pod.plant({ mode, metaOnly, config });
    const payload = fs.readJSONSync(destPath) as NoteRawProps[];
    expect(payload).toMatchSnapshot();
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
});
