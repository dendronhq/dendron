import {
  assertUnreachable,
  DendronError,
  DVault,
  DWorkspaceV2,
  getStage,
  MeetingNoteTestGroups,
  MEETING_NOTE_TUTORIAL_TEST,
  TutorialEvents,
  VaultUtils,
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

    // this is the currently active tutorial AB testing group.
    const ABUserGroup = MEETING_NOTE_TUTORIAL_TEST.getUserGroup(
      SegmentClient.instance().anonymousId
    );

    switch (ABUserGroup) {
      case MeetingNoteTestGroups.show: {
        fs.copySync(
          path.join(dendronWSTemplate.fsPath, "tutorial", "alt"),
          vpath
        );
        break;
      }
      case MeetingNoteTestGroups.noShow: {
        fs.copySync(
          path.join(dendronWSTemplate.fsPath, "tutorial", "main"),
          vpath
        );
        break;
      }
      default:
        assertUnreachable(ABUserGroup);
    }

    // // this is the hierarchy of the treated tutorial.
    // // e.g. for the meeting note test group,
    // // the treated tutorial is in `dendron.tutorial.meeting-note.*`,
    // // so TREATMENT_NAME is `meeting-note`.
    // const TREATMENT_NAME = "meeting-note";

    // let filter: fs.CopyFilterSync;
    // let replacePattern: string;
    // switch (ABUserGroup) {
    //   // swap out to appropriate enum case for current AB testing group
    //   case MeetingNoteTestGroups.show: {
    //     filter = (filePath) => {
    //       if (path.extname(filePath) === ".md") {
    //         const basename = path.basename(filePath);
    //         return (
    //           basename === "root.md" ||
    //           basename.startsWith(`tutorial.alt.${TREATMENT_NAME}`)
    //         );
    //       } else {
    //         return true;
    //       }
    //     };
    //     replacePattern = `tutorial.alt.${TREATMENT_NAME}`;
    //     break;
    //   }
    //   // swap out to appropriate enum case for current AB testing group
    //   case MeetingNoteTestGroups.noShow: {
    //     filter = (filePath) => {
    //       if (path.extname(filePath) === ".md") {
    //         const basename = path.basename(filePath);
    //         return (
    //           basename === "root.md" || basename.startsWith(`tutorial.main`)
    //         );
    //       } else {
    //         return true;
    //       }
    //     };
    //     replacePattern = "tutorial.main";
    //     break;
    //   }
    //   default:
    //     assertUnreachable(ABUserGroup);
    // }

    // fs.copySync(path.join(dendronWSTemplate.fsPath, "tutorial"), vpath, {
    //   filter,
    // });

    // const notesToRename = fs
    //   .readdirSync(vpath)
    //   .filter((basename) => basename.startsWith(replacePattern));

    // notesToRename.forEach((basename) => {
    //   const newName = basename.replace(replacePattern, "tutorial");
    //   fs.renameSync(path.join(vpath, basename), path.join(vpath, newName));
    // });
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
      } else if (fileName?.endsWith("tutorial.1-navigation-basics.md")) {
        eventName = TutorialEvents.Tutorial_1_Show;
      } else if (fileName?.endsWith("tutorial.2-taking-notes.md")) {
        eventName = TutorialEvents.Tutorial_2_Show;
      } else if (fileName?.endsWith("tutorial.3-linking-your-notes.md")) {
        eventName = TutorialEvents.Tutorial_3_Show;
      } else if (fileName?.endsWith("tutorial.4-rich-formatting.md")) {
        eventName = TutorialEvents.Tutorial_4_Show;
      } else if (fileName?.endsWith("tutorial.5-conclusion.md")) {
        eventName = TutorialEvents.Tutorial_5_Show;
      }

      if (eventName) {
        AnalyticsUtils.track(eventName);
      }
    });

    ExtensionProvider.getExtension().context.subscriptions.push(disposable);
  }
}
