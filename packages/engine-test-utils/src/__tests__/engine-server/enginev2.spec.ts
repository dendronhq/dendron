import { NotesCacheEntryMap, WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger, vault2Path } from "@dendronhq/common-server";
import {
  ENGINE_CONFIG_PRESETS,
  ENGINE_HOOKS,
  ENGINE_PRESETS,
  ENGINE_PRESETS_MULTI,
  getLogFilePath,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2, readNotesFromCache } from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../engine";

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
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
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

  test("links", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const cache: NotesCacheEntryMap = {};
        vaults.map((vault) => {
          const out = readNotesFromCache(vault2Path({ wsRoot, vault }));
          _.merge(cache, out.notes);
        });
        const alpha = engine.notes["alpha"];
        const omitKeys = ["body", "links", "parent", "children"];
        expect(_.omit(cache["alpha"].data, ...omitKeys)).toEqual(
          _.omit(alpha, ...omitKeys)
        );
        expect(
          _.filter(cache["alpha"].data.links, (l) => l.type !== "backlink")
        ).toEqual(_.filter(alpha.links, (l) => l.type !== "backlink"));
      },
      {
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupLinks(opts);
        },
      }
    );
  });
});

describe("engine, notes/", () => {
  const nodeType = "NOTES";

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
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
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
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
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});
