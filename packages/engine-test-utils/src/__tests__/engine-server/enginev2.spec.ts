import { WorkspaceOpts } from "@dendronhq/common-all";
import { createLogger } from "@dendronhq/common-server";
import {
  ENGINE_CONFIG_PRESETS,
  ENGINE_PRESETS,
  ENGINE_PRESETS_MULTI,
  getLogFilePath,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import _ from "lodash";

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
