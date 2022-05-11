import {
  DendronError,
  DVault,
  DWorkspaceV2,
  getStage,
  TutorialEvents,
  VaultUtils,
  AB_TUTORIAL_TEST,
} from "@dendronhq/common-all";
import { SegmentClient, vault2Path } from "@dendronhq/common-server";
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
import { WorkspaceInitializer } from "./workspaceInitializer";

/**
 * Workspace Initializer for the Tutorial Experience. Copies tutorial notes and
 * launches the user into the tutorial layout after the workspace is opened.
 */
export class TutorialInitializer
  extends BlankInitializer
  implements WorkspaceInitializer
{
  async onWorkspaceCreation(opts: {
    vaults: DVault[];
    wsRoot: string;
  }): Promise<void> {
    super.onWorkspaceCreation(opts);

    MetadataService.instance().setActivationContext(
      WorkspaceActivationContext.tutorial
    );

    const assetUri = VSCodeUtils.getAssetUri(DendronExtension.context());
    const dendronWSTemplate = VSCodeUtils.joinPath(assetUri, "dendron-ws");

    const vpath = vault2Path({ vault: opts.vaults[0], wsRoot: opts.wsRoot });

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

  async onWorkspaceOpen(opts: { ws: DWorkspaceV2 }): Promise<void> {
    const ctx = "TutorialInitializer.onWorkspaceOpen";

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

    // Register a special analytics handler for the tutorial:
    const disposable = vscode.window.onDidChangeActiveTextEditor((e) => {
      const fileName = e?.document.uri.fsPath;

      let eventName: TutorialEvents | undefined;

      if (fileName?.endsWith("tutorial.md")) {
        eventName = TutorialEvents.Tutorial_0_Show;
      } else if (fileName?.endsWith("tutorial.user-interface.md")) {
        eventName = TutorialEvents.Tutorial_1_Show;
      } else if (fileName?.endsWith("tutorial.taking-notes.md")) {
        eventName = TutorialEvents.Tutorial_2_Show;
      } else if (fileName?.endsWith("tutorial.linking-notes.md")) {
        eventName = TutorialEvents.Tutorial_3_Show;
      } else if (fileName?.endsWith("tutorial.rich-formatting.md")) {
        eventName = TutorialEvents.Tutorial_4_Show;
      } else if (fileName?.endsWith("tutorial.conclusion.md")) {
        eventName = TutorialEvents.Tutorial_5_Show;
      }

      if (eventName) {
        AnalyticsUtils.track(eventName);
      }
    });

    ExtensionProvider.getExtension().context.subscriptions.push(disposable);
  }
}
