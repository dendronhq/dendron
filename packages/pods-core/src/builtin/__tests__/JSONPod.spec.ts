import {
  DNode,
  DNodeRawProps,
  DNodeUtils,
  Note,
  NoteRawProps,
} from "@dendronhq/common-all";
import {
  EngineTestUtils,
  FileTestUtils,
  node2MdFile,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ExportConfig, genPodConfig, getPodConfigPath } from "../..";
import {
  JSONExportPod,
  JSONImportPod,
  ImportPodConfig as JSONImportPodConfig,
} from "../JSONPod";

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

function setupImport(opts: { jsonEntries: Partial<NoteRawProps>[] }) {
  const podsDir = FileTestUtils.tmpDir().name;
  const importDir = FileTestUtils.tmpDir().name;
  const importSrc = path.join(importDir, "import.json");
  fs.writeJSONSync(importSrc, opts.jsonEntries);
  const storeDir = EngineTestUtils.setupStoreDir({
    copyFixtures: false,
    initDirCb: (dirPath: string) => {
      createNotes(dirPath, []);
    },
  });
  return { podsDir, storeDir, importSrc, importDir };
}

describe("JSONImportPod", () => {
  let storeDir: string;
  let importSrc: string;
  let wsRoot: string;
  const mode = "notes";
  const createJSON = () => {
    return [
      {
        fname: "foo",
        body: "foo body",
      },
      {
        fname: "bar",
        body: "bar body",
      },
    ];
  };

  beforeEach(async () => {
    ({ storeDir, importSrc } = await setupImport({
      jsonEntries: createJSON(),
    }));
    wsRoot = path.dirname(importSrc).split("/").slice(0, -1).join("/");
  });

  test("basic", async () => {
    const pod = new JSONImportPod({ roots: [storeDir], wsRoot });
    const config: JSONImportPodConfig = {
      src: importSrc,
      concatenate: false,
    };
    await pod.plant({ mode, config });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(storeDir, [], {
      add: ["root.md", "foo.md", "bar.md"],
    });
    expect(expectedFiles).toEqual(actualFiles);
    const importedNote = fs.readFileSync(path.join(storeDir, "foo.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["foo body"], (ent) => importedNote.match(ent))
    ).toBeTruthy();
  });

  test("basic w/stubs", async () => {
    ({ storeDir, importSrc } = await setupImport({
      jsonEntries: createJSON().concat([
        { fname: "baz.one", body: "baz body" },
      ]),
    }));
    wsRoot = path.dirname(importSrc).split("/").slice(0, -1).join("/");
    const pod = new JSONImportPod({ roots: [storeDir], wsRoot });
    const config: JSONImportPodConfig = {
      src: importSrc,
      concatenate: false,
    };
    await pod.plant({ mode, config });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(storeDir, [], {
      add: ["root.md", "foo.md", "bar.md", "baz.one.md"],
    });
    expect(expectedFiles).toEqual(actualFiles);
    const stubNote = DNodeUtils.getNoteByFname("baz", pod.engine) as Note;
    expect(stubNote.stub).toBeTruthy();
    const importedNote = fs.readFileSync(path.join(storeDir, "foo.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["foo body"], (ent) => importedNote.match(ent))
    ).toBeTruthy();
  });

  test("basic w/rel path", async () => {
    const pod = new JSONImportPod({ roots: [storeDir], wsRoot });
    const dirname = path.dirname(importSrc).split("/").slice(-1)[0];
    const basename = path.basename(importSrc);
    const config: JSONImportPodConfig = {
      src: `./${path.join(dirname, basename)}`,
      concatenate: false,
    };
    await pod.plant({ mode, config });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(storeDir, [], {
      add: ["root.md", "foo.md", "bar.md"],
    });
    expect(expectedFiles).toEqual(actualFiles);
    const importedNote = fs.readFileSync(path.join(storeDir, "foo.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["foo body"], (ent) => importedNote.match(ent))
    ).toBeTruthy();
  });

  test("concatenate", async () => {
    const pod = new JSONImportPod({ roots: [storeDir], wsRoot });
    const config: JSONImportPodConfig = {
      src: importSrc,
      concatenate: true,
      destName: "results",
    };
    await pod.plant({ mode, config });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(storeDir, [], {
      add: ["root.md", "results.md"],
    });
    expect(expectedFiles).toEqual(actualFiles);
    const importedNote = fs.readFileSync(path.join(storeDir, "results.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["[[bar]]", "bar body", "foo body"], (ent) =>
        importedNote.match(ent)
      )
    ).toBeTruthy();
  });

  test("concatenate without dest set", async () => {
    const pod = new JSONImportPod({ roots: [storeDir], wsRoot });
    const config: JSONImportPodConfig = {
      src: importSrc,
      concatenate: true,
    };
    try {
      await pod.plant({ mode, config });
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });
});

describe("JSONExportPod", () => {
  let storeDir: string;
  let podsDir: string;
  let wsRoot: string;

  const createNotes = (): Partial<NoteRawProps>[] => [
    { fname: "foo", body: "foo body" },
    { fname: "bar", body: "bar body" },
  ];

  beforeEach(async () => {
    ({ storeDir, podsDir } = await setup({ notes: createNotes() }));
    wsRoot = path.dirname(podsDir).split("/").slice(0, -1).join("/");
  });

  test("basic", async () => {
    const pod = new JSONExportPod({ roots: [storeDir], wsRoot });
    const mode = "notes";
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config = { dest: destPath };
    await pod.plant({ mode, config });
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

  test("basic w/rel path", async () => {
    const pod = new JSONExportPod({ roots: [storeDir], wsRoot });
    const mode = "notes";

    const fname = "export.json";
    const config = { dest: `./${fname}` };
    await pod.plant({ mode, config });
    const payload = fs.readJSONSync(path.join(wsRoot, fname)) as NoteRawProps[];
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
    const pod = new JSONExportPod({ roots: [storeDir], wsRoot });
    const mode = "notes";
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config: ExportConfig = { dest: destPath, includeBody: false };
    await pod.plant({ mode, config });
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
