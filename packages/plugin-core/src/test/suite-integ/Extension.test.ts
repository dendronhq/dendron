import {
  CONSTANTS,
  DendronConfig,
  InstallStatus,
  isNotUndefined,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  readJSONWithCommentsSync,
  readYAML,
  tmpDir,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import { toPlainObject } from "@dendronhq/common-test-utils";
import {
  getPortFilePath,
  getWSMetaFilePath,
  MetadataService,
  openWSMetaFile,
} from "@dendronhq/engine-server";
import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import { describe, it } from "mocha";
import os from "os";
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
  WORKSPACE_ACTIVATION_CONTEXT,
} from "../../constants";
import { StateService } from "../../services/stateService";
import * as telemetry from "../../telemetry";
import { KeybindingUtils, VSCodeUtils } from "../../utils";
import { DendronExtension } from "../../workspace";
import { BlankInitializer } from "../../workspace/blankInitializer";
import { TemplateInitializer } from "../../workspace/templateInitializer";
import { shouldDisplayLapsedUserMsg, _activate } from "../../_extension";
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

suite("Extension", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      // Required for StateService Singleton Init at the moment.
      new StateService({
        globalState: ctx.globalState,
        workspaceState: ctx.workspaceState,
      });
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
          version: 1,
          vaults: [
            {
              fsPath: "vault",
            },
          ],
          useFMTitle: true,
          usePrettyRefs: true,
          useNoteTitleForLink: true,
          initializeRemoteVaults: true,
          lookup: {
            note: {
              selectionType: "selectionExtract",
            },
          },
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
          maxPreviewsCached: 10,
          mermaid: true,
          useKatex: true,
          site: {
            copyAssets: true,
            siteHierarchies: ["root"],
            siteRootDir: "docs",
            siteLastModified: true,
            gh_edit_branch: "main",
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
            const port = getPortFilePath({ wsRoot });
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
    });
  });
});

suite("keybindings", function () {
  let homeDirStub: SinonStub;
  let userConfigDirStub: SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
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
      const metaKey = os.type() === "Darwin" ? "cmd" : "ctrl";
      const config = `// This is my awesome Dendron Keybinding
      [
        { // look up note to the side
          "key": "${metaKey}+k l",
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
        key: `${metaKey}+l`,
        command: "-expandLineSelection",
        when: "textInputFocus",
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
