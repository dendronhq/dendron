import {
  ConfigUtils,
  CONSTANTS,
  InstallStatus,
  isNotUndefined,
  Time,
  VaultUtils,
  WorkspaceType,
} from "@dendronhq/common-all";
import { readYAMLAsync, tmpDir, writeYAML } from "@dendronhq/common-server";
import {
  DConfig,
  EngineUtils,
  getWSMetaFilePath,
  MetadataService,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import * as mocha from "mocha";
import { afterEach, beforeEach, describe, it, after } from "mocha";
import path from "path";
import semver from "semver";
import sinon, { SinonStub, SinonSpy } from "sinon";
import * as vscode from "vscode";
import { ExtensionContext, window } from "vscode";
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
import { ExtensionProvider } from "../../ExtensionProvider";
import { KeybindingUtils } from "../../KeybindingUtils";
import { StateService } from "../../services/stateService";
import { AnalyticsUtils } from "../../utils/analytics";
import { ConfigMigrationUtils } from "../../utils/ConfigMigration";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";
import { BlankInitializer } from "../../workspace/blankInitializer";
import { TemplateInitializer } from "../../workspace/templateInitializer";
import {
  shouldDisplayInactiveUserSurvey,
  shouldDisplayLapsedUserMsg,
  shouldDisplayMissingDefaultConfigMessage,
  _activate,
} from "../../_extension";
import {
  expect,
  genDefaultSettings,
  genEmptyWSFiles,
  resetCodeWorkspace,
} from "../testUtilsv2";
import {
  describeMultiWS,
  describeSingleWS,
  runTestButSkipForWindows,
  setupBeforeAfter,
  stubSetupWorkspace,
} from "../testUtilsV3";

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
  done: mocha.Done;
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
  done: mocha.Done;
  firstInstall?: number;
  firstWsInitialize?: number;
  inactiveUserMsgStatus?: "submitted" | "cancelled";
  inactiveUserMsgSendTime?: number;
  workspaceActivated?: boolean;
  firstLookupTime?: number;
  lastLookupTime?: number;
  shouldDisplayMessage: boolean;
}) {
  const {
    done,
    firstInstall,
    firstWsInitialize,
    inactiveUserMsgStatus,
    inactiveUserMsgSendTime,
    shouldDisplayMessage,
    firstLookupTime,
    lastLookupTime,
    workspaceActivated,
  } = opts;
  const svc = MetadataService.instance();
  svc.setMeta("firstInstall", firstInstall);
  svc.setMeta("firstWsInitialize", firstWsInitialize);
  svc.setMeta("inactiveUserMsgStatus", inactiveUserMsgStatus);
  svc.setMeta("inactiveUserMsgSendTime", inactiveUserMsgSendTime);
  svc.setMeta("dendronWorkspaceActivated", workspaceActivated);
  svc.setMeta("firstLookupTime", firstLookupTime);
  svc.setMeta("lastLookupTime", lastLookupTime);
  const expected = shouldDisplayInactiveUserSurvey();
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

suite("GIVEN SetupWorkspace Command", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;
  let wsFoldersStub: SinonStub;
  this.timeout(6 * 1000);

  let ctx: ExtensionContext;
  beforeEach(async () => {
    ctx = VSCodeUtils.getOrCreateMockContext();
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
  });
  afterEach(() => {
    homeDirStub.restore();
    userConfigDirStub.restore();
    wsFoldersStub.restore();
  });
  const opts = {
    noSetInstallStatus: true,
  };

  // TODO: This test case fails in Windows if the logic in setupBeforeAfter (stubs) is not there. Look into why that is the case
  describeMultiWS("WHEN command is gathering inputs", opts, () => {
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
  });

  describe("WHEN initializing a CODE workspace", function () {
    this.timeout(6 * 1000);

    describe("AND workspace has not been set up yet", () => {
      test("THEN Dendon does not activate", async () => {
        const resp = await _activate(ctx);
        expect(resp).toBeFalsy();
        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeFalsy();
      });
    });

    describe("AND a new workspace is being created", () => {
      test("THEN Dendron creates the workspace correctly", async () => {
        const wsRoot = tmpDir().name;

        StateService.instance().setActivationContext(
          WORKSPACE_ACTIVATION_CONTEXT.NORMAL
        );

        const active = await _activate(ctx);
        // Not active yet, because there is no workspace
        expect(active).toBeFalsy();
        stubSetupWorkspace({
          wsRoot,
        });
        const cmd = new SetupWorkspaceCommand();
        await cmd.execute({
          rootDirRaw: wsRoot,
          skipOpenWs: true,
          skipConfirmation: true,
          workspaceInitializer: new BlankInitializer(),
          selfContained: false,
        });
        const resp = await readYAMLAsync(path.join(wsRoot, "dendron.yml"));
        expect(resp).toEqual({
          version: 5,
          dev: {
            enablePreviewV2: true,
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
            copyNoteLink: {},
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
            vaults: [
              {
                fsPath: "vault",
              },
            ],
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
              name: "",
              dateFormat: "",
              addBehavior: "childOfCurrent",
              statusSymbols: {
                "": " ",
                wip: "w",
                done: "x",
                assigned: "a",
                moved: "m",
                blocked: "b",
                delegated: "l",
                dropped: "d",
                pending: "y",
              },
              prioritySymbols: {
                H: "high",
                M: "medium",
                L: "low",
              },
              todoIntegration: false,
              createTaskSelectionType: "selection2link",
            },
            graph: {
              zoomSpeed: 1,
            },
            enableAutoCreateOnDefinition: false,
            enableXVaultWikiLink: false,
            enableRemoteVaultInit: true,
            enableUserTags: true,
            enableHashTags: true,
            workspaceVaultSyncMode: "noCommit",
            enableAutoFoldFrontmatter: false,
            enableEditorDecorations: true,
            maxPreviewsCached: 10,
            maxNoteLength: 204800,
          },
          preview: {
            enableFMTitle: true,
            enableNoteTitleForLink: true,
            enableFrontmatterTags: true,
            enableHashesForFMTags: false,
            enableMermaid: true,
            enablePrettyRefs: true,
            enableKatex: true,
            automaticallyShowPreview: false,
          },
          publishing: {
            enableFMTitle: true,
            enableFrontmatterTags: true,
            enableHashesForFMTags: false,
            enableKatex: true,
            enableMermaid: true,
            enableNoteTitleForLink: true,
            copyAssets: true,
            enablePrettyRefs: true,
            siteHierarchies: ["root"],
            writeStubs: false,
            siteRootDir: "docs",
            seo: {
              title: "Dendron",
              description: "Personal Knowledge Space",
            },
            github: {
              enableEditLink: true,
              editLinkText: "Edit this page on GitHub",
              editBranch: "main",
              editViewMode: "tree",
            },
            enableSiteLastModified: true,
            enableRandomlyColoredTags: true,
            enablePrettyLinks: true,
            duplicateNoteBehavior: {
              action: "useVault",
              payload: ["vault"],
            },
          },
        });

        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeTruthy();
        expect(
          await fs.readdir(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
        ).toEqual(genEmptyWSFiles());
      });
    });

    describe("AND a new workspace is being created with a template initializer", () => {
      test("setup with template initializer", async () => {
        const wsRoot = tmpDir().name;
        StateService.instance().setActivationContext(
          WORKSPACE_ACTIVATION_CONTEXT.NORMAL
        );
        const out = await _activate(ctx);
        // Not active yet, because there is no workspace
        expect(out).toBeFalsy();
        stubSetupWorkspace({
          wsRoot,
        });

        const cmd = new SetupWorkspaceCommand();
        await cmd.execute({
          rootDirRaw: wsRoot,
          skipOpenWs: true,
          skipConfirmation: true,
          workspaceInitializer: new TemplateInitializer(),
          selfContained: false,
        } as SetupWorkspaceOpts);

        const resp = await readYAMLAsync(path.join(wsRoot, "dendron.yml"));
        expect(resp).toContain({
          workspace: {
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
          },
        });
        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeTruthy();
        expect(
          await fs.readdir(path.join(wsRoot, DEFAULT_LEGACY_VAULT_NAME))
        ).toEqual(genEmptyWSFiles());
      });
    });

    describeSingleWS(
      "WHEN a workspace exists",
      {
        preSetupHook: async () => {
          DendronExtension.version = () => "0.0.1";
        },
      },
      () => {
        test("THEN Dendron initializes", async () => {
          const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
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
        });
      }
    );

    describeSingleWS("WHEN a workspace exists", {}, () => {
      test("THEN Dendron initializes", async () => {
        const { wsRoot, vaults, engine } = ExtensionProvider.getDWorkspace();
        DendronExtension.version = () => "0.0.1";
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
      });
    });

    describeSingleWS(
      "WHEN a workspace exists, but it is missing the root.schema.yml",
      {
        postSetupHook: async ({ vaults, wsRoot }) => {
          const vault = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
          fs.removeSync(path.join(vault, "root.schema.yml"));
        },
      },
      () => {
        // Question mark because I'm not sure what this test is actually testing for.
        test("THEN it still initializes?", async () => {
          const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
          const vault = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
          expect(fs.readdirSync(vault)).toEqual(
            [CONSTANTS.DENDRON_CACHE_FILE].concat(genEmptyWSFiles())
          );
        });
      }
    );

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
  });

  describe("WHEN initializing a NATIVE workspace", function () {
    this.timeout(6 * 1000);

    test("not active, initial create ws", async () => {
      const wsRoot = tmpDir().name;

      StateService.instance().setActivationContext(
        WORKSPACE_ACTIVATION_CONTEXT.NORMAL
      );

      const out = await _activate(ctx);
      // Shouldn't have activated because there is no workspace yet
      expect(out).toBeFalsy();

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
        selfContained: false,
      });
      expect(
        await fs.pathExists(path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE))
      ).toBeTruthy();
      expect(
        await fs.pathExists(path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME))
      ).toBeFalsy();
    });
  });

  describe("WHEN initializing a self contained vault as a workspace", () => {
    test("THEN Dendron correctly creates a workspace", async () => {
      const wsRoot = tmpDir().name;

      StateService.instance().setActivationContext(
        WORKSPACE_ACTIVATION_CONTEXT.NORMAL
      );

      const out = await _activate(ctx);
      // Shouldn't have activated because there is no workspace yet
      expect(out).toBeFalsy();

      stubSetupWorkspace({
        wsRoot,
      });
      const cmd = new SetupWorkspaceCommand();
      await cmd.execute({
        workspaceType: WorkspaceType.CODE,
        rootDirRaw: wsRoot,
        skipOpenWs: true,
        skipConfirmation: true,
        workspaceInitializer: new BlankInitializer(),
        selfContained: true,
      });
      const firstFile = await fs.pathExists(
        path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE)
      );
      expect(firstFile).toBeTruthy();
      const secondFile = await fs.pathExists(
        path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME)
      );
      expect(secondFile).toBeTruthy();
    });
  });
});

// These tests run on Windows too actually, but fail on the CI. Skipping for now.
suite("GIVEN a native workspace", function () {
  this.timeout(6 * 1000);
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
  let promptSpy: SinonSpy;
  describeMultiWS(
    "GIVEN initial install",
    {
      beforeHook: async ({ ctx }) => {
        ctx.globalState.update(GLOBAL_STATE.VERSION, undefined);
        promptSpy = sinon.spy(KeybindingUtils, "maybePromptKeybindingConflict");
      },
      noSetInstallStatus: true,
    },
    () => {
      let installStatusStub: SinonStub;
      beforeEach(() => {
        installStatusStub = sinon
          .stub(
            KeybindingUtils,
            "getInstallStatusForKnownConflictingExtensions"
          )
          .returns([{ id: "dummyExt", installed: true }]);
      });

      afterEach(() => {
        installStatusStub.restore();
      });

      after(() => {
        promptSpy.restore();
      });

      test("THEN maybePromptKeybindingConflict is called", async () => {
        expect(promptSpy.called).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN not initial install",
    {
      beforeHook: async () => {
        promptSpy = sinon.spy(KeybindingUtils, "maybePromptKeybindingConflict");
      },
    },
    () => {
      let installStatusStub: SinonStub;
      beforeEach(() => {
        installStatusStub = sinon
          .stub(
            KeybindingUtils,
            "getInstallStatusForKnownConflictingExtensions"
          )
          .returns([{ id: "dummyExt", installed: true }]);
      });

      afterEach(() => {
        installStatusStub.restore();
      });

      after(() => {
        promptSpy.restore();
      });

      test("THEN maybePromptKeybindingConflict is not called", async () => {
        expect(promptSpy.called).toBeFalsy();
      });
    }
  );
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

suite("WHEN migrate config", function () {
  let promptSpy: sinon.SinonSpy;
  let confirmationSpy: sinon.SinonSpy;
  let mockHomeDirStub: sinon.SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    noSetInstallStatus: true,
  });

  async function beforeSetup({ version }: { version: string }) {
    mockHomeDirStub = TestEngineUtils.mockHomeDir();
    DendronExtension.version = () => version;
  }

  async function afterHook() {
    mockHomeDirStub.restore();
    sinon.restore();
  }

  function setupSpies() {
    promptSpy = sinon.spy(ConfigMigrationUtils, "maybePromptConfigMigration");
    confirmationSpy = sinon.spy(
      ConfigMigrationUtils,
      "showConfigMigrationConfirmationMessage"
    );
  }

  describeMultiWS(
    "GIVEN: current version is 0.83.0 and config is legacy",
    {
      ctx,
      modConfigCb: (config) => {
        config.version = 4;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.83.0" });
      },
      afterHook,
    },
    () => {
      test("THEN: config migration is prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(4);

        expect(promptSpy.returnValues[0]).toEqual(true);
        expect(confirmationSpy.called).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN: current version is 0.83.0 and config is up to date",
    {
      ctx,
      modConfigCb: (config) => {
        config.version = 5;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.83.0" });
      },
      afterHook,
    },
    () => {
      test("THEN: config migration is not prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(5);

        expect(promptSpy.returnValues[0]).toEqual(false);
        expect(confirmationSpy.called).toBeFalsy();
      });
    }
  );

  describeMultiWS(
    "GIVEN: current version is 0.84.0 and config is legacy",
    {
      ctx,
      modConfigCb: (config) => {
        config.version = 4;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.84.0" });
      },
      afterHook,
    },
    () => {
      test("THEN: config migration is prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(4);

        expect(promptSpy.returnValues[0]).toEqual(true);
        expect(confirmationSpy.called).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN: current version is 0.84.0 and config is up to date",
    {
      ctx,
      modConfigCb: (config) => {
        config.version = 5;
        return config;
      },
      preSetupHook: async () => {
        setupSpies();
        await beforeSetup({ version: "0.84.0" });
      },
      afterHook,
    },
    () => {
      test("THEN: config migration is not prompted on init", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = ws.config;
        expect(config.version).toEqual(5);

        expect(promptSpy.returnValues[0]).toEqual(false);
        expect(confirmationSpy.called).toBeFalsy();
      });
    }
  );
});

suite("GIVEN Dendron plugin activation", function () {
  let setInitialInstallSpy: sinon.SinonSpy;
  let showTelemetryNoticeSpy: sinon.SinonSpy;
  const ctx: ExtensionContext = setupBeforeAfter(this);
  let mockHomeDirStub: sinon.SinonStub;

  function stubDendronWhenNotFirstInstall() {
    MetadataService.instance().setInitialInstall();
  }

  function stubDendronWhenFirstInstall(ctx: ExtensionContext) {
    ctx.globalState.update(GLOBAL_STATE.VERSION, undefined);
  }

  function setupSpies() {
    setInitialInstallSpy = sinon.spy(
      MetadataService.instance(),
      "setInitialInstall"
    );
    showTelemetryNoticeSpy = sinon.spy(AnalyticsUtils, "showTelemetryNotice");
  }

  async function afterHook() {
    mockHomeDirStub.restore();
    sinon.restore();
  }

  describe("AND WHEN not first install", () => {
    describeMultiWS(
      "AND WHEN activate",
      {
        ctx,
        preActivateHook: async () => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          stubDendronWhenNotFirstInstall();
          setupSpies();
        },
        afterHook,
        timeout: 1e4,
      },
      () => {
        test("THEN set initial install not called", () => {
          expect(setInitialInstallSpy.called).toBeFalsy();
        });

        test("THEN do not show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeFalsy();
        });
      }
    );
    describeMultiWS(
      "AND WHEN firstInstall not set for old user",
      {
        ctx,
        preActivateHook: async () => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          stubDendronWhenNotFirstInstall();
          setupSpies();
          // when check for first install, should be empty
          MetadataService.instance().deleteMeta("firstInstall");
        },
        afterHook,
        timeout: 1e5,
      },
      () => {
        test("THEN set initial install called", () => {
          expect(
            setInitialInstallSpy.calledWith(
              Time.DateTime.fromISO("2021-06-22").toSeconds()
            )
          ).toBeTruthy();
        });

        test("THEN do not show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeFalsy();
        });
      }
    );
  });

  describe("AND WHEN first install", () => {
    describeMultiWS(
      "AND WHEN activate",
      {
        ctx,
        preActivateHook: async ({ ctx }) => {
          mockHomeDirStub = TestEngineUtils.mockHomeDir();
          setupSpies();
          stubDendronWhenFirstInstall(ctx);
        },
        afterHook,
        timeout: 1e4,
      },
      () => {
        test("THEN set initial install called", () => {
          expect(setInitialInstallSpy.called).toBeTruthy();
        });

        test("THEN global version set", () => {
          expect(ctx.globalState.get(GLOBAL_STATE.VERSION)).toNotEqual(
            undefined
          );
        });
        test("THEN show telemetry notice", () => {
          expect(showTelemetryNoticeSpy.called).toBeTruthy();
        });
      }
    );
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
  const SIX_WEEKS_BEFORE = NOW - 6 * ONE_WEEK;
  const SEVEN_WEEKS_BEFORE = NOW - 7 * ONE_WEEK;
  describe("GIVEN not prompted yet", () => {
    describe("WHEN is first week active user AND inactive for less than four weeks", () => {
      test("THEN should not display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: THREE_WEEKS_BEFORE,
          firstWsInitialize: THREE_WEEKS_BEFORE,
          firstLookupTime: THREE_WEEKS_BEFORE,
          lastLookupTime: THREE_WEEKS_BEFORE,
          workspaceActivated: true,
          shouldDisplayMessage: false,
        });
      });
    });
    describe("WHEN is first week active user AND inactive for at least four weeks", () => {
      test("THEN should display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: FIVE_WEEKS_BEFORE,
          firstWsInitialize: FIVE_WEEKS_BEFORE,
          firstLookupTime: FIVE_WEEKS_BEFORE,
          lastLookupTime: FOUR_WEEKS_BEFORE,
          workspaceActivated: true,
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
          inactiveUserMsgStatus: "submitted",
          shouldDisplayMessage: false,
        });
      });
    });
    describe("WHEN it has been another four weeks since user rejected survey", () => {
      test("THEN should display inactive user survey if inactive", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: SEVEN_WEEKS_BEFORE,
          firstWsInitialize: SEVEN_WEEKS_BEFORE,
          firstLookupTime: SEVEN_WEEKS_BEFORE,
          lastLookupTime: SIX_WEEKS_BEFORE,
          inactiveUserMsgSendTime: FOUR_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "cancelled",
          shouldDisplayMessage: true,
        });
      });
      test("THEN should not display inactive user survey if active", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: SEVEN_WEEKS_BEFORE,
          firstWsInitialize: SEVEN_WEEKS_BEFORE,
          firstLookupTime: SEVEN_WEEKS_BEFORE,
          lastLookupTime: ONE_WEEK_BEFORE,
          inactiveUserMsgSendTime: FOUR_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "cancelled",
          shouldDisplayMessage: false,
        });
      });
    });
    describe("WHEN it hasn't been another four weeks since rejected prompt", () => {
      test("THEN should not display inactive user survey", (done) => {
        inactiveMessageTest({
          done,
          firstInstall: SEVEN_WEEKS_BEFORE,
          firstWsInitialize: SEVEN_WEEKS_BEFORE,
          firstLookupTime: SEVEN_WEEKS_BEFORE,
          lastLookupTime: SIX_WEEKS_BEFORE,
          inactiveUserMsgSendTime: THREE_WEEKS_BEFORE,
          workspaceActivated: true,
          inactiveUserMsgStatus: "cancelled",
          shouldDisplayMessage: false,
        });
      });
    });
  });
});

suite("missing default config detection", () => {
  describeMultiWS(
    "GIVEN dendron.yml with missing default key",
    {
      modConfigCb: (config) => {
        // @ts-ignore
        delete config.workspace.workspaceVaultSyncMode;
        return config;
      },
      timeout: 1e5,
    },
    () => {
      test("THEN missing defaults are detected", () => {
        const ws = ExtensionProvider.getDWorkspace();
        const config = DConfig.getRaw(ws.wsRoot);
        expect(config.workspace?.workspaceVaultSyncMode).toEqual(undefined);
        const out = ConfigUtils.detectMissingDefaults({ config });
        expect(out.data?.needsBackfill).toBeTruthy();
        expect(
          out.data?.backfilledConfig.workspace.workspaceVaultSyncMode
        ).toBeTruthy();
      });
    }
  );

  describe("GIVEN upgraded", () => {
    let extensionInstallStatusStub: SinonStub;

    const beforeHook = async () => {
      extensionInstallStatusStub = sinon
        .stub(VSCodeUtils, "getInstallStatusForExtension")
        .returns(InstallStatus.UPGRADED);
    };
    describeMultiWS(
      "AND missing default key",
      {
        beforeHook,
        modConfigCb: (config) => {
          // @ts-ignore
          delete config.workspace.workspaceVaultSyncMode;
          return config;
        },
        noSetInstallStatus: true,
      },
      () => {
        test("THEN prompted to add missing defaults", (done) => {
          const ext = ExtensionProvider.getExtension();
          const out = shouldDisplayMissingDefaultConfigMessage({ ext });
          expect(out).toBeTruthy();
          extensionInstallStatusStub.restore();
          done();
        });
      }
    );

    describeMultiWS(
      "AND not missing default key",
      {
        beforeHook,
        noSetInstallStatus: true,
      },
      () => {
        test("THEN not prompted to add missing defaults", (done) => {
          const ext = ExtensionProvider.getExtension();
          const out = shouldDisplayMissingDefaultConfigMessage({ ext });
          expect(out).toBeFalsy();
          extensionInstallStatusStub.restore();
          done();
        });
      }
    );
  });
});
