import { CONSTANTS, isNotUndefined, Time } from "@dendronhq/common-all";
import { readYAML, tmpDir } from "@dendronhq/common-server";
import { getPortFilePath, getWSMetaFilePath, MetadataService, openWSMetaFile } from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe, it } from "mocha";
import path from "path";
import { SinonStub } from "sinon";
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
import { shouldDisplayLapsedUserMsg, _activate } from "../../_extension";
import { expect, genDefaultSettings, genEmptyWSFiles, resetCodeWorkspace } from "../testUtilsv2";
import { runLegacySingleWorkspaceTest, setupBeforeAfter, stubSetupWorkspace } from "../testUtilsV3";

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

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
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
              noAutoCreateOnDefinition: true,
              noLegacyNoteRef: true,
              noXVaultWikiLink: true,
              lookupConfirmVaultOnCreate: false,
              autoFoldFrontmatter: true,
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
});
