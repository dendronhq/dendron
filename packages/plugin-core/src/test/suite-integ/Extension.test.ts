import {
  CONSTANTS,
  DendronConfig,
  InstallStatus,
  isNotUndefined,
  Time,
} from "@dendronhq/common-all";
import { readJSONWithCommentsSync, readYAML, tmpDir } from "@dendronhq/common-server";
import {
  getPortFilePath,
  getWSMetaFilePath,
  MetadataService,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import os from "os";
import fs from "fs-extra";
import _ from "lodash";
import { describe, it } from "mocha";
import path from "path";
import sinon, { SinonStub } from "sinon";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import {
  DEFAULT_LEGACY_VAULT_NAME,
  GLOBAL_STATE,
  WORKSPACE_ACTIVATION_CONTEXT,
} from "../../constants";
import * as telemetry from "../../telemetry";
import { DendronWorkspace, getWS, resolveRelToWSRoot } from "../../workspace";
import { BlankInitializer } from "../../workspace/blankInitializer";
import { TemplateInitializer } from "../../workspace/templateInitializer";
import { 
  checkAndApplyVimKeybindingOverrideIfExists,
  shouldDisplayLapsedUserMsg,
  _activate 
} from "../../_extension";
import {
  expect,
  genDefaultSettings,
  genEmptyWSFiles,
  resetCodeWorkspace,
} from "../testUtilsv2";
import {
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
  stubSetupWorkspace,
} from "../testUtilsV3";
import { VSCodeUtils } from "../../utils";

function mockUserConfigDir() {
  const dir = tmpDir().name;
  const getCodeUserConfigDurStub = sinon.stub(VSCodeUtils, "getCodeUserConfigDir");
  getCodeUserConfigDurStub.callsFake(() => {
    const wrappedMethod = getCodeUserConfigDurStub.wrappedMethod;
    const originalOut = wrappedMethod();
    return {
      userConfigDir: [dir, originalOut.delimiter].join(""),
      delimiter: originalOut.delimiter,
      osName: originalOut.osName,
    }
  });
  return getCodeUserConfigDurStub;
}

function lapsedMessageTest({
  done,
  firstInstall,
  firstWsInitialize,
  lapsedUserMsgSendTime,
  shouldDisplayMessage,
}: {
  done: Mocha.Done;
  firstInstall?: number;
  firstWsInitialize?: number;
  lapsedUserMsgSendTime?: number;
  shouldDisplayMessage: boolean;
}) {
  const svc = MetadataService.instance();
  svc.setMeta("firstInstall", firstInstall);
  svc.setMeta("firstWsInitialize", firstWsInitialize);
  svc.setMeta("lapsedUserMsgSendTime", lapsedUserMsgSendTime);
  expect(shouldDisplayLapsedUserMsg()).toEqual(shouldDisplayMessage);
  done();
}

suite("Extension", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;
  // let backupKeybindingConfigPath: any;
  // const { userConfigDir } = VSCodeUtils.getCodeUserConfigDir();
  // const keybindingConfigPath = [
  //   userConfigDir,
  //   "keybindings.json"
  // ].join("");

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
      homeDirStub = TestEngineUtils.mockHomeDir();
      userConfigDirStub = mockUserConfigDir();
      // if (!fs.existsSync(keybindingConfigPath)) {
      //   fs.ensureFileSync(keybindingConfigPath);
      //   fs.writeFileSync(keybindingConfigPath, "[]");
      // } else {
      //   backupKeybindingConfigPath = [
      //     userConfigDir,
      //     "keybindings.bak.json"
      //   ].join("");
      //   fs.copyFileSync(keybindingConfigPath, backupKeybindingConfigPath);
      // }
      // keybindings = readJSONWithCommentsSync(keybindingConfigPath);
    },
    afterHook: async () => {
      homeDirStub.restore();
      // fs.removeSync(keybindingConfigPath);
      // if (fs.existsSync(backupKeybindingConfigPath)) {
      //   fs.copyFileSync(backupKeybindingConfigPath, keybindingConfigPath);
      //   fs.removeSync(backupKeybindingConfigPath);
      // }
      userConfigDirStub.restore();
    },
    noSetInstallStatus: true,
  });

  describe("setup workspace", () => {
    it("not active", (done) => {
      _activate(ctx).then((resp) => {
        expect(resp).toBeFalsy();
        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeFalsy();
        done();
      });
    });

    it("not active, initial create ws", (done) => {
      const wsRoot = tmpDir().name;
      getWS()
        .updateGlobalState(
          GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
          WORKSPACE_ACTIVATION_CONTEXT.NORMAL
        )
        .then(() => {
          _activate(ctx).then(async () => {
            stubSetupWorkspace({
              wsRoot,
            });
            const cmd = new SetupWorkspaceCommand();
            await cmd.execute({
              rootDirRaw: wsRoot,
              skipOpenWs: true,
              skipConfirmation: true,
              workspaceInitializer: new BlankInitializer(),
            });

            const resp = readYAML(path.join(wsRoot, "dendron.yml"));
            expect(resp).toEqual({
              version: 1,
              vaults: [
                {
                  fsPath: "vault",
                },
              ],
              useFMTitle: true,
              useNoteTitleForLink: true,
              initializeRemoteVaults: true,
              journal: {
                addBehavior: "childOfDomain",
                dailyDomain: "daily",
                dateFormat: "y.MM.dd",
                name: "journal",
                firstDayOfWeek: 1,
              },
              scratch: {
                name: "scratch",
                dateFormat: "y.MM.dd.HHmmss",
                addBehavior: "asOwnDomain",
              },
              noAutoCreateOnDefinition: true,
              noLegacyNoteRef: true,
              noXVaultWikiLink: true,
              lookupConfirmVaultOnCreate: false,
              autoFoldFrontmatter: true,
              dev: {
                enablePreviewV2: true,
              },
              mermaid: true,
              useKatex: true,
              site: {
                copyAssets: true,
                siteHierarchies: ["root"],
                siteRootDir: "docs",
                usePrettyRefs: true,
                title: "Dendron",
                description: "Personal knowledge space",
                duplicateNoteBehavior: {
                  action: "useVault",
                  payload: ["vault"],
                },
              },
            } as DendronConfig);
            const dendronState = MetadataService.instance().getMeta();
            expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
            expect(isNotUndefined(dendronState.firstWsInitialize)).toBeTruthy();
            expect(
              fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
            ).toEqual(genEmptyWSFiles());
            done();
          });
        });
    });

    it("setup with template initializer", (done) => {
      const wsRoot = tmpDir().name;
      getWS()
        .updateGlobalState(
          GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
          WORKSPACE_ACTIVATION_CONTEXT.NORMAL
        )
        .then(() => {
          _activate(ctx).then(async () => {
            stubSetupWorkspace({
              wsRoot,
            });

            const cmd = new SetupWorkspaceCommand();
            await cmd.execute({
              rootDirRaw: wsRoot,
              skipOpenWs: true,
              skipConfirmation: true,
              workspaceInitializer: new TemplateInitializer(),
            } as SetupWorkspaceOpts);

            const resp = readYAML(path.join(wsRoot, "dendron.yml"));
            expect(resp).toContain({
              vaults: [
                {
                  fsPath: "templates",
                  name: "dendron.templates",
                  seed: "dendron.templates",
                },
                {
                  fsPath: "vault",
                },
              ],
              seeds: {
                "dendron.templates": {},
              },
            });
            const dendronState = MetadataService.instance().getMeta();
            expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
            expect(isNotUndefined(dendronState.firstWsInitialize)).toBeTruthy();
            expect(
              fs.readdirSync(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
            ).toEqual(genEmptyWSFiles());
            done();
          });
        });
    });

    it("ok", (done) => {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ wsRoot, vaults, engine }) => {
          // check for meta
          const port = getPortFilePath({ wsRoot });
          const fpath = getWSMetaFilePath({ wsRoot });
          const meta = openWSMetaFile({ fpath });
          expect(
            _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
          ).toBeTruthy();
          expect(meta.version).toEqual("0.0.1");
          expect(meta.activationTime < Time.now().toMillis()).toBeTruthy();
          expect(_.values(engine.notes).length).toEqual(1);
          const vault = resolveRelToWSRoot(vaults[0].fsPath);

          const settings = fs.readJSONSync(
            path.join(wsRoot, "dendron.code-workspace")
          );
          expect(settings).toEqual(genDefaultSettings());
          expect(fs.readdirSync(vault)).toEqual(
            [CONSTANTS.DENDRON_CACHE_FILE].concat(genEmptyWSFiles())
          );
          done();
        },
      });
    });
    it("ok: missing root.schema", (done) => {
      DendronWorkspace.version = () => "0.0.1";
      runLegacySingleWorkspaceTest({
        ctx,
        onInit: async ({ vaults }) => {
          const vault = resolveRelToWSRoot(vaults[0].fsPath);
          expect(fs.readdirSync(vault)).toEqual(
            [CONSTANTS.DENDRON_CACHE_FILE].concat(genEmptyWSFiles())
          );
          done();
        },
        postSetupHook: async ({ vaults }) => {
          fs.removeSync(
            path.join(resolveRelToWSRoot(vaults[0].fsPath), "root.schema.yml")
          );
        },
      });
    });
  });

  describe("telemetry", () => {
    test("can get VSCode telemetry settings", (done) => {
      // Just checking that we get some expected result, and that it doesn't just crash.
      const result = telemetry.isVSCodeTelemetryEnabled();
      expect(
        result === true || result === false || result === undefined
      ).toBeTruthy();
      done();
    });
  });

  describe("test conditions for displaying lapsed user message", () => {
    test("Workspace Not Initialized; Message Never Sent; > 1 Day ago", (done) => {
      lapsedMessageTest({ done, firstInstall: 1, shouldDisplayMessage: true });
    });

    test("Workspace Not Initialized; Message Never Sent; < 1 Day ago", (done) => {
      lapsedMessageTest({
        done,
        firstInstall: Time.now().toSeconds(),
        shouldDisplayMessage: false,
      });
    });

    test("Workspace Not Initialized; Message Sent < 1 week ago", (done) => {
      lapsedMessageTest({
        done,
        firstInstall: 1,
        lapsedUserMsgSendTime: Time.now().toSeconds(),
        shouldDisplayMessage: false,
      });
    });

    test("Workspace Not Initialized; Message Sent > 1 week ago", (done) => {
      lapsedMessageTest({
        done,
        firstInstall: 1,
        lapsedUserMsgSendTime: 1,
        shouldDisplayMessage: true,
      });
    });

    test("Workspace Already Initialized", (done) => {
      lapsedMessageTest({
        done,
        firstInstall: 1,
        firstWsInitialize: 1,
        shouldDisplayMessage: false,
      });
    });
  });

  describe("keyboard shortcut conflict resolution", () => {
    test("vim extension expandLineSelection override", (done) => {
      const { newKeybindings } = checkAndApplyVimKeybindingOverrideIfExists();
      const override = newKeybindings[newKeybindings.length-1];
      const metaKey = os.type() === "Darwin" ? "cmd" : "ctrl";
      expect(override).toEqual({
        "key": `${metaKey}+l`,
        "command": "-expandLineSelection",
        "when": "textInputFocus"
      },)
      done();
    });

    // this test only works if you don't pass --disable-extensions when testing.
    test("with vim extension installed, resolve keyboard shortcut conflict.", (done) => {
      const wsRoot = tmpDir().name;
      getWS()
        .updateGlobalState(
          GLOBAL_STATE.WORKSPACE_ACTIVATION_CONTEXT,
          WORKSPACE_ACTIVATION_CONTEXT.NORMAL
        )
        .then(() => {
          _activate(ctx).then(async () => {
            stubSetupWorkspace({
              wsRoot,
            });
            sinon.stub(VSCodeUtils, "getInstallStatusForExtension").returns(InstallStatus.INITIAL_INSTALL);
            // somehow stub is ignored if --disable-extensions is passed during the test.
            sinon.stub(VSCodeUtils, "isExtensionInstalled").returns(true);
            const cmd = new SetupWorkspaceCommand();
            await cmd.execute({
              rootDirRaw: wsRoot,
              skipOpenWs: true,
              skipConfirmation: true,
              workspaceInitializer: new BlankInitializer(),
            });

            const dendronState = MetadataService.instance().getMeta();
            expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
            expect(isNotUndefined(dendronState.firstWsInitialize)).toBeTruthy();

            const { userConfigDir } = VSCodeUtils.getCodeUserConfigDir();
            const keybindingConfigPath = [
              userConfigDir,
              "keybindings.json",
            ].join("");

            const newKeybindings = readJSONWithCommentsSync(keybindingConfigPath);
            const override = newKeybindings[newKeybindings.length-1];
            const metaKey = os.type() === "Darwin" ? "cmd" : "ctrl";
            expect(override.key).toEqual(`${metaKey}+l`);
            expect(override.command).toEqual("-expandLineSelection");

            done();
          });
        });
    });
  });
});
