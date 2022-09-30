import {
  ConfigEvents,
  ConfigUtils,
  ConfirmStatus,
  ExtensionEvents,
  InstallStatus,
  IntermediateDendronConfig,
  MigrationEvents,
  SurveyEvents,
  Time,
  VSCodeEvents,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import { DConfig, readMD } from "@dendronhq/common-server";
import {
  DEPRECATED_PATHS,
  DoctorActionsEnum,
  execa,
  InactvieUserMsgStatusEnum,
  MetadataService,
  MigrationChangeSetStatus,
  MigrationUtils,
  WorkspaceService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { Duration } from "luxon";
import _md from "markdown-it";
import * as vscode from "vscode";
import { DoctorCommand, PluginDoctorActionsEnum } from "../commands/Doctor";
import { INCOMPATIBLE_EXTENSIONS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { SurveyUtils } from "../survey";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils } from "./analytics";
import { ConfigMigrationUtils } from "./ConfigMigration";
import semver from "semver";
import os from "os";

export class StartupUtils {
  static shouldShowManualUpgradeMessage({
    previousWorkspaceVersion,
    currentVersion,
  }: {
    previousWorkspaceVersion: string;
    currentVersion: string;
  }) {
    const workspaceInstallStatus = VSCodeUtils.getInstallStatusForWorkspace({
      previousWorkspaceVersion,
      currentVersion,
    });

    return (
      workspaceInstallStatus === InstallStatus.UPGRADED &&
      semver.lte(previousWorkspaceVersion, "0.63.0")
    );
  }

  static showManualUpgradeMessage() {
    const SHOW_ME_HOW = "Show Me How";
    const MESSAGE =
      "You are upgrading from a legacy version of Dendron. Please follow the instructions to manually migrate your configuration.";
    vscode.window
      .showInformationMessage(MESSAGE, SHOW_ME_HOW)
      .then(async (resp) => {
        if (resp === SHOW_ME_HOW) {
          AnalyticsUtils.track(MigrationEvents.ManualUpgradeMessageConfirm, {
            status: ConfirmStatus.accepted,
          });
          VSCodeUtils.openLink(
            "https://wiki.dendron.so/notes/4119x15gl9w90qx8qh1truj"
          );
        } else {
          AnalyticsUtils.track(MigrationEvents.ManualUpgradeMessageConfirm, {
            status: ConfirmStatus.rejected,
          });
        }
      });
  }

  static async showManualUpgradeMessageIfNecessary({
    previousWorkspaceVersion,
    currentVersion,
  }: {
    previousWorkspaceVersion: string;
    currentVersion: string;
  }) {
    if (
      StartupUtils.shouldShowManualUpgradeMessage({
        previousWorkspaceVersion,
        currentVersion,
      })
    ) {
      StartupUtils.showManualUpgradeMessage();
    }
  }

  static async runMigrationsIfNecessary({
    wsService,
    currentVersion,
    previousWorkspaceVersion,
    dendronConfig,
    maybeWsSettings,
  }: {
    wsService: WorkspaceService;
    currentVersion: string;
    previousWorkspaceVersion: string;
    dendronConfig: IntermediateDendronConfig;
    maybeWsSettings?: WorkspaceSettings;
  }) {
    const workspaceInstallStatus = VSCodeUtils.getInstallStatusForWorkspace({
      previousWorkspaceVersion,
      currentVersion,
    });
    // see [[Migration|dendron://dendron.docs/pkg.plugin-core.t.migration]] for overview of migration process
    const changes = await wsService.runMigrationsIfNecessary({
      currentVersion,
      previousVersion: previousWorkspaceVersion,
      dendronConfig,
      workspaceInstallStatus,
      wsConfig: maybeWsSettings,
    });
    Logger.info({
      ctx: "runMigrationsIfNecessary",
      changes,
      workspaceInstallStatus,
    });
    if (changes.length > 0) {
      changes.forEach((change: MigrationChangeSetStatus) => {
        const event = _.isUndefined(change.error)
          ? MigrationEvents.MigrationSucceeded
          : MigrationEvents.MigrationFailed;

        AnalyticsUtils.track(
          event,
          MigrationUtils.getMigrationAnalyticProps(change)
        );
      });
    } else {
      // no migration changes.
      // see if we need to force a config migration.
      // see [[Run Config Migration|dendron://dendron.docs/pkg.dendron-engine.t.upgrade.arch.lifecycle#run-migration]]
      ConfigMigrationUtils.maybePromptConfigMigration({
        dendronConfig,
        wsService,
        currentVersion,
      });
    }
  }

  static showDuplicateConfigEntryMessageIfNecessary(opts: {
    ext: IDendronExtension;
  }) {
    const message = StartupUtils.getDuplicateKeysMessage(opts);
    if (message !== undefined) {
      StartupUtils.showDuplicateConfigEntryMessage({
        ...opts,
        message,
      });
    }
  }

  static getDuplicateKeysMessage(opts: { ext: IDendronExtension }) {
    const wsRoot = opts.ext.getDWorkspace().wsRoot;
    try {
      DConfig.getRaw(wsRoot);
    } catch (error: any) {
      if (
        error.name === "YAMLException" &&
        error.reason === "duplicated mapping key"
      ) {
        return error.message;
      }
    }
  }

  static showDuplicateConfigEntryMessage(opts: {
    ext: IDendronExtension;
    message: string;
  }) {
    AnalyticsUtils.track(ConfigEvents.DuplicateConfigEntryMessageShow);
    const FIX_ISSUE = "Fix Issue";
    const MESSAGE =
      "We have detected duplicate key(s) in dendron.yml. Dendron has activated using the last entry of the duplicate key(s)";
    vscode.window
      .showInformationMessage(MESSAGE, FIX_ISSUE)
      .then(async (resp) => {
        if (resp === FIX_ISSUE) {
          AnalyticsUtils.track(
            ConfigEvents.DuplicateConfigEntryMessageConfirm,
            {
              status: ConfirmStatus.accepted,
            }
          );
          const wsRoot = opts.ext.getDWorkspace().wsRoot;
          const configPath = DConfig.configPath(wsRoot);
          const configUri = vscode.Uri.file(configPath);

          const message = opts.message;
          const content = [
            `# Duplicate Keys in \`dendron.yml\``,
            "",
            "The message at the bottom displays the _first_ duplicate key mapping that was detected in `dendron.yml`",
            "",
            "**There may be more duplicate key mappings**.",
            "",
            "Take the following steps to fix this issue.",
            "1. Look through `dendron.yml` and remove all duplicate mappings.",
            "",
            `    - We recommend installing the [YAML extension](${vscode.Uri.parse(
              `command:workbench.extensions.search?${JSON.stringify(
                "@id:redhat.vscode-yaml"
              )}`
            )}) for validating \`dendron.yml\``,
            "",
            "1. When you are done, save your changes made to `dendron.yml`",
            "",
            `1. Reload the window for it to take effect. [Click here to reload window](${vscode.Uri.parse(
              `command:workbench.action.reloadWindow`
            )})`,
            "",
            "## Error message",
            "```",
            message,
            "```",
            "",
            "",
          ].join("\n");
          const panel = vscode.window.createWebviewPanel(
            "showDuplicateConfigMessagePreview",
            "Duplicated Mapping Keys Preview",
            vscode.ViewColumn.One,
            {
              enableCommandUris: true,
            }
          );
          const md = _md();
          panel.webview.html = md.render(content);
          await VSCodeUtils.openFileInEditor(configUri, {
            column: vscode.ViewColumn.Beside,
          });
        } else {
          AnalyticsUtils.track(
            ConfigEvents.DuplicateConfigEntryMessageConfirm,
            {
              status: ConfirmStatus.rejected,
            }
          );
        }
      });
  }

  static showDeprecatedConfigMessageIfNecessary(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }) {
    if (StartupUtils.shouldDisplayDeprecatedConfigMessage(opts)) {
      StartupUtils.showDeprecatedConfigMessage({ ext: opts.ext });
    }
  }

  static shouldDisplayDeprecatedConfigMessage(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }): boolean {
    if (opts.extensionInstallStatus === InstallStatus.UPGRADED) {
      const wsRoot = opts.ext.getDWorkspace().wsRoot;
      const rawConfig = DConfig.getRaw(wsRoot);
      const pathsToDelete = ConfigUtils.detectDeprecatedConfigs({
        config: rawConfig,
        deprecatedPaths: DEPRECATED_PATHS,
      });
      return pathsToDelete.length > 0;
    } else {
      return false;
    }
  }

  static showDeprecatedConfigMessage(opts: { ext: IDendronExtension }) {
    AnalyticsUtils.track(ConfigEvents.DeprecatedConfigMessageShow);
    const REMOVE_CONFIG = "Remove Deprecated Configuration";
    const MESSAGE =
      "We have detected some deprecated configurations. Would you like to remove them from dendron.yml?";
    vscode.window
      .showInformationMessage(MESSAGE, REMOVE_CONFIG)
      .then(async (resp) => {
        if (resp === REMOVE_CONFIG) {
          AnalyticsUtils.track(ConfigEvents.DeprecatedConfigMessageConfirm, {
            status: ConfirmStatus.accepted,
          });
          const cmd = new DoctorCommand(opts.ext);
          await cmd.execute({
            action: DoctorActionsEnum.REMOVE_DEPRECATED_CONFIGS,
            scope: "workspace",
          });
        } else {
          AnalyticsUtils.track(ConfigEvents.DeprecatedConfigMessageConfirm, {
            status: ConfirmStatus.rejected,
          });
        }
      });
  }

  static showMissingDefaultConfigMessageIfNecessary(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }) {
    if (StartupUtils.shouldDisplayMissingDefaultConfigMessage(opts)) {
      StartupUtils.showMissingDefaultConfigMessage({ ext: opts.ext });
    }
  }

  static shouldDisplayMissingDefaultConfigMessage(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }): boolean {
    if (opts.extensionInstallStatus === InstallStatus.UPGRADED) {
      const wsRoot = opts.ext.getDWorkspace().wsRoot;
      const rawConfig = DConfig.getRaw(wsRoot);
      const out = ConfigUtils.detectMissingDefaults({ config: rawConfig });
      return out !== undefined && out.needsBackfill;
    } else {
      return false;
    }
  }

  static showMissingDefaultConfigMessage(opts: { ext: IDendronExtension }) {
    AnalyticsUtils.track(ConfigEvents.ShowMissingDefaultConfigMessage);
    const ADD_CONFIG = "Add Missing Configuration";
    const MESSAGE =
      "We have detected a missing configuration. This may happen because a new configuration was introduced, or because an existing required configuration has been deleted. Would you like to add them to dendron.yml?";
    vscode.window
      .showInformationMessage(MESSAGE, ADD_CONFIG)
      .then(async (resp) => {
        if (resp === ADD_CONFIG) {
          AnalyticsUtils.track(
            ConfigEvents.MissingDefaultConfigMessageConfirm,
            {
              status: ConfirmStatus.accepted,
            }
          );
          const cmd = new DoctorCommand(opts.ext);
          await cmd.execute({
            action: DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS,
            scope: "workspace",
          });
        } else {
          AnalyticsUtils.track(
            ConfigEvents.MissingDefaultConfigMessageConfirm,
            {
              status: ConfirmStatus.rejected,
            }
          );
        }
      });
  }

  static async showInactiveUserMessageIfNecessary() {
    if (StartupUtils.shouldDisplayInactiveUserSurvey()) {
      await StartupUtils.showInactiveUserMessage();
    }
  }

  static shouldDisplayInactiveUserSurvey(): boolean {
    const metaData = MetadataService.instance().getMeta();

    const inactiveSurveyMsgStatus = metaData.inactiveUserMsgStatus;
    if (inactiveSurveyMsgStatus === InactvieUserMsgStatusEnum.submitted) {
      return false;
    }

    // rare case where global state has been reset (or a reinstall) may cause issues with
    // the prompt logic. ignore these cases and don't show the
    if (
      metaData.firstInstall !== undefined &&
      metaData.firstLookupTime !== undefined
    ) {
      if (metaData.firstLookupTime - metaData.firstInstall < 0) {
        return false;
      }
    }

    const ONE_WEEK = Duration.fromObject({ weeks: 1 });
    const FOUR_WEEKS = Duration.fromObject({ weeks: 4 });
    const currentTime = Time.now().toSeconds();
    const CUR_TIME = Duration.fromObject({ seconds: currentTime });

    const FIRST_INSTALL =
      metaData.firstInstall !== undefined
        ? Duration.fromObject({ seconds: metaData.firstInstall })
        : undefined;

    const FIRST_LOOKUP_TIME =
      metaData.firstLookupTime !== undefined
        ? Duration.fromObject({ seconds: metaData.firstLookupTime })
        : undefined;

    const LAST_LOOKUP_TIME =
      metaData.lastLookupTime !== undefined
        ? Duration.fromObject({ seconds: metaData.lastLookupTime })
        : undefined;

    const INACTIVE_USER_MSG_SEND_TIME =
      metaData.inactiveUserMsgSendTime !== undefined
        ? Duration.fromObject({ seconds: metaData.inactiveUserMsgSendTime })
        : undefined;

    // is the user a first week active user?
    const isFirstWeekActive =
      FIRST_INSTALL !== undefined &&
      FIRST_LOOKUP_TIME !== undefined &&
      FIRST_LOOKUP_TIME.minus(FIRST_INSTALL) <= ONE_WEEK;

    // was the user active on the first week but has been inactive for more than four weeks?
    const isInactive =
      isFirstWeekActive &&
      LAST_LOOKUP_TIME !== undefined &&
      CUR_TIME.minus(LAST_LOOKUP_TIME) >= FOUR_WEEKS;

    // if they have cancelled last time, we should be waiting another four weeks.
    if (inactiveSurveyMsgStatus === InactvieUserMsgStatusEnum.cancelled) {
      const shouldSendAgain =
        INACTIVE_USER_MSG_SEND_TIME !== undefined &&
        CUR_TIME.minus(INACTIVE_USER_MSG_SEND_TIME) >= FOUR_WEEKS &&
        isInactive;
      if (shouldSendAgain) {
        AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPromptReason, {
          reason: "reprompt",
          currentTime,
          ...metaData,
        });
      }
      return shouldSendAgain;
    } else {
      // this is the first time we are asking them.
      const shouldSend =
        metaData.dendronWorkspaceActivated !== undefined &&
        metaData.firstWsInitialize !== undefined &&
        isInactive &&
        // this is needed since we may have prompted them before we introduced this metadata
        metaData.inactiveUserMsgSendTime === undefined;
      if (shouldSend) {
        AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPromptReason, {
          reason: "initial_prompt",
          currentTime,
          ...metaData,
        });
      }
      return shouldSend;
    }
  }

  static async showInactiveUserMessage() {
    AnalyticsUtils.track(VSCodeEvents.ShowInactiveUserMessage);
    MetadataService.instance().setInactiveUserMsgSendTime();
    await SurveyUtils.showInactiveUserSurvey();
  }

  static warnIncompatibleExtensions(opts: { ext: IDendronExtension }) {
    const installStatus = INCOMPATIBLE_EXTENSIONS.map((extId) => {
      return { id: extId, installed: VSCodeUtils.isExtensionInstalled(extId) };
    });

    const installedExtensions = installStatus
      .filter((status) => status.installed)
      .map((status) => status.id);

    const shouldDisplayWarning = installStatus.some(
      (status) => status.installed
    );
    if (shouldDisplayWarning) {
      AnalyticsUtils.track(ExtensionEvents.IncompatibleExtensionsWarned, {
        installedExtensions,
      });
      vscode.window
        .showWarningMessage(
          "We have detected some extensions that may conflict with Dendron. Further action is needed for Dendron to function correctly",
          "Fix conflicts..."
        )
        .then(async (resp) => {
          if (resp === "Fix conflicts...") {
            const cmd = new DoctorCommand(opts.ext);
            await cmd.execute({
              action: PluginDoctorActionsEnum.FIND_INCOMPATIBLE_EXTENSIONS,
              scope: "workspace",
              data: { installStatus },
            });
          }
        });
    }
  }

  static showUninstallMarkdownLinksExtensionMessage() {
    if (VSCodeUtils.isExtensionInstalled("dendron.dendron-markdown-links")) {
      vscode.window
        .showInformationMessage(
          "Please uninstall the Dendron Markdown Links extension. Dendron has the note graph feature built-in now and having this legacy extension installed will interfere with its functionality.",
          { modal: true },
          { title: "Uninstall" }
        )
        .then(async (resp) => {
          if (resp?.title === "Uninstall") {
            await vscode.commands.executeCommand(
              "workbench.extensions.uninstallExtension",
              "dendron.dendron-markdown-links"
            );
          }
        });
    }
  }

  /**
   * A one-off logic to show a special webview message for the v0.100.0 launch.
   * @returns
   */
  static maybeShowProductHuntMessage() {
    // only show once
    if (MetadataService.instance().v100ReleaseMessageShown) {
      return;
    }

    const uri = VSCodeUtils.joinPath(
      VSCodeUtils.getAssetUri(ExtensionProvider.getExtension().context),
      "dendron-ws",
      "vault",
      "v100.html"
    );

    const { content } = readMD(uri.fsPath);
    const title = "Dendron Release Notes";

    const panel = vscode.window.createWebviewPanel(
      _.kebabCase(title),
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    panel.webview.html = content;
    panel.reveal();

    AnalyticsUtils.track(VSCodeEvents.V100ReleaseNotesShown);

    MetadataService.instance().v100ReleaseMessageShown = true;
  }

  /**
   * this method pings the localhost and checks if it is available. Incase local is blocked off,
   * displays a toaster with a link to troubleshooting docs
   */
  static async showWhitelistingLocalhostDocsIfNecessary() {
    const pingArgs =
      os.platform() === "win32" ? "ping -n 1 127.0.0.1" : "ping -c 1 127.0.0.1";
    const { failed } = await execa.command(pingArgs);
    if (failed) {
      AnalyticsUtils.track(ExtensionEvents.LocalhostBlockedNotified);
      vscode.window
        .showWarningMessage(
          "Dendron is facing issues while connecting with localhost. Please ensure that you don't have anything running that can block localhost.",
          ...["Open troubleshooting docs"]
        )
        .then((resp) => {
          if (resp === "Open troubleshooting docs") {
            AnalyticsUtils.track(ExtensionEvents.LocalhostBlockedAccepted);
            vscode.commands.executeCommand(
              "vscode.open",
              "https://wiki.dendron.so/notes/a6c03f9b-8959-4d67-8394-4d204ab69bfe/#whitelisting-localhost"
            );
          } else {
            AnalyticsUtils.track(ExtensionEvents.LocalhostBlockedRejected);
          }
        });
    }
  }
}
