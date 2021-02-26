import { NotePropsV2, VaultUtils } from "@dendronhq/common-all";
import {
  CreateEngineFunction,
  ENGINE_HOOKS,
  PODS_CORE,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import {
  JSONExportPod,
  JSONImportPod,
  JSONPublishPod,
} from "@dendronhq/pods-core";
import _ from "lodash";
import { runEngineTestV5 } from "../../engine";

const createEngine: CreateEngineFunction = (opts) => {
  return DendronEngineV2.create(opts);
};

const podsDict = {
  IMPORT: () => new JSONImportPod(),
  EXPORT: () => new JSONExportPod(),
};

describe("json publish pod", () => {
  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new JSONPublishPod();
        const vaultName = VaultUtils.getName(vaults[0]);
        const resp = await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            fname: "foo",
            vaultName,
            dest: "stdout",
          },
        });
        const noteProps = JSON.parse(resp) as NotePropsV2;
        expect(noteProps.children).toEqual(["foo.ch1"]);
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});

const JSON_PRESETS = PODS_CORE.JSON;
_.map(JSON_PRESETS, (presets, name) => {
  describe(name, () => {
    test.each(
      _.map(presets, (v, k) => {
        return [k, v];
      })
    )("%p", async (_key, TestCase) => {
      const { testFunc, ...opts } = TestCase;
      // @ts-ignore
      const pod = podsDict[name]();
      await runEngineTestV4(testFunc, {
        ...opts,
        createEngine,
        expect,
        extra: { pod },
      });
    });
  });
});
