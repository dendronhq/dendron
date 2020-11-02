import { EngineTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import { CONFIG } from "../../constants";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";

function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
  const _settings = settings;
  return {
    get: (_key: string) => {
      return _.get(_settings, _key);
    },
    update: async (_key: string, _value: any) => {
      _.set(_settings, _key, _value);
    },
    has: (key: string) => {
      return _.has(_settings, key);
    },
    inspect: (_section: string) => {
      return _settings;
    },
  };
}

// @ts-ignore
function setupDendronWorkspace(
  rootDir: string,
  ctx: vscode.ExtensionContext,
  opts?: {
    configOverride?: any;
    setupWsOverride?: Partial<SetupWorkspaceOpts>;
    useFixtures?: boolean;
    fixtureDir?: string;
    useCb?: (vaultPath: string) => Promise<void>;
    activateWorkspace?: boolean;
  }
) {
  const optsClean = _.defaults(opts, {
    configOverride: {},
    setupWsOverride: { skipConfirmation: true },
    fixtureDir: "store",
    activateWorkspace: false,
  });
  if (opts?.useFixtures || opts?.useCb) {
    optsClean.setupWsOverride.emptyWs = true;
  }

  // pretend workspace is active
  if (optsClean.activateWorkspace) {
    DendronWorkspace.isActive = () => true;
  }
  // override configuration
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir,
      },
    };
    _.forEach(CONFIG, (ent) => {
      // @ts-ignore
      if (ent.default) {
        // @ts-ignore
        _.set(config, ent.key, ent.default);
      }
    });
    _.forEach(optsClean.configOverride, (v, k) => {
      _.set(config, k, v);
    });
    config["dendron.noServerMode"] = true;
    return createMockConfig(config);
  };

  const vaultPath = path.join(rootDir, "vault");
  DendronWorkspace.workspaceFile = () => {
    return vscode.Uri.file(path.join(rootDir, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = vscode.Uri.file(vaultPath);
    return [{ uri, name: "vault", index: 0 }];
  };
  return new SetupWorkspaceCommand()
    .execute({
      rootDirRaw: rootDir,
      skipOpenWs: true,
      ...optsClean.setupWsOverride,
    })
    .then(async () => {
      if (opts?.useFixtures) {
        await EngineTestUtils.setupStoreDir({
          copyFixtures: true,
          storeDstPath: vaultPath,
          storeDirSrc: optsClean.fixtureDir,
        });
      }
      if (opts?.useCb) {
        await opts.useCb(vaultPath);
      }
      return _activate(ctx);
    });
}

// @ts-ignore
const TIMEOUT = 60 * 1000 * 5;

export const rndName = (): string => {
  const name = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);

  return name.length !== 5 ? rndName() : name;
};

export const createFile = async (
  filename: string,
  content: string = "",
  _syncCache: boolean = true
): Promise<vscode.Uri | undefined> => {
  const workspaceFolder = DendronWorkspace.instance().rootWorkspace.uri.fsPath;
  if (!workspaceFolder) {
    return;
  }
  const filepath = path.join(workspaceFolder, ...filename.split("/"));
  // const dirname = path.dirname(filepath);
  // utils.ensureDirectoryExists(filepath);

  // if (!fs.existsSync(dirname)) {
  //   throw new Error(`Directory ${dirname} does not exist`);
  // }

  fs.writeFileSync(filepath, content);

  // if (syncCache) {
  //   await cacheWorkspace();
  // }

  return vscode.Uri.file(path.join(workspaceFolder, ...filename.split("/")));
};

// --- Pods

// suite("ConfigurePod", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let podsDir: string;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = FileTestUtils.tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("no config", function (done) {
//     onWSInit(async () => {
//       // await vscode.window.showTextDocument(uri);
//       podsDir = DendronWorkspace.instance().podsDir;
//       const pods = getAllExportPods();
//       const podClassEntry = pods[0];
//       const cmd = new ConfigurePodCommand();
//       cmd.gatherInputs = async () => ({
//         podClass: podClassEntry,
//       });
//       await cmd.run();
//       const configPath = getPodConfigPath(podsDir, podClassEntry);
//       assert.deepEqual(
//         VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
//         configPath
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {},
//     });
//   });

//   test("config present ", function (done) {
//     onWSInit(async () => {
//       podsDir = DendronWorkspace.instance().podsDir;
//       const pods = getAllExportPods();
//       const podClassEntry = pods[0];
//       const cmd = new ConfigurePodCommand();
//       const configPath = getPodConfigPath(podsDir, podClassEntry);
//       const exportDest = path.join(
//         getPodPath(podsDir, podClassEntry),
//         "export.json"
//       );
//       ensureDirSync(path.dirname(configPath));
//       writeYAML(configPath, { dest: exportDest } as ExportConfig);

//       cmd.gatherInputs = async () => ({
//         podClass: podClassEntry,
//       });
//       await cmd.run();
//       assert.deepEqual(
//         VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
//         configPath
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {},
//     });
//   });
// });

// suite("ExportPod", function () {
//   let root: DirResult;
//   let ctx: vscode.ExtensionContext;
//   let podsDir: string;
//   this.timeout(TIMEOUT);

//   beforeEach(function () {
//     root = FileTestUtils.tmpDir();
//     ctx = VSCodeUtils.getOrCreateMockContext();
//     DendronWorkspace.getOrCreate(ctx);
//   });

//   afterEach(function () {
//     HistoryService.instance().clearSubscriptions();
//   });

//   test("no config", function (done) {
//     onWSInit(async () => {
//       // await vscode.window.showTextDocument(uri);
//       podsDir = DendronWorkspace.instance().podsDir;
//       const pods = getAllExportPods();
//       const podClassEntry = pods[0];
//       const cmd = new ExportPodCommand();
//       cmd.gatherInputs = async () => ({
//         podChoice: podClassEntryToPodItem(podClassEntry),
//       });
//       await cmd.run();
//       const configPath = getPodConfigPath(podsDir, podClassEntry);
//       assert.deepEqual(
//         VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
//         configPath
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {},
//     });
//   });

//   test("config present, default", function (done) {
//     onWSInit(async () => {
//       podsDir = DendronWorkspace.instance().podsDir;
//       const pods = getAllExportPods();
//       const podClassEntry = pods[0];
//       const cmd = new ExportPodCommand();
//       const configPath = getPodConfigPath(podsDir, podClassEntry);
//       const exportDest = path.join(
//         getPodPath(podsDir, podClassEntry),
//         "export.json"
//       );
//       ensureDirSync(path.dirname(configPath));
//       writeYAML(configPath, { dest: exportDest } as ExportConfig);
//       cmd.gatherInputs = async () => ({
//         podChoice: podClassEntryToPodItem(podClassEntry),
//       });
//       await cmd.run();
//       const payload = fs.readJSONSync(exportDest);
//       assert.deepEqual(
//         NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] }),
//         [
//           { fname: "root", body: "\n" },
//           { fname: "bar", body: "bar body\n" },
//         ]
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {
//         NodeTestUtils.createNotes(path.join(root.name, "vault"), [
//           { fname: "foo", stub: true },
//           { fname: "bar" },
//         ]);
//       },
//     });
//   });

//   test("config present, default, include stubs", function (done) {
//     onWSInit(async () => {
//       podsDir = DendronWorkspace.instance().podsDir;
//       const pods = getAllExportPods();
//       const podClassEntry = pods[0];
//       const cmd = new ExportPodCommand();
//       const configPath = getPodConfigPath(podsDir, podClassEntry);
//       const exportDest = path.join(
//         getPodPath(podsDir, podClassEntry),
//         "export.json"
//       );
//       ensureDirSync(path.dirname(configPath));
//       writeYAML(configPath, {
//         dest: exportDest,
//         includeStubs: true,
//       } as ExportConfig);
//       cmd.gatherInputs = async () => ({
//         podChoice: podClassEntryToPodItem(podClassEntry),
//       });
//       await cmd.run();
//       const payload = fs.readJSONSync(exportDest);
//       assert.deepEqual(
//         NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] }),
//         [
//           { fname: "root", body: "\n" },
//           { fname: "bar", body: "bar body\n" },
//           { fname: "foo", body: "foo body\n" },
//         ]
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {
//         NodeTestUtils.createNotes(path.join(root.name, "vault"), [
//           { fname: "foo", stub: true },
//           { fname: "bar" },
//         ]);
//       },
//     });
//   });

//   test("config present, default, include stubs, no body", function (done) {
//     onWSInit(async () => {
//       podsDir = DendronWorkspace.instance().podsDir;
//       const pods = getAllExportPods();
//       const podClassEntry = pods[0];
//       const cmd = new ExportPodCommand();
//       const configPath = getPodConfigPath(podsDir, podClassEntry);
//       const exportDest = path.join(
//         getPodPath(podsDir, podClassEntry),
//         "export.json"
//       );
//       ensureDirSync(path.dirname(configPath));
//       writeYAML(configPath, {
//         dest: exportDest,
//         includeStubs: true,
//         includeBody: false,
//       } as ExportConfig);
//       cmd.gatherInputs = async () => ({
//         podChoice: podClassEntryToPodItem(podClassEntry),
//       });
//       await cmd.run();
//       const payload = fs.readJSONSync(exportDest);
//       assert.deepEqual(
//         NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] }),
//         [{ fname: "root" }, { fname: "bar" }, { fname: "foo" }]
//       );
//       done();
//     });

//     setupDendronWorkspace(root.name, ctx, {
//       useCb: async () => {
//         NodeTestUtils.createNotes(path.join(root.name, "vault"), [
//           { fname: "foo", stub: true },
//           { fname: "bar" },
//         ]);
//       },
//     });
//   });
// });
