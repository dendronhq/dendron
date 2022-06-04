import {
  AB_TUTORIAL_TEST,
  DendronError,
  DWorkspaceV2,
  getStage,
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
import { ShowPreviewCommand } from "../commands/ShowPreview";
import { PreviewPanelFactory } from "../components/views/PreviewViewFactory";
import { GLOBAL_STATE } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { StateService } from "../services/stateService";
import { SurveyUtils } from "../survey";
import { AnalyticsUtils } from "../utils/analytics";
import { VSCodeUtils } from "../vsCodeUtils";
import { DendronExtension } from "../workspace";
import { BlankInitializer } from "./blankInitializer";
import {
  OnWorkspaceCreationOpts,
  WorkspaceInitializer,
} from "./workspaceInitializer";

/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export class TutorialInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  async onWorkspaceCreation(opts: OnWorkspaceCreationOpts): Promise<void> {
    super.onWorkspaceCreation(opts);

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.tutorial
    );

    const assetUri = VSCodeUtils.getAssetUri(DendronExtension.context());
    const dendronWSTemplate = VSCodeUtils.joinPath(assetUri, "dendron-ws");

    const vpath = vault2Path({ vault: opts.wsVault!, wsRoot: opts.wsRoot });

    const ABUserGroup = AB_TUTORIAL_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );

    fs.copySync(
      path.join(
        dendronWSTemplate.fsPath,
        "tutorial",
        "treatments",
        ABUserGroup
      ),
      vpath
    );
  }

  private getAnalyticsPayloadFromDocument(opts: {
    document: vscode.TextDocument;
    ws: DWorkspaceV2;
  }): TutorialNoteViewedPayload {
    const { document, ws } = opts;
    const tutorialType = AB_TUTORIAL_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );
    const fsPath = document.uri.fsPath;
    const { vaults, wsRoot } = ws;
    const vault = VaultUtils.getVaultByFilePath({ vaults, wsRoot, fsPath });
    const note = file2Note(fsPath, vault);
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
    const disposable = vscode.window.onDidChangeActiveTextEditor((e) => {
      const document = e?.document;

      if (document !== undefined) {
        try {
          const payload = this.getAnalyticsPayloadFromDocument({
            document,
            ws: opts.ws,
          });
          const { fname } = payload;
          if (fname.includes("tutorial")) {
            AnalyticsUtils.track(TutorialEvents.TutorialNoteViewed, payload);
          }
        } catch (err) {
          Logger.info({ ctx, msg: "Cannot get payload from document." });
        }
      }
    });

    ExtensionProvider.getExtension().context.subscriptions.push(disposable);

    const { wsRoot, vaults } = opts.ws;
    const vaultRelPath = VaultUtils.getRelPath(vaults[0]);
    const rootUri = vscode.Uri.file(
      path.join(wsRoot, vaultRelPath, "tutorial.md")
    );
    if (fs.pathExistsSync(rootUri.fsPath)) {
      // Set the view to have the tutorial page showing with the preview opened to the side.
      await vscode.window.showTextDocument(rootUri);
      if (getStage() !== "test") {
        // TODO: HACK to wait for existing preview to be ready
        setTimeout(() => {
          new ShowPreviewCommand(
            PreviewPanelFactory.create(ExtensionProvider.getExtension())
          ).execute();
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

    // backfill global state to metadata
    // this should be removed once we have sufficiently waited it out
    const initialSurveyGlobalState =
      await StateService.instance().getGlobalState(
        GLOBAL_STATE.INITIAL_SURVEY_SUBMITTED
      );

    if (
      initialSurveyGlobalState === "submitted" &&
      MetadataService.instance().getMeta().initialSurveyStatus === undefined
    ) {
      MetadataService.instance().setInitialSurveyStatus(
        InitialSurveyStatusEnum.submitted
      );
    }

    const metaData = MetadataService.instance().getMeta();
    const initialSurveySubmitted =
      metaData.initialSurveyStatus === InitialSurveyStatusEnum.submitted;
    if (!initialSurveySubmitted) {
      await SurveyUtils.showInitialSurvey();
    }
  }
}
