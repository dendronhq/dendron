import _ from "lodash";
import { createEngineFromServer, runEngineTestV5 } from "../../engine";
import { ENGINE_CONFIG_PRESETS, ENGINE_PRESETS } from "../../presets";

const createEngine = createEngineFromServer

describe("engine, schemas/", () => {
  const nodeType = "SCHEMAS";

  ENGINE_PRESETS.forEach((pre) => {
    const { name, presets } = pre;
    // @ts-ignore
    const presetByNodeType = presets[nodeType];
    if (!_.isEmpty(presetByNodeType)) {
      describe(name, () => {
        test.each(
          // @ts-ignore
          _.map(presets[nodeType], (v, k) => {
            return [k, v];
          })
        )("%p", async (_key, TestCase) => {
          const { testFunc, ...opts } = TestCase;
          await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
        });
      });
    }
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
        // @ts-ignore
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
        // @ts-ignore
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});
