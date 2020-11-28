import { DPod, DVault, NoteUtilsV2 } from "@dendronhq/common-all";
import { tmpDir, vault2Path } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import {
  AssertUtils,
  FileTestUtils,
  GenTestResults,
  SetupTestFunctionV4,
} from "../..";
import { TestPresetEntryV4 } from "../../utilsv2";
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
    const config = {
      src: importSrc,
      concatenate: false,
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
      const { pod } = extra as { pod: DPod<any> };
      const vault = vaults[0];
      const importSrc = createJSONEntries([
        {
          fname: "baz.one",
        },
      ]);

      const config = {
        src: importSrc,
        concatenate: false,
      };
      await pod.execute({
        config,
        vaults,
        wsRoot,
        engine,
      });
      const note = NoteUtilsV2.getNoteByFnameV4({
        fname: "baz",
        vault,
        notes: engine.notes,
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
      const { pod } = extra as { pod: DPod<any> };
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
      const { pod } = extra as { pod: DPod<any> };
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
      const { pod } = extra as { pod: DPod<any> };
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
    config,
    ...opts,
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
