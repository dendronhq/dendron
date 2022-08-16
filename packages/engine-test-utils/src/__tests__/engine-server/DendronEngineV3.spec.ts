import { CONSTANTS } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import {
  DendronEngineClient,
  NotesFileSystemCache,
} from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { createEngineV3FromEngine, runEngineTestV5 } from "../../engine";
import {
  ENGINE_HOOKS,
  ENGINE_V3_PRESETS,
  ENGINE_V3_PRESETS_MULTI,
} from "../../presets";

const createEngine = createEngineV3FromEngine;

describe("engine, notes/", () => {
  const nodeType = "NOTES";

  ENGINE_V3_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        // @ts-ignore
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, notes/multi/", () => {
  const nodeType = "NOTES";

  ENGINE_V3_PRESETS_MULTI.forEach((pre) => {
    const { name, presets } = pre;
    describe(name, () => {
      test.each(
        _.map(presets[nodeType], (v, k) => {
          return [k, v];
        })
      )("%p", async (_key, TestCase) => {
        // TODO: remove after migrating schema work
        if (
          _key === "DOMAIN_QUERY_WITH_SCHEMA" ||
          _key === "CHILD_QUERY_WITH_SCHEMA"
        ) {
          return;
        }
        // @ts-ignore
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});

describe("engine, schemas/", () => {
  const nodeType = "SCHEMAS";

  ENGINE_V3_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    const presetByNodeType = presets[nodeType];
    if (!_.isEmpty(presetByNodeType)) {
      describe(name, () => {
        test.each(
          _.map(presetByNodeType, (v, k) => {
            return [k, v];
          })
        )("%p", async (_key, TestCase) => {
          // @ts-ignore
          const { testFunc, ...opts } = TestCase;
          await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
        });
      });
    }
  });
});

describe("engine, cache", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        let cache = new Set();
        vaults.map((vault) => {
          const cachePath = path.join(
            vault2Path({ wsRoot, vault }),
            CONSTANTS.DENDRON_CACHE_FILE
          );
          const notesCache = new NotesFileSystemCache({
            cachePath,
            logger: (engine as DendronEngineClient).logger,
          });
          cache = new Set([...cache, ...notesCache.getCacheEntryKeys()]);
        });
        // cache is based on unique filenames so don't count roots
        expect(_.size(cache)).toEqual(4);
      },
      {
        createEngine,
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
        const cachePath = path.join(
          vault2Path({ wsRoot, vault: vaults[0] }),
          CONSTANTS.DENDRON_CACHE_FILE
        );
        const notesCache = new NotesFileSystemCache({
          cachePath,
          logger: (engine as DendronEngineClient).logger,
        });
        const alpha = (await engine.getNote("alpha")).data!;
        const omitKeys = ["body", "links", "parent", "children"];
        expect(_.omit(notesCache.get("alpha")!.data, ...omitKeys)).toEqual(
          _.omit(alpha, ...omitKeys)
        );
        expect(
          _.filter(
            notesCache.get("alpha")!.data.links,
            (l) => l.type !== "backlink"
          )
        ).toEqual(_.filter(alpha.links, (l) => l.type !== "backlink"));
        await engine.init();
        const alpha2 = (await engine.getNote("alpha")).data!;
        expect(alpha2).toEqual(alpha);
      },
      {
        createEngine,
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupLinks(opts);
        },
      }
    );
  });
});
