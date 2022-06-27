import { launchv2, ServerUtils } from "@dendronhq/api-server";
import {
  ConfigEvents,
  ConfigUtils,
  CONSTANTS,
  CURRENT_AB_TESTS,
  getStage,
  InstallStatus,
  IntermediateDendronConfig,
  TaskNoteUtils,
  Time,
  VaultUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
  SegmentClient,
} from "@dendronhq/common-server";
import {
  DConfig,
  MetadataService,
  WorkspaceService,
} from "@dendronhq/engine-server";
import { ExecaChildProcess } from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { CONFIG, DendronContext } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { IBaseCommand } from "../types";
import { GOOGLE_OAUTH_ID, GOOGLE_OAUTH_SECRET } from "../types/global";
import { AnalyticsUtils, sentryReportingCallback } from "../utils/analytics";
import { MarkdownUtils } from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension, getDWorkspace } from "../workspace";
import { WSUtils } from "../WSUtils";

/** Before sending saved telemetry events, wait this long (in ms) to make sure
 * the workspace will likely remain open long enough for us to send everything.
 */
const DELAY_TO_SEND_SAVED_TELEMETRY = 15 * 1000;

async function startServerProcess(): Promise<{
  port: number;
  subprocess?: ExecaChildProcess;
}> {
  const { nextServerUrl, nextStaticRoot, engineServerPort } =
    getDWorkspace().config.dev || {};
  // const ctx = "startServer";
  const maybePort =
    DendronExtension.configuration().get<number | undefined>(
      CONFIG.SERVER_PORT.key
    ) || engineServerPort;
  const port = maybePort;
  if (port) {
    return { port };
  }

  // if in dev mode, simplify debugging without going multi process
  if (getStage() !== "prod") {
    const out = await launchv2({
      logPath: path.join(__dirname, "..", "..", "dendron.server.log"),
      googleOauthClientId: GOOGLE_OAUTH_ID,
      googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
    });
    return { port: out.port };
  }

  // start server is separate process ^pyiildtq4tdx
  const logPath = getDWorkspace().logUri.fsPath;
  const out = await ServerUtils.execServerNode({
    scriptPath: path.join(__dirname, "server.js"),
    logPath,
    nextServerUrl,
    nextStaticRoot,
    port,
    googleOauthClientId: GOOGLE_OAUTH_ID,
    googleOauthClientSecret: GOOGLE_OAUTH_SECRET,
  });
  return out;
}

export class ExtensionUtils {
  static async activate() {
    const ext = this.getExtension();
    return ext.activate();
  }

  static addCommand = ({
    context,
    key,
    cmd,
    existingCommands,
  }: {
    context: vscode.ExtensionContext;
    key: string;
    cmd: IBaseCommand;
    existingCommands: string[];
  }) => {
    if (!existingCommands.includes(key)) {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          key,
          sentryReportingCallback(async (args) => {
            cmd.run(args);
          })
        )
      );
    }
  };

  static getExtension() {
    const extName =
      getStage() === "dev"
        ? "dendron.@dendronhq/plugin-core"
        : "dendron.dendron";
    const ext = vscode.extensions.getExtension(extName);
    return ext as vscode.Extension<any>;
  }

  static setWorkspaceContextOnActivate(
    dendronConfig: IntermediateDendronConfig
  ) {
    if (VSCodeUtils.isDevMode()) {
      vscode.commands.executeCommand(
        "setContext",
        DendronContext.DEV_MODE,
        true
      );
    }
    // used for enablement of legacy show preview command.
    VSCodeUtils.setContext(
      DendronContext.HAS_LEGACY_PREVIEW,
      MarkdownUtils.hasLegacyPreview()
    );

    //used for enablement of export pod v2 command
    VSCodeUtils.setContext(
      DendronContext.ENABLE_EXPORT_PODV2,
      dendronConfig.dev?.enableExportPodV2 ?? false
    );

    // @deprecate: should track as property of workspace init instead
    if (dendronConfig.dev?.enableExportPodV2) {
      AnalyticsUtils.track(ConfigEvents.EnabledExportPodV2);
    }
  }

  /**
   * Setup segment client
   * Also setup cache flushing in case of missed uploads
   */

  static async startServerProcess({
    context,
    start,
    wsService,
    onExit,
  }: {
    context: vscode.ExtensionContext;
    wsService: WorkspaceService;
    start: [number, number];
    onExit: Parameters<typeof ServerUtils["onProcessExit"]>[0]["cb"];
  }) {
    const ctx = "startServerProcess";
    const { port, subprocess } = await startServerProcess();
    if (subprocess) {
      WSUtils.handleServerProcess({
        subprocess,
        context,
        onExit,
      });
    }
    const durationStartServer = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "post-start-server", port, durationStartServer });
    wsService.writePort(port);
    return { port, subprocess };
  }

  static getAndTrackInstallStatus({
    UUIDPathExists,
    previousGlobalVersion,
    currentVersion,
  }: {
    UUIDPathExists: boolean;
    currentVersion: string;
    previousGlobalVersion: string;
  }) {
    const extensionInstallStatus = VSCodeUtils.getInstallStatusForExtension({
      previousGlobalVersion,
      currentVersion,
    });

    // check if this is an install event, but a repeated one on a new instance.
    let isSecondaryInstall = false;

    // set initial install ^194e5bw7so9g
    if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
      // even if it's an initial install for this instance of vscode, it may not be for this machine.
      // in that case, we should skip setting the initial install time since it's already set.
      // we also check if we already set uuid for this machine. If so, this is not a true initial install.
      const metadata = MetadataService.instance().getMeta();
      if (metadata.firstInstall === undefined && !UUIDPathExists) {
        MetadataService.instance().setInitialInstall();
      } else {
        // we still want to proceed with InstallStatus.INITIAL_INSTALL because we want everything
        // tied to initial install to happen in this instance of VSCode once for the first time
        isSecondaryInstall = true;
      }
    }

    // TODO: temporary backfill
    if (_.isUndefined(MetadataService.instance().getMeta().firstInstall)) {
      const time = Time.DateTime.fromISO("2021-06-22");
      MetadataService.instance().setInitialInstall(time.toSeconds());
    }
    return { extensionInstallStatus, isSecondaryInstall };
  }

  /**
   * Analytics related to initializing the workspace
   * @param param0
   */
  static async trackWorkspaceInit({
    durationReloadWorkspace,
    ext,
    activatedSuccess,
  }: {
    durationReloadWorkspace: number;
    ext: IDendronExtension;
    activatedSuccess: boolean;
  }) {
    const engine = ext.getEngine();
    const workspace = ext.getDWorkspace();
    const {
      wsRoot,
      vaults,
      type: workspaceType,
      config: dendronConfig,
    } = workspace;
    let numNotes = _.size(engine.notes);

    let numNoteRefs = 0;
    let numWikilinks = 0;
    let numBacklinks = 0;
    let numLinkCandidates = 0;
    let numFrontmatterTags = 0;
    let numTutorialNotes = 0;
    let numTaskNotes = 0;

    // Note IDs that are part of our tutorial(s). We want to exclude these from
    // our 'numNotes' telemetry.
    const tutorialIds = new Set<string>([
      "ks3b4u7gnd6yiw68qu6ba4m",
      "mycf53kz1r7swcttcobwbdl",
      "kzry3qcy2y4ey1jcf1llajg",
      "y60h6laqi7w462zjp3jyqtt",
      "4do06cts1tme9yz7vfp46bu",
      "5pz82kyfhp2whlzfldxmkzu",
      "kl6ndok3a1f14be6zv771c9",
      "iq3ggn67k1u3v6up8ny3kf5",
      "ie5x2bq5yj7uvenylblnhyr",
      "rjnqumna1ye82u9u76ni42k",
      "wmbd5xz40ohjb8rd5b737cq",
      "epmpyk2kjdxqyvflotan2vt",
      "yyfpeq3th3h17cgvj8cnjw5",
      "lxrp006mal1tfsd7nxmsobe",
      "4u6pv56mnt25d8l2wzfygu7",
      "khv6u4514vnvvy4njhctfru",
      "kyjfnf2rnc6vn71iyn9liz7",
      "c1bs7wsjfbhb0zipaywqfbg", // quickstart-v1
    ]);

    // Takes about ~10 ms to compute in org-workspace
    Object.values(engine.notes).forEach((val) => {
      val.links.forEach((link) => {
        switch (link.type) {
          case "ref":
            numNoteRefs += 1;
            break;
          case "wiki":
            numWikilinks += 1;
            break;
          case "backlink":
            numBacklinks += 1;
            break;
          case "linkCandidate":
            numLinkCandidates += 1;
            break;
          case "frontmatterTag":
            numFrontmatterTags += 1;
            break;
          default:
            break;
        }
      });

      if (tutorialIds.has(val.id)) {
        numTutorialNotes += 1;
      }
      if (TaskNoteUtils.isTaskNote(val)) {
        numTaskNotes += 1;
      }
    });

    // These are the values for the original tutorial; approximate is ok here.
    const tutorialWikiLinkCount = 19;
    const tutorialNoteRefCount = 1;
    const tutorialBacklinkCount = 18;

    if (numTutorialNotes > 0) {
      numNotes -= numTutorialNotes;
      numWikilinks = Math.max(0, numWikilinks - tutorialWikiLinkCount);
      numNoteRefs = Math.max(0, numNoteRefs - tutorialNoteRefCount);
      numBacklinks = Math.max(0, numBacklinks - tutorialBacklinkCount);
    }

    const numSchemas = _.size(engine.schemas);
    const codeWorkspacePresent = await fs.pathExists(
      path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME)
    );
    const publishigConfig = ConfigUtils.getPublishingConfig(dendronConfig);
    const siteUrl = publishigConfig.siteUrl;
    const publishingTheme = dendronConfig?.publishing?.theme;
    const previewTheme = dendronConfig?.preview?.theme;
    const enabledExportPodV2 = dendronConfig.dev?.enableExportPodV2;
    const workspaceConfig = ConfigUtils.getWorkspace(dendronConfig);
    const { workspaceFile, workspaceFolders } = vscode.workspace;
    const trackProps = {
      duration: durationReloadWorkspace,
      noCaching: dendronConfig.noCaching || false,
      numNotes,
      numNoteRefs,
      numWikilinks,
      numBacklinks,
      numLinkCandidates,
      numFrontmatterTags,
      numSchemas,
      numVaults: vaults.length,
      numTutorialNotes,
      numTaskNotes,
      workspaceType,
      codeWorkspacePresent,
      selfContainedVaultsEnabled:
        dendronConfig.dev?.enableSelfContainedVaults || false,
      numSelfContainedVaults: vaults.filter(VaultUtils.isSelfContained).length,
      numRemoteVaults: vaults.filter(VaultUtils.isRemote).length,
      numWorkspaceVaults: vaults.filter(
        (vault) => vault.workspace !== undefined
      ).length,
      numSeedVaults: vaults.filter((vault) => vault.seed !== undefined).length,
      activationSucceeded: activatedSuccess,
      hasLegacyPreview: MarkdownUtils.hasLegacyPreview(),
      enabledExportPodV2,
      hasWorkspaceFile: !_.isUndefined(workspaceFile),
      workspaceFolders: _.isUndefined(workspaceFolders)
        ? 0
        : workspaceFolders.length,
      hasLocalConfig: false,
      numLocalConfigVaults: 0,
      enableHandlebarTemplates: workspaceConfig.enableHandlebarTemplates,
    };
    if (siteUrl !== undefined) {
      _.set(trackProps, "siteUrl", siteUrl);
    }
    if (publishingTheme !== undefined) {
      _.set(trackProps, "publishingTheme", publishingTheme);
    }
    if (previewTheme !== undefined) {
      _.set(trackProps, "previewTheme", previewTheme);
    }
    const maybeLocalConfig = DConfig.searchLocalConfigSync(wsRoot);
    if (maybeLocalConfig.data) {
      trackProps.hasLocalConfig = true;
      if (maybeLocalConfig.data.workspace.vaults) {
        trackProps.numLocalConfigVaults =
          maybeLocalConfig.data.workspace.vaults.length;
      }
    }

    AnalyticsUtils.identify({
      numNotes,
      // Which side of all currently running tests is this user on?
      splitTests: CURRENT_AB_TESTS.map(
        (test) =>
          // Formatted as `testName.groupName` since group names are not necessarily unique
          `${test.name}.${test.getUserGroup(
            SegmentClient.instance().anonymousId
          )}`
      ),
    });
    AnalyticsUtils.track(VSCodeEvents.InitializeWorkspace, trackProps);
    setTimeout(() => {
      Logger.info("sendSavedAnalytics"); // TODO
      AnalyticsUtils.sendSavedAnalytics();
    }, DELAY_TO_SEND_SAVED_TELEMETRY);
  }
}
