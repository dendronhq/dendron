import {
  DVault,
  NotesCacheEntryMap,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import { createLogger, vault2Path } from "@dendronhq/common-server";
import {
  FileTestUtils,
  getLogFilePath,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, readNotesFromCache } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { runEngineTestV5 } from "../../engine";
import {
  ENGINE_CONFIG_PRESETS,
  ENGINE_HOOKS,
  ENGINE_PRESETS,
  ENGINE_PRESETS_MULTI,
} from "../../presets";

const createEngine = ({ wsRoot }: WorkspaceOpts) => {
  const logger = createLogger("testLogger", getLogFilePath("engine-server"));
  const engine = DendronEngineV2.create({ wsRoot, logger });
  return engine;
};

describe("engine, schemas/", () => {
  const nodeType = "SCHEMAS";
  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        // @ts-ignore
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, expect });
      });
    });
  });
});

describe("engine, cache", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults }) => {
        const cache = {};
        vaults.map((vault) => {
          const out = readNotesFromCache(vault2Path({ wsRoot, vault }));
          _.merge(cache, out.notes);
        });
        // cache is based on unique filenames so don't count roots
        expect(_.size(cache)).toEqual(4);
      },
      {
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
        },
      }
    );
  });

  test("links and body", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const cache: NotesCacheEntryMap = {};
        vaults.map((vault) => {
          const out = readNotesFromCache(vault2Path({ wsRoot, vault }));
          _.merge(cache, out.notes);
        });
        const alpha = { ...engine.notes["alpha"] };
        const omitKeys = ["body", "links", "parent", "children"];
        expect(_.omit(cache["alpha"].data, ...omitKeys)).toEqual(
          _.omit(alpha, ...omitKeys)
        );
        expect(
          _.filter(cache["alpha"].data.links, (l) => l.type !== "backlink")
        ).toEqual(_.filter(alpha.links, (l) => l.type !== "backlink"));
        await engine.init();
        const alpha2 = engine.notes["alpha"];
        expect(alpha2).toEqual(alpha);
      },
      {
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupLinks(opts);
        },
      }
    );
  });

  test("cache after moving vaults", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const vault1 = _.find(vaults, { fsPath: "vault1" }) as DVault;
        const newVault1 = FileTestUtils.tmpDir();
        const vpath = vault2Path({ vault: vault1, wsRoot });
        fs.copySync(vpath, newVault1.name);
        const newVault = {
          fsPath: VaultUtils.normPathByWsRoot({
            fsPath: newVault1.name,
            wsRoot,
          }),
        };
        engine.vaults = [newVault];
        engine.notes = {};
        await engine.init();
        expect(
          _.uniqBy(
            _.map(_.values(engine.notes), (ent) => ent.vault),
            "fsPath"
          )
        ).toEqual([newVault]);
      },
      {
        expect,
        preSetupHook: async ({ wsRoot, vaults }) => {
          await NoteTestUtilsV4.createNote({
            wsRoot,
            vault: _.find(vaults, { fsPath: "vault1" })!,
            fname: "gamma.bar",
          });
        },
      }
    );
  });
});

describe("engine, notes/", () => {
  const nodeType = "NOTES";

  // EXAMPLE of running a single test
  // test.only("bond", async () => {
  //   const preset = getPreset({key: "NOTE_REF", nodeType: "NOTES", presetName: "rename", presets: ENGINE_PRESETS})
  //   const { testFunc, ...opts } = preset;
  //   await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
  // });

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, notes/multi/", () => {
  const nodeType = "NOTES";

  ENGINE_PRESETS_MULTI.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, config/", () => {
  _.map(ENGINE_CONFIG_PRESETS, (presets, name) => {
    describe(name, () => {
      test.each(
        _.map(presets, (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});
