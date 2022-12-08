import {
  CONSTANTS,
  isNotUndefined,
  Time,
  VaultUtils,
  WorkspaceType,
} from "@dendronhq/common-all";
import { readYAMLAsync, tmpDir } from "@dendronhq/common-server";
import {
  getWSMetaFilePath,
  MetadataService,
  openWSMetaFile,
  WorkspaceActivationContext,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { Duration } from "luxon";
import * as mocha from "mocha";
import { afterEach, beforeEach, describe } from "mocha";
import path from "path";
import { SinonStub } from "sinon";
import { ExtensionContext } from "vscode";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import { DEFAULT_LEGACY_VAULT_NAME } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { StateService } from "../../services/stateService";
import { AnalyticsUtils } from "../../utils/analytics";
import { StartupPrompts } from "../../utils/StartupPrompts";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";
import { BlankInitializer } from "../../workspace/blankInitializer";
import { TemplateInitializer } from "../../workspace/templateInitializer";
import { _activate } from "../../_extension";
import {
  expect,
  genDefaultSettings,
  genEmptyWSFiles,
  resetCodeWorkspace,
} from "../testUtilsv2";
import { describeSingleWS, stubSetupWorkspace } from "../testUtilsV3";
import { VSCodeTestUtils, WorkspaceTestUtils } from "../utils";

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
  expect(StartupPrompts.shouldDisplayLapsedUserMsg()).toEqual(
    shouldDisplayMessage
  );
  done();
}

suite("GIVEN SetupWorkspace Command", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;
  let wsFoldersStub: SinonStub;
  this.timeout(8 * 1000);

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
    homeDirStub = TestEngineUtils.mockHomeDir();
    userConfigDirStub = VSCodeTestUtils.mockUserConfigDir();
    wsFoldersStub = VSCodeTestUtils.stubWSFolders(undefined);
  });
  afterEach(() => {
    homeDirStub.restore();
    userConfigDirStub.restore();
    wsFoldersStub.restore();
  });
  describe("WHEN initializing a CODE workspace", function () {
    this.timeout(8 * 1000);

    describe("AND workspace has not been set up yet", () => {
      test("THEN Dendon does not activate", async () => {
        const resp = await _activate(ctx, { skipInteractiveElements: true });
        expect(resp).toBeFalsy();
        const dendronState = MetadataService.instance().getMeta();
        expect(isNotUndefined(dendronState.firstInstall)).toBeTruthy();
        expect(isNotUndefined(dendronState.firstWsInitialize)).toBeFalsy();
      });
    });

    describe("AND a new workspace is being created", () => {
      test("THEN Dendron creates the workspace correctly", async () => {
        const wsRoot = tmpDir().name;

        MetadataService.instance().setActivationContext(
          WorkspaceActivationContext.normal
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
        expect(resp).toEqual(
          WorkspaceTestUtils.generateDefaultConfig({
            vaults: [{ fsPath: "vault" }],
            duplicateNoteBehavior: {
              action: "useVault",
              payload: ["vault"],
            },
          })
        );

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
        MetadataService.instance().setActivationContext(
          WorkspaceActivationContext.normal
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
        selfContained: false,
      },
      () => {
        test("THEN Dendron initializes", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { engine, wsRoot } = ws;
          const vaults = await ws.vaults;
          // check for meta
          const fpath = getWSMetaFilePath({ wsRoot });
          const meta = openWSMetaFile({ fpath });
          expect(meta.version).toEqual("0.0.1");
          expect(meta.activationTime < Time.now().toMillis()).toBeTruthy();
          const notes = await engine.findNotesMeta({ excludeStub: true });
          expect(notes.length).toEqual(1);
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

    describeSingleWS(
      "WHEN a workspace exists, but it is missing the root.schema.yml",
      {
        postSetupHook: async ({ vaults, wsRoot }) => {
          const vault = path.join(wsRoot, VaultUtils.getRelPath(vaults[0]));
          fs.removeSync(path.join(vault, "root.schema.yml"));
        },
        selfContained: false,
      },
      () => {
        // Question mark because I'm not sure what this test is actually testing for.
        test("THEN it still initializes?", async () => {
          const ws = ExtensionProvider.getDWorkspace();
          const { wsRoot } = ws;
          const vaults = await ws.vaults;
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
          firstInstall: Time.now()
            .minus(Duration.fromObject({ hours: 28 }))
            .toSeconds(),
          shouldDisplayMessage: true,
        });
      });

      test("Workspace Not Initialized; Message Never Sent; < 1 Day ago", (done) => {
        lapsedMessageTest({
          done,
          firstInstall: Time.now()
            .minus(Duration.fromObject({ hours: 23 }))
            .toSeconds(),
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
    this.timeout(8 * 1000);

    test("not active, initial create ws", async () => {
      const wsRoot = tmpDir().name;

      MetadataService.instance().setActivationContext(
        WorkspaceActivationContext.normal
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

      MetadataService.instance().setActivationContext(
        WorkspaceActivationContext.normal
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
