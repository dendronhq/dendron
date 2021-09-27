import { SurveyEvents } from "@dendronhq/common-all";
import { AnalyticsUtils } from "./utils/analytics";
import * as vscode from "vscode";
import _ from "lodash";
import { Logger } from "./logger";

export class DendronSurvey {
  choices: readonly vscode.QuickPickItem[];
  opts: {
    canPickMany: boolean;
    title: string;
    ignoreFocusOut: boolean;
    progress?: string;
    placeHolder?: string;
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

  async onAnswer(_opts: any): Promise<void> {
    return undefined;
  }
  onReject(_opts?: any): void {
    return undefined;
  }

  async show(step: number, total: number) {
    const progress = `Step ${step} of ${total}`;
    const title = this.opts.title;
    const showOpts = {
      ...this.opts,
      title: `${title} : ${progress}`,
    }
    const results = await vscode.window.showQuickPick(this.choices, showOpts);
    if (results) {
      await this.onAnswer(results);
    } else {
      this.onReject();
    }

    return results;
  }
}

export class BackgroundSurvey extends DendronSurvey {
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some(result => result.label === "Other" )) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt: "You have checked \"Other\". Please describe what other backgrounds you have.",
        title: "What is your background? - Others",
      });
    }

    AnalyticsUtils.track(SurveyEvents.BackgroundAnswered, {
      results: results.map((result) => result.label),
      other: maybeOtherResult,
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
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some(result => result.label === "Other" )) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt: "You have checked \"Other\". Please describe what other use cases you have.",
        title: "What do you want to use Dendron for? - Other",
      });
    }
    AnalyticsUtils.track(SurveyEvents.UseCaseAnswered, {
      results: results.map((result) => result.label),
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.UseCaseRejected);
  }

  static create() {
    const title = "What do you want to use Dendron for?";
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
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some(result => result.label === "Other" )) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt: "You have checked \"Other\". Please describe what other tools you have used.",
        title: "Are you coming from an existing tool? - Others",
      });
    }
    AnalyticsUtils.track(SurveyEvents.PriorToolsAnswered, {
      results: results.map((result) => result.label),
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.PriorToolsRejected);
  }

  static create() {
    const title = "Are you coming from an existing tool?";
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
      { label: "Other" },
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
          "Welcome to Dendron!",
          { modal: true , detail: "Would you like to tell us a bit about yourself? This info will be used to provide a better onboarding experience. This will take less than a minute to complete."},
          { title: "Proceed" }
        )
        .then(async (resp) => {
          if (resp?.title === "Proceed") {
            const backgroundSurvey = BackgroundSurvey.create();
            const useCaseSurvey = UseCaseSurvey.create();
            const priorToolSurvey = PriorToolsSurvey.create();

            const backgroundResults = await backgroundSurvey.show(1, 3);
            const useCaseResults = await useCaseSurvey.show(2, 3);
            const priorToolsResults = await priorToolSurvey.show(3, 3);

            const answerCount = [
              backgroundResults,
              useCaseResults,
              priorToolsResults,
            ].filter((value) => !_.isUndefined(value)).length;
            AnalyticsUtils.track(SurveyEvents.InitialSurveyAccepted, {
              answerCount,
            });
            vscode.window.showInformationMessage("Survey submitted.");
          } else {
            vscode.window.showInformationMessage("Survey cancelled.");
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
