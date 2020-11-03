import {
  DEngineClientV2,
  DNodeRawProps,
  NotePropsV2,
  NoteRawProps,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { createLogger, FileTestUtils } from "@dendronhq/common-server";
import {
  EngineTestUtilsV2,
  NodeTestPresetsV2,
  PODS_CORE,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { ExportPodRawConfig } from "../../basev2";
import { PodUtils } from "../../utils";
import {
  JSONExportPod,
  JSONImportPod,
  JSONImportPodRawConfig,
} from "../JSONPod";

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

async function setupImport(opts: { jsonEntries: Partial<NoteRawProps>[] }) {
  const podsDir = FileTestUtils.tmpDir().name;
  const importDir = FileTestUtils.tmpDir().name;
  const importSrc = path.join(importDir, "import.json");
  fs.writeJSONSync(importSrc, opts.jsonEntries);
  const { vaults, wsRoot } = await EngineTestUtilsV2.setupWS({
    initDirCb: async (vaultDir) => {
      await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
        vaultDir,
      });
    },
  });
  return { podsDir, wsRoot, vaults, importSrc, importDir };
}

describe("JSONImportPod", () => {
  let importSrc: string;
  let wsRoot: string;
  let engine: DEngineClientV2;
  let vaults: string[];

  const createJSON = () => {
    return [
      {
        fname: "foo",
        body: "foo body 2",
      },
      {
        fname: "bar",
        body: "bar body",
      },
    ];
  };

  beforeEach(async () => {
    ({ wsRoot, vaults, importSrc } = await setupImport({
      jsonEntries: createJSON(),
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
    const pod = new JSONImportPod();
    const config: JSONImportPodRawConfig = {
      src: importSrc,
      concatenate: false,
    };
    await pod.execute({
      config,
      vaults: vaults.map((fsPath) => ({ fsPath })),
      wsRoot,
      engine,
    });
    await NodeTestPresetsV2.runJestHarness({
      opts: {
        vaultPath: vaults[0],
      },
      results: PODS_CORE.JSON.IMPORT.BASIC.results,
      expect,
    });
  });

  test("basic w/stubs", async () => {
    ({ wsRoot, vaults, importSrc } = await setupImport({
      jsonEntries: createJSON().concat([
        { fname: "baz.one", body: "baz body" },
      ]),
    }));
    const pod = new JSONImportPod();
    const config: JSONImportPodRawConfig = {
      src: importSrc,
      concatenate: false,
    };
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
    await pod.execute({
      config,
      vaults: vaults.map((fsPath) => ({ fsPath })),
      wsRoot,
      engine,
    });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
      vaults[0],
      [
        ".git",
        "assets",
        "foo.md",
        "foo.ch1.md",
        "foo.schema.yml",
        "root.md",
        "root.schema.yml",
      ],
      {
        add: ["bar.md", "baz.one.md"],
      }
    );
    expect(expectedFiles).toEqual(actualFiles);

    const stubNote = NoteUtilsV2.getNoteByFname(
      "baz",
      engine.notes
    ) as NotePropsV2;
    expect(stubNote.stub).toBeTruthy();
    const importedNote = fs.readFileSync(path.join(vaults[0], "foo.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["foo body"], (ent) => importedNote.match(ent))
    ).toBeTruthy();
  });

  test("basic w/rel path", async () => {
    const pod = new JSONImportPod();
    const importSrc = path.join(wsRoot, "import.json");
    fs.writeJSONSync(importSrc, createJSON());
    const basename = path.basename(importSrc);
    const config: JSONImportPodRawConfig = {
      src: `./${basename}`,
      concatenate: false,
    };
    await pod.execute({
      config,
      vaults: vaults.map((fsPath) => ({ fsPath })),
      wsRoot,
      engine,
    });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
      vaults[0],
      [
        ".git",
        "assets",
        "foo.md",
        "foo.ch1.md",
        "foo.schema.yml",
        "root.md",
        "root.schema.yml",
      ],
      {
        add: ["bar.md"],
      }
    );
    expect(expectedFiles).toEqual(actualFiles);
    const importedNote = fs.readFileSync(path.join(vaults[0], "foo.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["foo body"], (ent) => importedNote.match(ent))
    ).toBeTruthy();
  });

  test("concatenate", async () => {
    const pod = new JSONImportPod();
    const config: JSONImportPodRawConfig = {
      src: importSrc,
      concatenate: true,
      destName: "results",
    };
    await pod.execute({
      config,
      vaults: vaults.map((fsPath) => ({ fsPath })),
      wsRoot,
      engine,
    });
    let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(
      vaults[0],
      [
        ".git",
        "assets",
        "foo.md",
        "foo.ch1.md",
        "foo.schema.yml",
        "root.md",
        "root.schema.yml",
      ],
      {
        add: ["results.md"],
      }
    );
    expect(expectedFiles).toEqual(actualFiles);
    const importedNote = fs.readFileSync(path.join(vaults[0], "results.md"), {
      encoding: "utf8",
    });
    expect(
      _.every(["foo body 2"], (ent) => importedNote.match(ent))
    ).toBeTruthy();
  });

  test("concatenate without dest set", async () => {
    const pod = new JSONImportPod();
    const config: JSONImportPodRawConfig = {
      src: importSrc,
      concatenate: true,
    };
    try {
      await pod.execute({
        config,
        vaults: vaults.map((fsPath) => ({ fsPath })),
        wsRoot,
        engine,
      });
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
    const config: ExportPodRawConfig = { dest: destPath, includeBody: false };
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
