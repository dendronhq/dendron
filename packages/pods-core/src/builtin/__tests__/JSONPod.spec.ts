import {
  DEngineClientV2,
  DNodeRawProps,
  DNodeUtils,
  Note,
  NoteRawProps,
} from "@dendronhq/common-all";
import {
  createLogger,
  EngineTestUtils,
  FileTestUtils,
  node2MdFile,
} from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
  PODS_CORE,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ExportConfig, PodUtils } from "../..";
import {
  ImportPodConfig as JSONImportPodConfig,
  JSONExportPod,
  JSONImportPod,
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
  let engine: DEngineClientV2;
  let vaults: string[];

  beforeEach(async () => {
    podsDir = FileTestUtils.tmpDir().name;
    ({ vaults, wsRoot } = await EngineTestUtilsV2.setupWS({
      initDirCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
          vaultDir,
        });
      },
    }));

    const LOGGER = createLogger();
    engine = new DendronEngineV2({
      vaults,
      forceNew: true,
      store: new FileStorageV2({
        vaults,
        logger: LOGGER,
      }),
      mode: "fuzzy",
      logger: LOGGER,
    });
  });

  test("basic", async () => {
    const pod = new JSONExportPod();
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config = { dest: destPath };
    await pod.execute({
      config,
      wsRoot,
      engine,
      vaults: [{ fsPath: storeDir }],
    });
    await NodeTestPresetsV2.runJestHarness({
      opts: {
        destPath,
      },
      results: PODS_CORE.JSON.EXPORT.BASIC.results,
      expect,
    });
  });

  test("basic w/rel path", async () => {
    const pod = new JSONExportPod();

    const fname = "export.json";
    const config = { dest: `./${fname}` };
    await pod.execute({
      config,
      wsRoot,
      engine,
      vaults: [{ fsPath: storeDir }],
    });
    const payload = fs.readJSONSync(path.join(wsRoot, fname)) as NoteRawProps[];
    assertNodeMeta({
      expect,
      payload,
      fields: ["fname"],
      expected: [
        {
          fname: "root",
        },
        { fname: "foo" },
        { fname: "foo.ch1" },
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
        { fname: "foo", body: "foo body" },
        { fname: "foo.ch1", body: "foo body" },
      ],
    });
  });

  test("basic no body", async () => {
    const pod = new JSONExportPod();
    const destDir = FileTestUtils.tmpDir().name;
    const destPath = path.join(destDir, "export.json");
    const config: ExportConfig = { dest: destPath, includeBody: false };
    await pod.execute({
      config,
      wsRoot,
      engine,
      vaults: [{ fsPath: storeDir }],
    });
    const payload = fs.readJSONSync(destPath) as NoteRawProps[];
    assertNodeMeta({
      expect,
      payload,
      fields: ["fname"],
      expected: [
        {
          fname: "root",
        },
        { fname: "foo" },
        { fname: "foo.ch1" },
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
        { fname: "foo", body: "" },
        { fname: "foo.ch1", body: "" },
      ],
    });
  });

  test("write config", () => {
    PodUtils.genConfigFile({ podsDir, podClass: JSONExportPod });
    const configPath = PodUtils.getConfigPath({
      podsDir,
      podClass: JSONExportPod,
    });
    expect(fs.readFileSync(configPath, { encoding: "utf8" })).toMatchSnapshot();
  });
});
