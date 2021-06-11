import { DPod, DVault, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  AssertUtils,
  TestPresetEntryV4,
  FileTestUtils,
  GenTestResults,
  SetupTestFunctionV4,
} from "@dendronhq/common-test-utils";
import { ImportPod, ImportPodConfig } from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import { setupBasic } from "../engine-server/utils";

type JSONEntry = {
  fname: string;
  body?: string;
};

const createJSONEntries = (
  jsonEntries: JSONEntry[],
  opts?: { customRoot?: string }
) => {
  const importDir = opts?.customRoot || tmpDir().name;
  const importSrc = path.join(importDir, "import.json");
  fs.writeJSONSync(importSrc, jsonEntries);
  return importSrc;
};

const assertInNote = ({
  vault,
  wsRoot,
  fname,
  match,
  nomatch,
}: { vault: DVault; wsRoot: string; fname: string } & Omit<
  Parameters<typeof AssertUtils.assertInString>[0],
  "body"
>) => {
  const vpath = vault2Path({ vault, wsRoot });
  const importedNote = fs.readFileSync(path.join(vpath, fname + ".md"), {
    encoding: "utf8",
  });
  return AssertUtils.assertInString({ body: importedNote, match, nomatch });
};

const getImportPod = (extra: any) => {
  return extra.pod as ImportPod;
};

const IMPORT = {
  BASIC: new TestPresetEntryV4(async ({ wsRoot, engine, vaults, extra }) => {
    const { pod } = extra as { pod: DPod<any> };
    const vault = vaults[0];

    const importSrc = createJSONEntries([
      {
        fname: "foo",
        body: "foo body 2",
      },
      {
        fname: "bar",
        body: "bar body",
      },
    ]);
    const config: ImportPodConfig = {
      src: importSrc,
      concatenate: false,
      vaultName: VaultUtils.getName(vault),
    };
    await pod.execute({
      config,
      vaults,
      wsRoot,
      engine,
    });
    const vpath = vault2Path({ vault, wsRoot });
    const importedNote = fs.readFileSync(path.join(vpath, "foo.md"), {
      encoding: "utf8",
    });
    return [
      {
        actual: await FileTestUtils.assertInVault({
          vault,
          wsRoot,
          match: ["foo.md", "bar.md"],
        }),
        expected: true,
      },
      {
        actual: await AssertUtils.assertInString({
          body: importedNote,
          match: ["foo body 2"],
        }),
        expected: true,
      },
    ];
  }),
  BASIC_W_STUBS: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const pod = getImportPod(extra);
      const vault = vaults[0];
      const importSrc = createJSONEntries([
        {
          fname: "baz.one",
        },
      ]);

      const config = {
        src: importSrc,
        concatenate: false,
        vaultName: VaultUtils.getName(vault),
      };
      await pod.execute({
        config,
        vaults,
        wsRoot,
        engine,
      });
      const note = NoteUtils.getNoteByFnameV5({
        fname: "baz",
        vault,
        notes: engine.notes,
        wsRoot: engine.wsRoot,
      });

      return [
        {
          actual: await FileTestUtils.assertInVault({
            vault,
            wsRoot,
            match: ["baz.one.md"],
            nomatch: ["baz.md"],
          }),
          expected: true,
        },
        {
          actual: note?.stub,
          expected: true,
        },
      ];
    }
  ),
  BASIC_W_REL_PATH: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const pod = getImportPod(extra);
      const vault = vaults[0];
      const importSrc = createJSONEntries(
        [
          {
            fname: "foo",
          },
        ],
        { customRoot: wsRoot }
      );

      const basename = path.basename(importSrc);
      const config = {
        src: `./${basename}`,
        concatenate: false,
        vaultName: VaultUtils.getName(vault),
      };
      await pod.execute({
        config,
        vaults,
        wsRoot,
        engine,
      });

      return [
        {
          actual: await FileTestUtils.assertInVault({
            vault,
            wsRoot,
            match: ["foo.md"],
          }),
          expected: true,
        },
      ];
    }
  ),
  CONCATENATE: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const pod = getImportPod(extra);
      const vault = vaults[0];
      const importSrc = createJSONEntries([
        {
          fname: "foo",
          body: "foo body",
        },
        {
          fname: "bar",
          body: "bar body",
        },
      ]);

      const config = {
        src: importSrc,
        concatenate: true,
        destName: "results",
        vaultName: VaultUtils.getName(vault),
      };
      await pod.execute({
        config,
        vaults,
        wsRoot,
        engine,
      });

      return [
        {
          actual: await FileTestUtils.assertInVault({
            vault,
            wsRoot,
            match: ["results.md"],
          }),
          expected: true,
        },
        {
          actual: await assertInNote({
            wsRoot,
            vault,
            fname: "results",
            match: ["foo body", "bar body"],
          }),
          expected: true,
        },
      ];
    }
  ),
  CONCATENATE_W_NO_DEST: new TestPresetEntryV4(
    async ({ wsRoot, engine, vaults, extra }) => {
      const pod = getImportPod(extra);
      const importSrc = createJSONEntries([
        {
          fname: "foo",
          body: "foo body",
        },
        {
          fname: "bar",
          body: "bar body",
        },
      ]);
      const vault = vaults[0];

      const config = {
        src: importSrc,
        vaultName: VaultUtils.getName(vault),
        concatenate: true,
      };
      try {
        await pod.execute({
          config,
          vaults,
          wsRoot,
          engine,
        });
      } catch (err) {
        return [];
      }
      throw new Error("bad test");
    }
  ),
};

const genTestResultsForExportBasic: GenTestResults = async (opts) => {
  const destPath = opts.extra.destPath;
  const importedNote = fs.readFileSync(path.join(destPath), {
    encoding: "utf8",
  });
  return [
    {
      actual: await AssertUtils.assertInString({
        body: importedNote,
        match: ["foo body", "bar body"],
      }),
      expected: true,
    },
    {
      actual: await AssertUtils.assertInString({
        body: importedNote,
        match: ["foo body"],
      }),
      expected: true,
    },
  ];
};

const setupTestForExportBasic: SetupTestFunctionV4 = async (opts) => {
  const { extra } = opts;
  const { pod } = extra as { pod: DPod<any> };
  const destDir = tmpDir().name;
  const destPath = path.join(destDir, "export.json");
  const config = { dest: destPath };
  await pod.execute({
    ...opts,
    config,
  });
  return { destPath };
};

const EXPORT = {
  BASIC: new TestPresetEntryV4(
    async function (this: Required<TestPresetEntryV4>, opts) {
      const { destPath } = await this.setupTest(opts);
      return this.genTestResults({ ...opts, extra: { destPath } });
    },
    {
      preSetupHook: setupBasic,
      genTestResults: genTestResultsForExportBasic,
      setupTest: setupTestForExportBasic,
    }
  ),
};

const JSON_TEST_PRESET = {
  EXPORT,
  IMPORT,
};
export default JSON_TEST_PRESET;
