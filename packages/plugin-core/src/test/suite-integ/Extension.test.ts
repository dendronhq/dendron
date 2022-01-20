import {
  ConfigUtils,
  CONSTANTS,
  InstallStatus,
  isNotUndefined,
  Time,
  VaultUtils,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  readJSONWithCommentsSync,
  readYAML,
  tmpDir,
  writeJSONWithComments,
  writeYAML,
} from "@dendronhq/common-server";
import { toPlainObject } from "@dendronhq/common-test-utils";
import {
  EngineUtils,
  getWSMetaFilePath,
  MetadataService,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe, beforeEach, it, afterEach } from "mocha";
import os from "os";
import path from "path";
import sinon, { SinonStub } from "sinon";
import { ExtensionContext, window } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import {
  DEFAULT_LEGACY_VAULT_NAME,
  WORKSPACE_ACTIVATION_CONTEXT,
} from "../../constants";
import { StateService } from "../../services/stateService";
import * as telemetry from "../../telemetry";
import { KeybindingUtils } from "../../KeybindingUtils";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";
import { BlankInitializer } from "../../workspace/blankInitializer";
import { TemplateInitializer } from "../../workspace/templateInitializer";
import {
  shouldDisplayInactiveUserSurvey,
  shouldDisplayLapsedUserMsg,
  _activate,
} from "../../_extension";
import {
  cleanupVSCodeContextSubscriptions,
  expect,
  genDefaultSettings,
  genEmptyWSFiles,
  resetCodeWorkspace,
} from "../testUtilsv2";
import {
  describeMultiWS,
  runLegacySingleWorkspaceTest,
  runTestButSkipForWindows,
  setupBeforeAfter,
  stubSetupWorkspace,
} from "../testUtilsV3";
import semver from "semver";
import * as vscode from "vscode";
import { AnalyticsUtils } from "../../utils/analytics";

function mockUserConfigDir() {
  const dir = tmpDir().name;
  const getCodeUserConfigDurStub = sinon.stub(
    VSCodeUtils,
    "getCodeUserConfigDir"
  );
  getCodeUserConfigDurStub.callsFake(() => {
    const wrappedMethod = getCodeUserConfigDurStub.wrappedMethod;
    const originalOut = wrappedMethod();
    return {
      userConfigDir: [dir, originalOut.delimiter].join(""),
      delimiter: originalOut.delimiter,
      osName: originalOut.osName,
    };
  });
  return getCodeUserConfigDurStub;
}

function lapsedMessageTest({
  done,
  firstInstall,
  firstWsInitialize,
  lapsedUserMsgSendTime,
  shouldDisplayMessage,
  workspaceActivated = false,
}: {
  done: Mocha.Done;
  firstInstall?: number;
  firstWsInitialize?: number;
  lapsedUserMsgSendTime?: number;
  workspaceActivated?: boolean;
  shouldDisplayMessage: boolean;
}) {
  const svc = MetadataService.instance();
  svc.setMeta("firstInstall", firstInstall);
  svc.setMeta("firstWsInitialize", firstWsInitialize);
  svc.setMeta("lapsedUserMsgSendTime", lapsedUserMsgSendTime);
  svc.setMeta("dendronWorkspaceActivated", workspaceActivated);
  expect(shouldDisplayLapsedUserMsg()).toEqual(shouldDisplayMessage);
  done();
}

async function inactiveMessageTest(opts: {
  done: Mocha.Done;
  firstInstall?: number;
  firstWsInitialize?: number;
  inactiveUserMsgSendTime?: number;
  workspaceActivated?: boolean;
  firstLookupTime?: number;
  lastLookupTime?: number;
  state: string | undefined;
  shouldDisplayMessage: boolean;
}) {
  const {
    done,
    firstInstall,
    firstWsInitialize,
    inactiveUserMsgSendTime,
    shouldDisplayMessage,
    firstLookupTime,
    lastLookupTime,
    state,
    workspaceActivated,
  } = opts;
  const svc = MetadataService.instance();
  sinon
    .stub(StateService.instance(), "getGlobalState")
    .resolves(_.isUndefined(state) ? undefined : state);

  svc.setMeta("firstInstall", firstInstall);
  svc.setMeta("firstWsInitialize", firstWsInitialize);
  svc.setMeta("inactiveUserMsgSendTime", inactiveUserMsgSendTime);
  svc.setMeta("dendronWorkspaceActivated", workspaceActivated);
  svc.setMeta("firstLookupTime", firstLookupTime);
  svc.setMeta("lastLookupTime", lastLookupTime);
  const expected = await shouldDisplayInactiveUserSurvey();
  expect(expected).toEqual(shouldDisplayMessage);
  sinon.restore();
  done();
}

function stubWSFolders(wsRoot: string | undefined) {
  if (wsRoot === undefined) {
    const stub = sinon
      .stub(vscode.workspace, "workspaceFolders")
      .value(undefined);
    DendronExtension.workspaceFolders = () => undefined;
    return stub;
  }
  const wsFolders = [
    {
      name: "root",
      index: 0,
      uri: vscode.Uri.parse(wsRoot),
    },
  ];
  const stub = sinon
    .stub(vscode.workspace, "workspaceFolders")
    .value(wsFolders);
  DendronExtension.workspaceFolders = () => wsFolders;
  return stub;
}

suite("Extension", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;
  let wsFoldersStub: SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      // Required for StateService Singleton Init at the moment.
      // eslint-disable-next-line no-new
      new StateService({
        globalState: ctx.globalState,
        workspaceState: ctx.workspaceState,
      });
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
      homeDirStub = TestEngineUtils.mockHomeDir();
      userConfigDirStub = mockUserConfigDir();
      wsFoldersStub = stubWSFolders(undefined);
    },
    afterHook: async () => {
      homeDirStub.restore();
      userConfigDirStub.restore();
      wsFoldersStub.restore();
    },
    noSetInstallStatus: true,
  });

  // TODO: This test case fails in Windows if the logic in setupBeforeAfter (stubs) is not there. Look into why that is the case
  describeMultiWS(
    "WHEN command is gathering inputs",
    {
      ctx,
    },
    () => {
      let showOpenDialog: sinon.SinonStub;

      beforeEach(async () => {
        const cmd = new SetupWorkspaceCommand();
        showOpenDialog = sinon.stub(window, "showOpenDialog");
        await cmd.gatherInputs();
      });
      afterEach(() => {
        showOpenDialog.restore();
      });

      test("THEN file picker is opened", (done) => {
        expect(showOpenDialog.calledOnce).toBeTruthy();
        done();
      });
    }
  );

  describe("setup CODE workspace", () => {
    afterEach(() => {
      cleanupVSCodeContextSubscriptions(ctx);
    });

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

      StateService.instance().setActivationContext(
        WORKSPACE_ACTIVATION_CONTEXT.NORMAL
      );

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
          version: 4,
          useFMTitle: true,
          useNoteTitleForLink: true,
          mermaid: true,
          useKatex: true,
          dev: {
            enablePreviewV2: true,
          },
          site: {
            copyAssets: true,
            siteHierarchies: ["root"],
            siteRootDir: "docs",
            usePrettyRefs: true,
            title: "Dendron",
            description: "Personal knowledge space",
            siteLastModified: true,
            gh_edit_branch: "main",
            duplicateNoteBehavior: {
              action: "useVault",
              payload: ["vault"],
            },
          },
          commands: {
            lookup: {
              note: {
                selectionMode: "extract",
                confirmVaultOnCreate: true,
                vaultSelectionModeOnCreate: "smart",
                leaveTrace: false,
                bubbleUpCreateNew: true,
                fuzzThreshold: 0.2,
              },
            },
            randomNote: {},
            insertNote: {
              initialValue: "templates",
            },
            insertNoteLink: {
              aliasMode: "none",
              enableMultiSelect: false,
            },
            insertNoteIndex: {
              enableMarker: false,
            },
          },
          workspace: {
            vaults: [{ fsPath: "vault" }],
            journal: {
              dailyDomain: "daily",
              name: "journal",
              dateFormat: "y.MM.dd",
              addBehavior: "childOfDomain",
            },
            scratch: {
              name: "scratch",
              dateFormat: "y.MM.dd.HHmmss",
              addBehavior: "asOwnDomain",
            },
            task: {
              addBehavior: "childOfCurrent",
              dateFormat: "",
              name: "",
              prioritySymbols: {
                H: "high",
                L: "low",
                M: "medium",
              },
              statusSymbols: {
                "": " ",
                assigned: "a",
                blocked: "b",
                delegated: "l",
                done: "x",
                dropped: "d",
                moved: "m",
                pending: "y",
                wip: "w",
              },
              createTaskSelectionType: "selection2link",
              todoIntegration: false,
            },
            graph: {
              zoomSpeed: 1,
            },
            enableAutoCreateOnDefinition: false,
            enableXVaultWikiLink: false,
            enableRemoteVaultInit: true,
            workspaceVaultSyncMode: "noCommit",
            enableAutoFoldFrontmatter: false,
            enableEditorDecorations: true,
            enableHashTags: true,
            enableUserTags: true,
            maxPreviewsCached: 10,
            maxNoteLength: 204800,
          },
          preview: {
            enableFMTitle: true,
            enableNoteTitleForLink: true,
            enableMermaid: true,
            enablePrettyRefs: true,
            enableKatex: true,
            automaticallyShowPreview: false,
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

      it("setup with template initializer", (done) => {
        const wsRoot = tmpDir().name;
        StateService.instance().setActivationContext(
          WORKSPACE_ACTIVATION_CONTEXT.NORMAL
        );
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

      it("ok", (done) => {
        DendronExtension.version = () => "0.0.1";
        runLegacySingleWorkspaceTest({
          ctx,
          onInit: async ({ wsRoot, vaults, engine }) => {
            // check for meta
            const port = EngineUtils.getPortFilePathForWorkspace({ wsRoot });
            const fpath = getWSMetaFilePath({ wsRoot });
            const meta = openWSMetaFile({ fpath });
            expect(
              _.toInteger(fs.readFileSync(port, { encoding: "utf8" })) > 0
            ).toBeTruthy();
            expect(meta.version).toEqual("0.0.1");
            expect(meta.activationTime < Time.now().toMillis()).toBeTruthy();
            expect(_.values(engine.notes).length).toEqual(1);
            const vault = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));

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
        DendronExtension.version = () => "0.0.1";
        runLegacySingleWorkspaceTest({
          ctx,
          onInit: async ({ vaults, wsRoot }) => {
            const vault = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
            expect(fs.readdirSync(vault)).toEqual(
              [CONSTANTS.DENDRON_CACHE_FILE].concat(genEmptyWSFiles())
            );
            done();
          },
          postSetupHook: async ({ vaults, wsRoot }) => {
            const vault = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
            fs.removeSync(path.join(vault, "root.schema.yml"));
          },
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
          lapsedMessageTest({
            done,
            firstInstall: 1,
            shouldDisplayMessage: true,
          });
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

      describe("firstWeekSinceInstall", () => {
        describe("GIVEN first week", () => {
          test("THEN isFirstWeek is true", (done) => {
            const svc = MetadataService.instance();
            svc.setInitialInstall();

            const actual = AnalyticsUtils.isFirstWeek();
            expect(actual).toBeTruthy();
            done();
          });
        });
        describe("GIVEN not first week", () => {
          test("THEN isFirstWeek is false", (done) => {
            const svc = MetadataService.instance();
            const ONE_WEEK = 604800;
            const NOW = Time.now().toSeconds();
            const TWO_WEEKS_BEFORE = NOW - 2 * ONE_WEEK;
            svc.setMeta("firstInstall", TWO_WEEKS_BEFORE);

            const actual = AnalyticsUtils.isFirstWeek();
            expect(actual).toBeFalsy();
            done();
          });
        });
      });

      describe("shouldDisplayInactiveUserSurvey", () => {
        const ONE_WEEK = 604800;
        const NOW = Time.now().toSeconds();
        const ONE_WEEK_BEFORE = NOW - ONE_WEEK;
        const TWO_WEEKS_BEFORE = NOW - 2 * ONE_WEEK;
        const THREE_WEEKS_BEFORE = NOW - 3 * ONE_WEEK;
        const FOUR_WEEKS_BEFORE = NOW - 4 * ONE_WEEK;
        const FIVE_WEEKS_BEFORE = NOW - 5 * ONE_WEEK;
        describe("GIVEN not prompted yet", () => {
          describe("WHEN is first week active user AND inactive for less than two weeks", () => {
            test("THEN should not display inactive user survey", (done) => {
              inactiveMessageTest({
                done,
                firstInstall: ONE_WEEK_BEFORE,
                firstWsInitialize: ONE_WEEK_BEFORE,
                firstLookupTime: ONE_WEEK_BEFORE,
                lastLookupTime: ONE_WEEK_BEFORE,
                workspaceActivated: true,
                state: undefined,
                shouldDisplayMessage: false,
              });
            });
          });
          describe("WHEN is first week active user AND inactive for at two weeks", () => {
            test("THEN should display inactive user survey", (done) => {
              inactiveMessageTest({
                done,
                firstInstall: THREE_WEEKS_BEFORE,
                firstWsInitialize: THREE_WEEKS_BEFORE,
                firstLookupTime: THREE_WEEKS_BEFORE,
                lastLookupTime: TWO_WEEKS_BEFORE,
                workspaceActivated: true,
                state: undefined,
                shouldDisplayMessage: true,
              });
            });
          });
        });
        describe("GIVEN already prompted", () => {
          describe("WHEN user has submitted", () => {
            test("THEN should never display inactive user survey", (done) => {
              inactiveMessageTest({
                done,
                firstInstall: FIVE_WEEKS_BEFORE,
                firstWsInitialize: FIVE_WEEKS_BEFORE,
                firstLookupTime: FIVE_WEEKS_BEFORE,
                lastLookupTime: FOUR_WEEKS_BEFORE,
                inactiveUserMsgSendTime: TWO_WEEKS_BEFORE,
                workspaceActivated: true,
                state: "submitted",
                shouldDisplayMessage: false,
              });
            });
          });
          describe("WHEN it has been another two weeks since user rejected survey", () => {
            test("THEN should display inactive user survey", (done) => {
              inactiveMessageTest({
                done,
                firstInstall: FIVE_WEEKS_BEFORE,
                firstWsInitialize: FIVE_WEEKS_BEFORE,
                firstLookupTime: FIVE_WEEKS_BEFORE,
                lastLookupTime: FOUR_WEEKS_BEFORE,
                inactiveUserMsgSendTime: TWO_WEEKS_BEFORE,
                workspaceActivated: true,
                state: "cancelled",
                shouldDisplayMessage: true,
              });
            });
          });
          describe("WHEN it hasn't been another two weeks since rejected prompt", () => {
            test("THEN should not display inactive user survey", (done) => {
              inactiveMessageTest({
                done,
                firstInstall: FIVE_WEEKS_BEFORE,
                firstWsInitialize: FIVE_WEEKS_BEFORE,
                firstLookupTime: FIVE_WEEKS_BEFORE,
                lastLookupTime: FOUR_WEEKS_BEFORE,
                inactiveUserMsgSendTime: ONE_WEEK_BEFORE,
                workspaceActivated: true,
                state: "cancelled",
                shouldDisplayMessage: false,
              });
            });
          });
        });
      });
    });
  });

  describe("setup NATIVE workspace", () => {
    afterEach(() => {
      cleanupVSCodeContextSubscriptions(ctx);
    });

    it("not active, initial create ws", (done) => {
      const wsRoot = tmpDir().name;

      StateService.instance().setActivationContext(
        WORKSPACE_ACTIVATION_CONTEXT.NORMAL
      );

      _activate(ctx).then(async () => {
        stubSetupWorkspace({
          wsRoot,
        });
        const cmd = new SetupWorkspaceCommand();
        await cmd.execute({
          workspaceType: WorkspaceType.NATIVE,
          rootDirRaw: wsRoot,
          skipOpenWs: true,
          skipConfirmation: true,
          workspaceInitializer: new BlankInitializer(),
        });
        expect(
          fs.pathExistsSync(path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE))
        ).toBeTruthy();
        expect(
          fs.pathExistsSync(path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME))
        ).toBeFalsy();
        done();
      });
    });
  });
});

// These tests run on Windows too actually, but fail on the CI. Skipping for now.
suite("GIVEN a native workspace", function () {
  runTestButSkipForWindows()("AND `dendron.yml` is nested in a folder", () => {
    let homeDirStub: SinonStub;
    let userConfigDirStub: SinonStub;
    let wsFoldersStub: SinonStub;
    const ctx: ExtensionContext = setupBeforeAfter(this, {
      beforeHook: async () => {
        // Required for StateService Singleton Init at the moment.
        // eslint-disable-next-line no-new
        new StateService({
          globalState: ctx.globalState,
          workspaceState: ctx.workspaceState,
        });
        await resetCodeWorkspace();
        await new ResetConfigCommand().execute({ scope: "all" });
        homeDirStub = TestEngineUtils.mockHomeDir();
        userConfigDirStub = mockUserConfigDir();
        const wsRoot = tmpDir().name;
        const docsRoot = path.join(wsRoot, "docs");
        await fs.ensureDir(docsRoot);
        // Initializing with the wsRoot, but `dendron.yml` is under `wsRoot/docs` like it may be in some native workspace setups
        writeYAML(
          path.join(docsRoot, CONSTANTS.DENDRON_CONFIG_FILE),
          ConfigUtils.genDefaultConfig()
        );
        wsFoldersStub = stubWSFolders(wsRoot);
      },
      afterHook: async () => {
        homeDirStub.restore();
        userConfigDirStub.restore();
        wsFoldersStub.restore();
      },
      noSetInstallStatus: true,
    });

    test("THEN it activates correctly", (done) => {
      _activate(ctx).then((resp) => {
        expect(resp).toBeTruthy();
        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeFalsy();
        done();
      });
    });
  });

  runTestButSkipForWindows()("AND `dendron.yml` is in the root", () => {
    let homeDirStub: SinonStub;
    let userConfigDirStub: SinonStub;
    let wsFoldersStub: SinonStub;
    const ctx: ExtensionContext = setupBeforeAfter(this, {
      beforeHook: async () => {
        // Required for StateService Singleton Init at the moment.
        // eslint-disable-next-line no-new
        new StateService({
          globalState: ctx.globalState,
          workspaceState: ctx.workspaceState,
        });
        await resetCodeWorkspace();
        await new ResetConfigCommand().execute({ scope: "all" });
        homeDirStub = TestEngineUtils.mockHomeDir();
        userConfigDirStub = mockUserConfigDir();
        const wsRoot = tmpDir().name;
        writeYAML(
          path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE),
          ConfigUtils.genDefaultConfig()
        );
        wsFoldersStub = stubWSFolders(wsRoot);
      },
      afterHook: async () => {
        homeDirStub.restore();
        userConfigDirStub.restore();
        wsFoldersStub.restore();
      },
      noSetInstallStatus: true,
    });

    test("THEN it activates correctly", (done) => {
      _activate(ctx).then((resp) => {
        expect(resp).toBeTruthy();
        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeFalsy();
        done();
      });
    });
  });
});

suite("keybindings", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async (ctx) => {
      new StateService(ctx);
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
      homeDirStub = TestEngineUtils.mockHomeDir();
      userConfigDirStub = mockUserConfigDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
      userConfigDirStub.restore();
    },
    noSetInstallStatus: true,
  });

  describe("keyboard shortcut conflict resolution", () => {
    test("vim extension expandLineSelection override", (done) => {
      const { keybindingConfigPath } =
        KeybindingUtils.getKeybindingConfigPath();
      fs.ensureFileSync(keybindingConfigPath);
      const config = `// This is my awesome Dendron Keybinding
      [
        { // look up note to the side
          "key": "ctrl+k l",
          "command": "dendron.lookupNote",
          "args": {
            "splitType": "horizontal"
          }
        }
      ]`;
      fs.writeFileSync(keybindingConfigPath, config);
      const existingConfig = readJSONWithCommentsSync(keybindingConfigPath);
      const beforeAllSymbol = Object.getOwnPropertySymbols(existingConfig)[0];
      const beforeKeySymbol = Object.getOwnPropertySymbols(
        existingConfig[0]
      )[0];
      const { newKeybindings } =
        KeybindingUtils.checkAndApplyVimKeybindingOverrideIfExists();
      const override = newKeybindings[1];
      expect(_.isArray(newKeybindings)).toBeTruthy();
      // override config exists after migration
      expect(override).toEqual({
        key: `ctrl+l`,
        command: "-extension.vim_navigateCtrlL",
      });

      // existing comments are preserved
      expect(Object.getOwnPropertySymbols(newKeybindings)[0]).toEqual(
        beforeAllSymbol
      );
      expect(Object.getOwnPropertySymbols(newKeybindings[0])[0]).toEqual(
        beforeKeySymbol
      );
      done();
    });

    // this test only works if you don't pass --disable-extensions when testing.
    test.skip("with vim extension installed, resolve keyboard shortcut conflict.", (done) => {
      const wsRoot = tmpDir().name;
      StateService.instance().setActivationContext(
        WORKSPACE_ACTIVATION_CONTEXT.NORMAL
      );

      _activate(ctx).then(async () => {
        stubSetupWorkspace({
          wsRoot,
        });
        sinon
          .stub(VSCodeUtils, "getInstallStatusForExtension")
          .returns(InstallStatus.INITIAL_INSTALL);
        // somehow stub is ignored if --disable-extensions is passed during the test.
        sinon.stub(VSCodeUtils, "isExtensionInstalled").returns(true);
        const cmd = new SetupWorkspaceCommand();
        await cmd.execute({
          rootDirRaw: wsRoot,
          skipOpenWs: true,
          skipConfirmation: true,
          workspaceInitializer: new BlankInitializer(),
        });

        _activate(ctx).then(async () => {
          stubSetupWorkspace({
            wsRoot,
          });
          sinon
            .stub(VSCodeUtils, "getInstallStatusForExtension")
            .returns(InstallStatus.INITIAL_INSTALL);
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
          const keybindingConfigPath = [userConfigDir, "keybindings.json"].join(
            ""
          );

          const newKeybindings = readJSONWithCommentsSync(keybindingConfigPath);
          const override = newKeybindings[newKeybindings.length - 1];
          const metaKey = os.type() === "Darwin" ? "cmd" : "ctrl";
          expect(override.key).toEqual(`${metaKey}+l`);
          expect(override.command).toEqual("-expandLineSelection");

          done();
        });
      });

      describe("keyboard shortcut migration", () => {
        test("lookup v2 to v3 migration, nothing happens", (done) => {
          const { migratedKeybindings } =
            KeybindingUtils.checkAndMigrateLookupKeybindingIfExists();
          expect(_.isUndefined(migratedKeybindings)).toBeTruthy();
          done();
        });

        test("lookup v2 to v3 migration", (done) => {
          const { keybindingConfigPath } =
            KeybindingUtils.getKeybindingConfigPath();
          const metaKey = os.type() === "Darwin" ? "cmd" : "ctrl";
          fs.ensureFileSync(keybindingConfigPath);
          const startingConfig = `// My awesome Dendron Config
      [
        { // disable delete node keybinding
          "key": "shift+${metaKey}+d",
          "command": "-dendron.deleteNode",
          "when": "dendron:pluginActive"
        },
        { // super specific lookup
          "key": "${metaKey}+k l",
          "command": "dendron.lookup",
          "args": {
            /* arg-comment-0 */ 
            // arg-comment-1
            "flavor": "note", // arg-comment-2
            // arg-comment-3
            "noteExistBehavior": "open", // arg-comment-4
            // arg-comment-5
            "filterType": "directChildOnly", // arg-comment-6
            // arg-comment-7
            "value": "foo", // arg-comment-8
            // arg-comment-9
            "effectType": "multiSelect" // arg-comment-10
            // arg-comment-11
          }
        },
        {
          "key": "${metaKey}+k shift+l",
          "command": "dendron.lookup",
          "args": {
            // arg-comment-12
            "effectType": "copyNoteLink", // arg-comment-13
            // arg-comment-14
          }
        },
        {
          "key": "${metaKey}+l",
          "command": "-dendron.lookup",
        },
        {
          "key": "${metaKey}+l",
          "command": "dendron.lookup",
          "args": {
            "splitType": "horizontal",
            "selectionType": "selectionExtract",
            "noConfirm": true,
            "vaultSelectionMode": 2,
          }
        }
      ]`;
          fs.writeFileSync(keybindingConfigPath, startingConfig);
          const { migratedKeybindings } =
            KeybindingUtils.checkAndMigrateLookupKeybindingIfExists();
          expect(toPlainObject(migratedKeybindings)).toEqual([
            // leaves non-lookup keybinding as is
            {
              key: `shift+${metaKey}+d`,
              command: "-dendron.deleteNode",
              when: "dendron:pluginActive",
            },
            // migrate to new args
            {
              key: `${metaKey}+k l`,
              command: "dendron.lookupNote",
              args: {
                filterMiddleware: ["directChildOnly"],
                initialValue: "foo",
                multiSelect: true,
              },
            },
            {
              key: `${metaKey}+k shift+l`,
              command: "dendron.lookupNote",
              args: {
                copyNoteLink: true,
              },
            },
            // migrates keybinding overrides
            {
              key: `${metaKey}+l`,
              command: "-dendron.lookupNote",
            },
            // leaves keys that don't change as is
            {
              key: `${metaKey}+l`,
              command: "dendron.lookupNote",
              args: {
                splitType: "horizontal",
                selectionType: "selectionExtract",
                noConfirm: true,
                vaultSelectionMode: 2,
              },
            },
          ]);
          writeJSONWithComments(keybindingConfigPath, migratedKeybindings);
          done();
        });

        test("does nothing on extension activate if not necessary", (done) => {
          const wsRoot = tmpDir().name;
          const { userConfigDir } = VSCodeUtils.getCodeUserConfigDir();
          const keybindingConfigPath = [userConfigDir, "keybindings.json"].join(
            ""
          );
          expect(fs.existsSync(keybindingConfigPath)).toBeFalsy();

          StateService.instance().setActivationContext(
            WORKSPACE_ACTIVATION_CONTEXT.NORMAL
          );
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
            expect(fs.existsSync(keybindingConfigPath)).toBeFalsy();

            done();
          });
        });

        test("v2 to v3 migration happens on extension activation only on upgrade", (done) => {
          const wsRoot = tmpDir().name;
          const metaKey = os.type() === "Darwin" ? "cmd" : "ctrl";
          const { userConfigDir } = VSCodeUtils.getCodeUserConfigDir();
          const keybindingConfigPath = [userConfigDir, "keybindings.json"].join(
            ""
          );
          fs.ensureFileSync(keybindingConfigPath);
          const config = `// This is my awesome Dendron keybinding
      [
        { // lookup disable
          "key": "${metaKey}+l",
          "command": "-dendron.lookup",
        },
        { // lookup with args
          "key": "${metaKey}+l",
          "command": "dendron.lookup",
          "args": {
            "effectType": "copyNoteLink"
          }
        }
      ]`;
          fs.writeFileSync(keybindingConfigPath, config);
          sinon
            .stub(VSCodeUtils, "getInstallStatusForExtension")
            .returns(InstallStatus.UPGRADED);
          StateService.instance().setActivationContext(
            WORKSPACE_ACTIVATION_CONTEXT.NORMAL
          );
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

            const migratedKeybindings =
              readJSONWithCommentsSync(keybindingConfigPath);
            expect(toPlainObject(migratedKeybindings)).toEqual([
              {
                key: `${metaKey}+l`,
                command: "-dendron.lookupNote",
              },
              {
                key: `${metaKey}+l`,
                command: "dendron.lookupNote",
                args: {
                  // copy note link by default!
                  copyNoteLink: true,
                },
              },
            ]);
            // simple comments are preserved
            expect(
              Object.getOwnPropertySymbols(migratedKeybindings).length
            ).toEqual(1);
            expect(
              Object.getOwnPropertySymbols(migratedKeybindings[0]).length
            ).toEqual(1);
            expect(
              Object.getOwnPropertySymbols(migratedKeybindings[1]).length
            ).toEqual(1);

            // old file is backed up
            expect(fs.existsSync(`${keybindingConfigPath}.old`)).toBeTruthy();

            done();
          });
        });
      });
    });
  });
});

suite(
  "temporary testing of Dendron version compatibility downgrade sequence",
  () => {
    describe(`GIVEN the activation sequence of Dendron`, () => {
      describe(`WHEN VS Code Version is up to date`, () => {
        let invokedWorkspaceTrustFn: boolean = false;

        beforeEach(() => {
          invokedWorkspaceTrustFn = semver.gte(vscode.version, "1.57.0");
        });

        it(`THEN onDidGrantWorkspaceTrust will get invoked.`, () => {
          expect(invokedWorkspaceTrustFn).toEqual(true);
        });

        it(`AND onDidGrantWorkspaceTrust can be found in the API.`, () => {
          vscode.workspace.onDidGrantWorkspaceTrust(() => {
            //no-op for testing
          });
        });
      });

      describe(`WHEN VS Code Version is on a version less than 1.57.0`, () => {
        let invokedWorkspaceTrustFn: boolean = false;
        const userVersion = "1.56.1";
        beforeEach(() => {
          invokedWorkspaceTrustFn = semver.gte(userVersion, "1.57.0");
        });

        it(`THEN onDidGrantWorkspaceTrust will not get invoked.`, () => {
          expect(invokedWorkspaceTrustFn).toEqual(false);
        });
      });
    });
  }
);

// suite("per-init config migration logic", function () {
//   let homeDirStub: SinonStub;

//   const ctx: ExtensionContext = setupBeforeAfter(this, {
//     beforeHook: async (ctx) => {
//       new StateService(ctx);
//       await resetCodeWorkspace();
//       await new ResetConfigCommand().execute({ scope: "all" });
//       homeDirStub = TestEngineUtils.mockHomeDir();
//     },
//     afterHook: async () => {
//       homeDirStub.restore();
//     },
//     noSetInstallStatus: true,
//   });

//   describeMultiWS(
//     "GIVEN: current version is less than 0.70.0 and config is legacy",
//     {
//       ctx,
//       modConfigCb: (config) => {
//         config.version = 3;
//         return config;
//       },
//       preSetupHook: async ({ wsRoot, vaults }) => {
//         DendronExtension.version = () => "0.69.0";
//         ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
//       },
//     },
//     () => {
//       test("THEN: config migration is not forced on init", (done) => {
//         const ws = getDWorkspace();
//         const config = ws.config;
//         expect(config.version).toEqual(3);

//         const allWSRootFiles = fs.readdirSync(ws.wsRoot, {
//           withFileTypes: true,
//         });
//         const maybeBackupFile = allWSRootFiles
//           .filter((ent) => ent.isFile())
//           .filter((fileEnt) => fileEnt.name.includes("migrate-config"));
//         expect(maybeBackupFile.length === 0).toBeTruthy();
//         done();
//       });
//     }
//   );

//   describeMultiWS(
//     "GIVEN: current version is 0.70.0 and config is legacy",
//     {
//       ctx,
//       modConfigCb: (config) => {
//         config.version = 3;
//         return config;
//       },
//       preSetupHook: async ({ wsRoot, vaults }) => {
//         DendronExtension.version = () => "0.70.0";
//         ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
//       },
//     },
//     () => {
//       test("THEN: config migration is forced on init", (done) => {
//         const ws = getDWorkspace();
//         const config = ws.config;
//         expect(config.version).toEqual(4);

//         const allWSRootFiles = fs.readdirSync(ws.wsRoot, {
//           withFileTypes: true,
//         });
//         const maybeBackupFileName = allWSRootFiles
//           .filter((ent) => ent.isFile())
//           .filter((fileEnt) => fileEnt.name.includes("migrate-config"))[0].name;
//         expect(!_.isUndefined(maybeBackupFileName)).toBeTruthy();
//         done();
//       });
//     }
//   );

//   describeMultiWS(
//     "GIVEN: current version is 0.70.0 and config is not legacy",
//     {
//       ctx,
//       modConfigCb: (config) => {
//         config.version = 4;
//         return config;
//       },
//       preSetupHook: async ({ wsRoot, vaults }) => {
//         DendronExtension.version = () => "0.70.0";
//         ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
//       },
//     },
//     () => {
//       test("THEN: config migration is not forced on init", (done) => {
//         const ws = getDWorkspace();
//         const config = ws.config;
//         expect(config.version).toEqual(4);

//         const allWSRootFiles = fs.readdirSync(ws.wsRoot, {
//           withFileTypes: true,
//         });
//         const maybeBackupFiles = allWSRootFiles
//           .filter((ent) => ent.isFile())
//           .filter((fileEnt) => fileEnt.name.includes("migrate-config"));

//         expect(maybeBackupFiles.length === 0).toBeTruthy();
//         done();
//       });
//     }
//   );

//   describeMultiWS(
//     "GIVEN: current version is larger than 0.70.0 and config is legacy",
//     {
//       ctx,
//       modConfigCb: (config) => {
//         config.version = 3;
//         return config;
//       },
//       preSetupHook: async ({ wsRoot, vaults }) => {
//         DendronExtension.version = () => "0.70.1";
//         ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
//       },
//     },
//     () => {
//       test("THEN: config migration is forced on init", (done) => {
//         const ws = getDWorkspace();
//         const config = ws.config;
//         expect(config.version).toEqual(4);

//         const allWSRootFiles = fs.readdirSync(ws.wsRoot, {
//           withFileTypes: true,
//         });
//         const maybeBackupFileName = allWSRootFiles
//           .filter((ent) => ent.isFile())
//           .filter((fileEnt) => fileEnt.name.includes("migrate-config"))[0].name;
//         expect(!_.isUndefined(maybeBackupFileName)).toBeTruthy();
//         done();
//       });
//     }
//   );

//   describeMultiWS(
//     "GIVEN: current version is larger than 0.70.0 and config is not legacy",
//     {
//       ctx,
//       modConfigCb: (config) => {
//         config.version = 4;
//         return config;
//       },
//       preSetupHook: async ({ wsRoot, vaults }) => {
//         DendronExtension.version = () => "0.70.1";
//         ENGINE_HOOKS.setupBasic({ wsRoot, vaults });
//       },
//     },
//     () => {
//       test("THEN: config migration is not forced on init", (done) => {
//         const ws = getDWorkspace();
//         const config = ws.config;
//         expect(config.version).toEqual(4);

//         const allWSRootFiles = fs.readdirSync(ws.wsRoot, {
//           withFileTypes: true,
//         });
//         const maybeBackupFiles = allWSRootFiles
//           .filter((ent) => ent.isFile())
//           .filter((fileEnt) => fileEnt.name.includes("migrate-config"));

//         expect(maybeBackupFiles.length === 0).toBeTruthy();
//         done();
//       });
//     }
//   );
// });
