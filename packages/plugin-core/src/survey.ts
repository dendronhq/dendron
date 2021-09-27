import { SurveyEvents } from "@dendronhq/common-all";
import { AnalyticsUtils } from "./utils/analytics";
import * as vscode from "vscode";
import _ from "lodash";
import { Logger } from "./logger";

export class DendronSurvey {
  choices: readonly vscode.QuickPickItem[];
  opts: {
    placeHolder: string;
    canPickMany: boolean;
    title: string;
    ignoreFocusOut: boolean;
  };

  constructor(opts: {
    choices: vscode.QuickPickItem[];
    canPickMany: boolean;
    title: string;
    placeHolder?: string;
  }) {
    const { choices, canPickMany, title } = opts;
    let placeHolder = opts.placeHolder;
    this.choices = choices;

    if (!placeHolder) {
      placeHolder = canPickMany ? "Check all that applies." : "Check one";
    }

    this.opts = { title, placeHolder, canPickMany, ignoreFocusOut: true };
  }

  getChoices(): readonly vscode.QuickPickItem[] {
    return this.choices;
  }

  onAnswer(_opts: any): void {
    return undefined;
  }
  onReject(_opts?: any): void {
    return undefined;
  }

  async show() {
    const results = await vscode.window.showQuickPick(this.choices, this.opts);
    if (results) {
      this.onAnswer(results);
    } else {
      this.onReject();
    }

    return results;
  }
}

export class BackgroundSurvey extends DendronSurvey {
  onAnswer(results: vscode.QuickPickItem[]) {
    AnalyticsUtils.track(SurveyEvents.BackgroundAnswered, {
      results: results.map((result) => result.label),
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.BackgroundRejected);
  }

  static create() {
    const title = "What is your background?";
    const choices = [
      { label: "Software Developer" },
      { label: "Technical Writer" },
      { label: "Dev Ops" },
      { label: "Manager" },
      { label: "Student" },
      { label: "Other" },
    ];
    return new BackgroundSurvey({ title, choices, canPickMany: true });
  }
}

export class UseCaseSurvey extends DendronSurvey {
  onAnswer(results: vscode.QuickPickItem[]) {
    AnalyticsUtils.track(SurveyEvents.UseCaseAnswered, {
      results: results.map((result) => result.label),
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.UseCaseRejected);
  }

  static create() {
    const title = "Tell us what you want to use Dendron for";
    const choices = [
      { label: "Team knowledge base" },
      { label: "Todos and Agenda" },
      { label: "Meeting notes" },
      { label: "Publishing" },
      { label: "Research" },
      { label: "Other" },
    ];
    return new UseCaseSurvey({ title, choices, canPickMany: true });
  }
}

export class PriorToolsSurvey extends DendronSurvey {
  onAnswer(results: vscode.QuickPickItem[]) {
    AnalyticsUtils.track(SurveyEvents.PriorToolsAnswered, {
      results: results.map((result) => result.label),
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.PriorToolsRejected);
  }

  static create() {
    const title = "Are you coming from an existing tool(s)?";
    const choices = [
      { label: "No" },
      { label: "Foam" },
      { label: "Roam" },
      { label: "Logseq" },
      { label: "Notion" },
      { label: "OneNote" },
      { label: "Obsidian" },
      { label: "Evernote" },
      { label: "Google Keep" },
    ];
    return new PriorToolsSurvey({ title, choices, canPickMany: true });
  }
}

export class SurveyUtils {
  /**
   * Flip a coin to randomly prompt initial survey.
   * Asks three questions about background, use case, and prior tools used.
   * @param forcePrompt skip flipping a coin and force prompting.
   */
  static async maybePromptInitialSurvey(forcePrompt?: boolean) {
    const shouldPrompt = forcePrompt ? true : !!Math.floor(Math.random() * 2);
    if (shouldPrompt) {
      AnalyticsUtils.track(SurveyEvents.InitialSurveyPrompted);
      vscode.window
        .showInformationMessage(
          "Would you like to tell us a bit about yourself?",
          { modal: true , detail: "This info will be used to provide a better onboarding experience"},
          { title: "Proceed" }
        )
        .then(async (resp) => {
          if (resp?.title === "Proceed") {
            const backgroundSurvey = BackgroundSurvey.create();
            const useCaseSurvey = UseCaseSurvey.create();
            const priorToolSurvey = PriorToolsSurvey.create();

            const backgroundResults = await backgroundSurvey.show();
            const useCaseResults = await useCaseSurvey.show();
            const priorToolsResults = await priorToolSurvey.show();

            const answerCount = [
              backgroundResults,
              useCaseResults,
              priorToolsResults,
            ].filter((value) => !_.isUndefined(value)).length;
            AnalyticsUtils.track(SurveyEvents.InitialSurveyAccepted, {
              answerCount,
            });
          } else {
            AnalyticsUtils.track(SurveyEvents.InitialSurveyRejected);
          }
        })
        // @ts-ignore
        .catch((error: any) => {
          Logger.error({msg: error});
        });
    }
  }
}
