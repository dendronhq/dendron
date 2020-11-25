import {
  CreateEngineFunction,
  PODS_CORE,
  runEngineTestV4,
} from "@dendronhq/common-test-utils";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { JSONExportPod, JSONImportPod } from "../JSONPod";

const createEngine: CreateEngineFunction = (opts) => {
  return DendronEngineV2.createV3(opts);
};

const podsDict = {
  IMPORT: () => new JSONImportPod(),
  EXPORT: () => new JSONExportPod(),
};

const JSON_PRESETS = PODS_CORE.JSON;
_.map(JSON_PRESETS, (presets, name) => {
  describe.only(name, () => {
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

// describe("JSONExportPod", () => {
//   let storeDir: string;
//   let podsDir: string;
//   let wsRoot: string;
//   let engine: DEngineClientV2;
//   let vaults: string[];

//   beforeEach(async () => {
//     podsDir = tmpDir().name;
//     ({ vaults, wsRoot } = await EngineTestUtilsV2.setupWS({
//       initDirCb: async (vaultDir) => {
//         await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({
//           vaultDir,
//         });
//       },
//     }));

//     engine = DendronEngineV2.createV3({
//       wsRoot,
//       vaults: vaults.map((fsPath) => ({ fsPath })),
//     });
//     await engine.init();
//   });

//   test("basic w/rel path", async () => {
//     const pod = new JSONExportPod();

//     const fname = "export.json";
//     const config = { dest: `./${fname}` };
//     await pod.execute({
//       config,
//       wsRoot,
//       engine,
//       vaults: [{ fsPath: storeDir }],
//     });
//     const payload = fs.readJSONSync(path.join(wsRoot, fname));
//     assertNodeMeta({
//       expect,
//       payload,
//       fields: ["fname"],
//       expected: [
//         {
//           fname: "root",
//         },
//         { fname: "foo" },
//         { fname: "foo.ch1" },
//       ],
//     });
//     assertNodeBody({
//       expect,
//       payload,
//       expected: [
//         {
//           fname: "root",
//           body: "",
//         },
//         { fname: "foo", body: "foo body" },
//         { fname: "foo.ch1", body: "foo body" },
//       ],
//     });
//   });

//   test("basic no body", async () => {
//     const pod = new JSONExportPod();
//     const destDir = tmpDir().name;
//     const destPath = path.join(destDir, "export.json");
//     const config: ExportPodRawConfig = { dest: destPath, includeBody: false };
//     await pod.execute({
//       config,
//       wsRoot,
//       engine,
//       vaults: [{ fsPath: storeDir }],
//     });
//     const payload = fs.readJSONSync(destPath);
//     assertNodeMeta({
//       expect,
//       payload,
//       fields: ["fname"],
//       expected: [
//         {
//           fname: "root",
//         },
//         { fname: "foo" },
//         { fname: "foo.ch1" },
//       ],
//     });
//     assertNodeBody({
//       expect,
//       payload,
//       expected: [
//         {
//           fname: "root",
//           body: "",
//         },
//         { fname: "foo", body: "" },
//         { fname: "foo.ch1", body: "" },
//       ],
//     });
//   });

//   test("write config", () => {
//     PodUtils.genConfigFile({ podsDir, podClass: JSONExportPod });
//     const configPath = PodUtils.getConfigPath({
//       podsDir,
//       podClass: JSONExportPod,
//     });
//     expect(fs.readFileSync(configPath, { encoding: "utf8" })).toMatchSnapshot();
//   });
// });
