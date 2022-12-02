import {
  CURRENT_TUTORIAL_TEST,
  DendronError,
  DWorkspaceV2,
  ErrorUtils,
  getStage,
  isABTest,
  MAIN_TUTORIAL_TYPE_NAME,
  QuickstartTutorialTestGroups,
  TutorialEvents,
  TutorialNoteViewedPayload,
  VaultUtils,
} from "@dendronhq/common-all";
import { file2Note, SegmentClient, vault2Path } from "@dendronhq/common-server";
import {
  InitialSurveyStatusEnum,
  MetadataService,
  WorkspaceActivationContext,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { TogglePreviewCommand } from "../commands/TogglePreview";
import { PreviewPanelFactory } from "../components/views/PreviewViewFactory";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { FeatureShowcaseToaster } from "../showcase/FeatureShowcaseToaster";
import { ObsidianImportTip } from "../showcase/ObsidianImportTip";
import { SurveyUtils } from "../survey";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { BlankInitializer } from "./blankInitializer";
import {
  OnWorkspaceCreationOpts,
  WorkspaceInitializer,
} from "./workspaceInitializer";
import { TogglePreviewLockCommand } from "../commands/TogglePreviewLock";

/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export class TutorialInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  static getTutorialType() {
    if (isABTest(CURRENT_TUTORIAL_TEST)) {
      // NOTE: to force a tutorial group, uncomment the below code
      // return QuickstartTutorialTestGroups.

      return CURRENT_TUTORIAL_TEST.getUserGroup(
        SegmentClient.instance().anonymousId
      );
    } else {
      return MAIN_TUTORIAL_TYPE_NAME;
    }
  }

  async onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void> {
    super.onWorkspaceCreation(opts);

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.tutorial
    );

    const assetUri = VSCodeUtils.getAssetUri(DendronExtension.context());
    const dendronWSTemplate = VSCodeUtils.joinPath(assetUri, "dendron-ws");

    const vpath = vault2Path({ vault: opts.wsVault!, wsRoot: opts.wsRoot });

    const tutorialDir = TutorialInitializer.getTutorialType();

    fs.copySync(
      path.join(
        dendronWSTemplate.fsPath,
        "tutorial",
        "treatments",
        tutorialDir
      ),
      vpath
    );

    // 3 minutes after setup, try to show this toast if we haven't already tried
    setTimeout(() => {
      this.tryShowImportNotesFeatureToaster();
    }, 1000 * 60 * 3);
  }

  private async getAnalyticsPayloadFromDocument(opts: {
    document: vscode.TextDocument;
    ws: DWorkspaceV2;
  }): Promise<TutorialNoteViewedPayload> {
    const { document, ws } = opts;
    const tutorialType = TutorialInitializer.getTutorialType();
    const fsPath = document.uri.fsPath;
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const vault = VaultUtils.getVaultByFilePath({ vaults, wsRoot, fsPath });
    const resp = file2Note(fsPath, vault);
    if (ErrorUtils.isErrorResp(resp)) {
      throw resp.error;
    }
    const note = resp.data;
    const { fname, custom } = note;
    const { currentStep, totalSteps } = custom;
    return {
      tutorialType,
      fname,
      currentStep,
      totalSteps,
    };
  }

  async onWorkspaceOpen(opts: { ws: DWorkspaceV2 }): Promise<void> {
    const ctx = "TutorialInitializer.onWorkspaceOpen";

    // Register a special analytics handler for the tutorial:
    // This needs to be registered before we open any tutorial note.
    // Otherwise some events may be lost and not reported properly.
    const disposable = vscode.window.onDidChangeActiveTextEditor(async (e) => {
      const document = e?.document;

      if (document !== undefined) {
        try {
          const payload = await this.getAnalyticsPayloadFromDocument({
            document,
            ws: opts.ws,
          });
          const { fname } = payload;
          if (fname.includes("tutorial")) {
            AnalyticsUtils.track(TutorialEvents.TutorialNoteViewed, payload);

            // Show import notes tip when they're on the final page of the tutorial.
            if (payload.currentStep === payload.totalSteps) {
              this.tryShowImportNotesFeatureToaster();
            }
          }
        } catch (err) {
          Logger.info({ ctx, msg: "Cannot get payload from document." });
        }
      }
    });

    ExtensionProvider.getExtension().context.subscriptions.push(disposable);

    const { wsRoot } = opts.ws;
    const vaults = await opts.ws.vaults;
    const vaultRelPath = VaultUtils.getRelPath(vaults[0]);
    const rootUri = vscode.Uri.file(
      path.join(wsRoot, vaultRelPath, "tutorial.md")
    );
    if (fs.pathExistsSync(rootUri.fsPath)) {
      // Set the view to have the tutorial page showing with the preview opened to the side.
      await vscode.window.showTextDocument(rootUri);

      if (getStage() !== "test") {
        const preview = PreviewPanelFactory.create();
        // TODO: HACK to wait for existing preview to be ready
        setTimeout(async () => {
          await new TogglePreviewCommand(preview).execute();
          if (
            CURRENT_TUTORIAL_TEST?.getUserGroup(
              SegmentClient.instance().anonymousId
            ) === QuickstartTutorialTestGroups["quickstart-with-lock"]
          ) {
            await new TogglePreviewLockCommand(preview).execute();
          }
        }, 1000);
      }
    } else {
      Logger.error({
        ctx,
        error: new DendronError({ message: `Unable to find tutorial.md` }),
      });
    }

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.normal
    );

    const metaData = MetadataService.instance().getMeta();
    const initialSurveySubmitted =
      metaData.initialSurveyStatus === InitialSurveyStatusEnum.submitted;
    if (!initialSurveySubmitted) {
      await SurveyUtils.showInitialSurvey();
    }
  }

  private triedToShowImportToast: boolean = false;

  private tryShowImportNotesFeatureToaster() {
    if (!this.triedToShowImportToast) {
      const toaster = new FeatureShowcaseToaster();

      // This will only show if the user indicated they've used Obsidian in 'Prior Tools'
      toaster.showSpecificToast(new ObsidianImportTip());
      this.triedToShowImportToast = true;
    }
  }

  async onWorkspaceActivate(opts: {
    skipOpts: Partial<{
      skipTreeView: boolean;
    }>;
  }) {
    const skipOpts = opts.skipOpts;
    if (!skipOpts?.skipTreeView) {
      // for tutorial workspaces,
      // we want the tree view to be focused
      // so that new users can discover the tree view feature.
      vscode.commands.executeCommand("dendron.treeView.focus");
    }
  }
}
