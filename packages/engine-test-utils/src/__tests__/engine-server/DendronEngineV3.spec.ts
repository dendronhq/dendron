import _ from "lodash";
import { createEngineV3FromEngine, runEngineTestV5 } from "../../engine";
import { ENGINE_V3_PRESETS, ENGINE_V3_PRESETS_MULTI } from "../../presets";

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
        // TODO: remove after migrating schema work
        if (_key === "MATCH_SCHEMA") {
          return;
        }
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
        // @ts-ignore
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV5(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});
