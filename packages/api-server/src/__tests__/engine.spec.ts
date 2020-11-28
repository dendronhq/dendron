import _ from "lodash";
import {
  CreateEngineFunction,
  ENGINE_CONFIG_PRESETS,
  ENGINE_PRESETS,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineClient } from "@dendronhq/engine-server";

const createEngine: CreateEngineFunction = ({ wsRoot, vaults }) => {
  return DendronEngineClient.create({
    port: "3005",
    ws: wsRoot,
    vaults: vaults.map((ent) => ent.fsPath),
  });
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
        // @ts-ignore
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
        // @ts-ignore
        const { testFunc, ...opts } = TestCase;
        await runEngineTestV4(testFunc, { ...opts, createEngine, expect });
      });
    });
  });
});
