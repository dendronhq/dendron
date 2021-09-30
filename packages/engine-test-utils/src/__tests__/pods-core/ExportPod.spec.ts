import {
  DEngineClient,
  VaultUtils,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  ExportPod,
  ExportPodConfig,
  ExportPodPlantOpts,
  JSONSchemaType,
  PodUtils,
} from "@dendronhq/pods-core";
import _ from "lodash";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS_MULTI } from "../../presets";

class DummyExportPod extends ExportPod {
  get config(): JSONSchemaType<ExportPodConfig> {
    return PodUtils.createExportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<ExportPodConfig>;
  }

  async plant(opts: ExportPodPlantOpts) {
    const { notes } = opts;
    return { notes };
  }
}

const runExport = ({
  opts,
  config,
}: {
  opts: WorkspaceOpts & { engine: DEngineClient };
  config?: Partial<ExportPodConfig>;
}) => {
  const pod = new DummyExportPod();
  return pod.execute({
    ...opts,
    config: {
      dest: "foo",
      ...config,
    },
  });
};

const defaultTestOpts = {
  expect,
  preSetupHook: ENGINE_HOOKS_MULTI.setupBasicMulti,
};

describe("GIVEN export", () => {
  describe("when regular export", () => {
    test("THEN export everything", async () => {
      await runEngineTestV5(async (opts) => {
        const resp = await runExport({ opts });
        expect(resp.notes.map((ent) => ent.id).sort()).toEqual(
          _.keys(opts.engine.notes).sort()
        );
      }, defaultTestOpts);
    });
  });

  describe("when exclude vaults", () => {
    test("THEN don't export excluded vaults", async () => {
      await runEngineTestV5(async (opts) => {
        const resp = await runExport({
          opts,
          config: {
            vaults: {
              exclude: ["vault2", "vaultThree"],
            },
          },
        });
        const expected = _.values(opts.engine.notes)
          .filter((ent) => VaultUtils.getName(ent.vault) === "vault1")
          .map((ent) => ent.id)
          .sort();
        expect(resp.notes.map((ent) => ent.id).sort()).toEqual(expected);
      }, defaultTestOpts);
    });
  });

  describe("when include vaults", () => {
    test("THEN only include vaults", async () => {
      await runEngineTestV5(async (opts) => {
        const resp = await runExport({
          opts,
          config: {
            vaults: { include: ["vault1"] },
          },
        });
        const expected = _.values(opts.engine.notes)
          .filter((ent) => VaultUtils.getName(ent.vault) === "vault1")
          .map((ent) => ent.id)
          .sort();
        expect(resp.notes.map((ent) => ent.id).sort()).toEqual(expected);
      }, defaultTestOpts);
    });
  });
});
