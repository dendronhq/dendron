import { ConfirmStatus, getStage, SurveyEvents } from "@dendronhq/common-all";
import { AnalyticsUtils } from "./utils/analytics";
import * as vscode from "vscode";
import _ from "lodash";
import { Logger } from "./logger";
import { resolve } from "path";
import { VSCodeUtils } from "./vsCodeUtils";
import {
  InactvieUserMsgStatusEnum,
  InitialSurveyStatusEnum,
  LapsedUserSurveyStatusEnum,
  MetadataService,
  PriorTools,
} from "@dendronhq/engine-server";

export class DendronQuickInputSurvey {
  opts: {
    title: string;
    ignoreFocusOut: boolean;
    placeHolder?: string;
    prompt?: string;
  };

  constructor(opts: { title: string; placeHolder?: string; prompt?: string }) {
    this.opts = { ...opts, ignoreFocusOut: true };
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
    };
    const result = await vscode.window.showInputBox(showOpts);
    if (result) {
      await this.onAnswer(result);
    } else {
      this.onReject();
    }

    return result;
  }
}
export class DendronQuickPickSurvey {
  choices: readonly vscode.QuickPickItem[];
  opts: {
    canPickMany: boolean;
    title: string;
    ignoreFocusOut: boolean;
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
    };
    const results = await vscode.window.showQuickPick(this.choices, showOpts);
    if (results) {
      await this.onAnswer(results);
    } else {
      this.onReject();
    }

    return results;
  }
}

export class ContextSurvey extends DendronQuickPickSurvey {
  static CHOICES: { [index: string]: string } = {
    "For work": "work",
    "For personal use": "personal",
    "All of the above": "all",
    Other: "other",
  };

  async onAnswer(result: vscode.QuickPickItem) {
    let maybeOtherResult: string | undefined;
    const answer = ContextSurvey.CHOICES[result.label];
    if (answer === "other") {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other context you intend to use Dendron.',
        title: "In what context do you intend to use Dendron? - Other",
      });
    }

    AnalyticsUtils.identify({ useContext: answer });
    AnalyticsUtils.track(SurveyEvents.ContextSurveyConfirm, {
      status: ConfirmStatus.accepted,
      result: answer,
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.ContextSurveyConfirm, {
      status: ConfirmStatus.rejected,
    });
  }

  static create() {
    const title = "In what context do you intend to use Dendron?";
    const choices = Object.keys(ContextSurvey.CHOICES).map((key) => {
      return { label: key };
    });
    return new ContextSurvey({ title, choices, canPickMany: false });
  }
}

export class BackgroundSurvey extends DendronQuickPickSurvey {
  async onAnswer(result: vscode.QuickPickItem) {
    let maybeOtherResult: string | undefined;
    if (result.label === "Other") {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other backgrounds you have.',
        title: "What is your background? - Other",
      });
    }

    AnalyticsUtils.identify({ role: result.label });
    AnalyticsUtils.track(SurveyEvents.BackgroundAnswered, {
      results: [result.label], // passing as array because this used to be a multi-select survey
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.BackgroundRejected);
  }

  static create() {
    const title = "What is your primary background?";
    const choices = [
      { label: "Software Developer" },
      { label: "Technical Writer" },
      { label: "Researcher" },
      { label: "Dev Ops" },
      { label: "Manager" },
      { label: "Student" },
      { label: "Other" },
    ];
    return new BackgroundSurvey({ title, choices, canPickMany: false });
  }
}

export class UseCaseSurvey extends DendronQuickPickSurvey {
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some((result) => result.label === "Other")) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other use cases you have.',
        title: "What do you want to use Dendron for? - Other",
      });
    }
    const resultsList = results.map((result) => result.label);
    AnalyticsUtils.identify({ useCases: resultsList });
    AnalyticsUtils.track(SurveyEvents.UseCaseAnswered, {
      results: resultsList,
      other: maybeOtherResult,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.UseCaseRejected);
  }

  static create() {
    const title = "What do you want to use Dendron for?";
    const choices = [
      { label: "Personal knowledge base" },
      { label: "Team knowledge base" },
      { label: "Todos and Agenda" },
      { label: "Meeting notes" },
      { label: "Research" },
      { label: "Other" },
    ];
    return new UseCaseSurvey({ title, choices, canPickMany: true });
  }
}

export class PriorToolsSurvey extends DendronQuickPickSurvey {
  async onAnswer(results: vscode.QuickPickItem[]) {
    let maybeOtherResult: string | undefined;
    if (results.some((result) => result.label === "Other")) {
      maybeOtherResult = await vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: "Type anything that applies.",
        prompt:
          'You have checked "Other". Please describe what other tools you have used.',
        title: "Are you coming from an existing tool? - Other",
      });
    }
    const resultsList = results.map((result) => result.label);
    AnalyticsUtils.identify({ priorTools: resultsList });
    AnalyticsUtils.track(SurveyEvents.PriorToolsAnswered, {
      results: results.map((result) => result.label),
      other: maybeOtherResult,
    });

    // Store the results into metadata so that we can later alter functionality
    // based on the user's response
    MetadataService.instance().priorTools = resultsList.map(
      (result) => PriorTools[result as keyof typeof PriorTools]
    );
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.PriorToolsRejected);
  }

  static create() {
    const title = "Are you coming from an existing tool?";
    const choices = [
      { label: PriorTools.No },
      { label: PriorTools.Foam },
      { label: PriorTools.Roam },
      { label: PriorTools.Logseq },
      { label: PriorTools.Notion },
      { label: PriorTools.OneNote },
      { label: PriorTools.Obsidian },
      { label: PriorTools.Evernote },
      { label: PriorTools.Confluence },
      { label: PriorTools.GoogleKeep },
      { label: PriorTools.Other },
    ];
    return new PriorToolsSurvey({ title, choices, canPickMany: true });
  }
}

export class PublishingUseCaseSurvey extends DendronQuickPickSurvey {
  static CHOICES: { [index: string]: string } = {
    "Yes, publishing is a very important use case for me.": "yes/important",
    "Yes, but I would only like to publish my notes to people I choose to.":
      "yes/restricted",
    "I haven't considered publishing my notes, but I am willing to try if it's easy.":
      "curious",
    "No, I do not wish to publish my notes.": "no",
  };

  async onAnswer(result: vscode.QuickPickItem) {
    const answer = PublishingUseCaseSurvey.CHOICES[result.label];
    AnalyticsUtils.identify({ publishingUseCase: answer });
    AnalyticsUtils.track(SurveyEvents.PublishingUseCaseAnswered, {
      answer,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.PublishingUseCaseRejected);
  }

  static create() {
    const title =
      "Dendron lets you publish your notes as a static website. Is this something you'd be interested in?";
    const choices = Object.keys(PublishingUseCaseSurvey.CHOICES).map((key) => {
      return { label: key };
    });
    return new PublishingUseCaseSurvey({ title, choices, canPickMany: false });
  }
}

export class NewsletterSubscriptionSurvey extends DendronQuickInputSurvey {
  async onAnswer(result: string) {
    AnalyticsUtils.identify({ email: result });
    AnalyticsUtils.track(SurveyEvents.NewsletterSubscriptionAnswered);
    resolve();
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.NewsletterSubscriptionRejected);
  }

  static create() {
    const title = "Would you like to subscribe to our newsletter?";
    const placeHolder = "Enter your e-mail";
    return new NewsletterSubscriptionSurvey({ title, placeHolder });
  }
}

export class LapsedUserReasonSurvey extends DendronQuickPickSurvey {
  async onAnswer(result: vscode.QuickPickItem) {
    const label = result.label;
    let extra: string | undefined;
    let reason: string | undefined;
    switch (label) {
      case "I haven't had time to start, but still want to.": {
        reason = "time";
        break;
      }
      case "I am not sure how to get started.": {
        reason = "stuck";
        break;
      }
      case "I've encountered a bug which stopped me from using Dendron.": {
        reason = "bug";
        extra = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "Type here",
          prompt: "Could you describe, in simple words, what happened?",
          title: label,
        });
        break;
      }
      case "I found a different tool that suits me better.": {
        reason = "tool";
        extra = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "Type here",
          prompt: "What feature was missing in Dendron for your use case?",
          title: label,
        });
        break;
      }
      case "Other": {
        // "Other"
        reason = "other";
        extra = await vscode.window.showInputBox({
          ignoreFocusOut: true,
          placeHolder: "Type here",
          prompt: "Please freely type your reasons here.",
          title: label,
        });
        break;
      }
      default: {
        break;
      }
    }

    AnalyticsUtils.track(SurveyEvents.LapsedUserReasonAnswered, {
      reason,
      extra,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserReasonRejected);
  }

  static create() {
    const title = "What is the reason you haven't started using Dendron yet?";
    const choices = [
      { label: "I haven't had time to start, but I still want to." },
      { label: "I am not sure how to get started." },
      { label: "I've encountered a bug which stopped me from using Dendron." },
      { label: "I found a different tool that suits me better." },
      { label: "Other" },
    ];
    return new LapsedUserReasonSurvey({ title, choices, canPickMany: false });
  }
}

export class LapsedUserOnboardingSurvey extends DendronQuickPickSurvey {
  CALENDLY_URL = "https://calendly.com/d/mqtk-rf7q/onboard";
  openOnboardingLink: boolean = false;

  async onAnswer(result: vscode.QuickPickItem) {
    if (result.label === "Yes") {
      this.openOnboardingLink = true;
      vscode.window.showInformationMessage(
        "Thank you for considering an onboarding session.",
        {
          modal: true,
          detail: "We will take you to the link after the survey.",
        },
        { title: "Proceed with Survey" }
      );
    }

    AnalyticsUtils.track(SurveyEvents.LapsedUserGettingStartedHelpAnswered, {
      result: result.label,
    });
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserGettingStartedHelpRejected);
  }

  static create() {
    const title =
      "We offer one-on-one onboarding sessions the help new users get started.";
    const choices = [{ label: "Yes" }, { label: "No" }];
    return new LapsedUserOnboardingSurvey({
      title,
      choices,
      canPickMany: false,
      placeHolder: "Would you like to schedule a 30 minute session?",
    });
  }
}

export class LapsedUserAdditionalCommentSurvey extends DendronQuickInputSurvey {
  async onAnswer(result: string) {
    AnalyticsUtils.track(SurveyEvents.LapsedUserAdditionalCommentAnswered, {
      result,
    });
    resolve();
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserAdditionalCommentRejected);
  }

  static create() {
    const title =
      "Do you have any other comments to leave about your experience?";
    return new LapsedUserAdditionalCommentSurvey({ title });
  }
}

export class LapsedUserPlugDiscordSurvey extends DendronQuickPickSurvey {
  DISCORD_URL = "https://discord.gg/AE3NRw9";
  openDiscordLink: boolean = false;

  async onAnswer(result: vscode.QuickPickItem) {
    if (result.label === "Sure, take me to Discord.") {
      this.openDiscordLink = true;
    }
    AnalyticsUtils.track(SurveyEvents.LapsedUserDiscordPlugAnswered);
  }

  onReject() {
    AnalyticsUtils.track(SurveyEvents.LapsedUserDiscordPlugRejected);
  }

  static create() {
    const title = "Thanks for sharing feedback. One last thing!";
    const placeHolder =
      "We have a Discord community to help new users get started. Would you want an invite?";
    const choices = [
      { label: "Sure, take me to Discord." },
      { label: "I'm already there." },
      { label: "No thanks." },
    ];
    return new LapsedUserPlugDiscordSurvey({
      title,
      choices,
      placeHolder,
      canPickMany: false,
    });
  }
}

export class SurveyUtils {
  /**
   * Asks three questions about background, use case, and prior tools used.
   */
  static async showInitialSurvey() {
    if (getStage() === "test") {
      return;
    }
    AnalyticsUtils.track(SurveyEvents.InitialSurveyPrompted);
    vscode.window
      .showInformationMessage(
        "Welcome to Dendron! 🌱",
        {
          modal: true,
          detail:
            "Would you like to tell us a bit about yourself? This info will be used to provide a better onboarding experience. It will take less than a minute to complete.",
        },
        { title: "Proceed" },
        { title: "Skip Survey" }
      )
      .then(async (resp) => {
        if (resp?.title === "Proceed") {
          const contextSurvey = ContextSurvey.create();
          const backgroundSurvey = BackgroundSurvey.create();
          const useCaseSurvey = UseCaseSurvey.create();
          const publishingUseCaseSurvey = PublishingUseCaseSurvey.create();
          const priorToolSurvey = PriorToolsSurvey.create();
          const newsletterSubscritionSurvey =
            NewsletterSubscriptionSurvey.create();

          const contextResults = await contextSurvey.show(1, 6);
          const backgroundResults = await backgroundSurvey.show(2, 6);
          const useCaseResults = await useCaseSurvey.show(3, 6);
          const publishingUseCaseResults = await publishingUseCaseSurvey.show(
            4,
            6
          );
          const priorToolsResults = await priorToolSurvey.show(5, 6);
          const newsletterSubscriptionResults =
            await newsletterSubscritionSurvey.show(6, 6);

          const answerCount = [
            contextResults,
            backgroundResults,
            useCaseResults,
            publishingUseCaseResults,
            priorToolsResults,
            newsletterSubscriptionResults,
          ].filter((value) => !_.isUndefined(value)).length;
          AnalyticsUtils.track(SurveyEvents.InitialSurveyAccepted, {
            answerCount,
          });

          MetadataService.instance().setInitialSurveyStatus(
            InitialSurveyStatusEnum.submitted
          );

          vscode.window.showInformationMessage(
            "Survey submitted! Thanks for helping us make Dendron better 🌱"
          );
        } else {
          MetadataService.instance().setInitialSurveyStatus(
            InitialSurveyStatusEnum.cancelled
          );
          vscode.window.showInformationMessage("Survey cancelled.");
          AnalyticsUtils.track(SurveyEvents.InitialSurveyRejected);
        }
      })
      // @ts-ignore
      .catch((error: any) => {
        Logger.error({ msg: error });
      });
  }

  static async showLapsedUserSurvey() {
    if (getStage() === "test") {
      return;
    }
    AnalyticsUtils.track(SurveyEvents.LapsedUserSurveyPrompted);
    await vscode.window
      .showInformationMessage(
        "Could you share some feedback to help us improve?",
        { modal: true },
        { title: "Proceed" }
      )
      .then(async (resp) => {
        if (resp?.title === "Proceed") {
          const reasonSurvey = LapsedUserReasonSurvey.create();
          const onboardingSurvey = LapsedUserOnboardingSurvey.create();
          const additionalCommentSurvey =
            LapsedUserAdditionalCommentSurvey.create();
          const discordPlugSurvey = LapsedUserPlugDiscordSurvey.create();

          const reasonResults = await reasonSurvey.show(1, 4);
          const onboardingResults = await onboardingSurvey.show(2, 4);
          const additionCommentResult = await additionalCommentSurvey.show(
            3,
            4
          );
          const discordPlugResult = await discordPlugSurvey.show(4, 4);

          if (onboardingSurvey.openOnboardingLink) {
            await vscode.commands.executeCommand(
              "vscode.open",
              vscode.Uri.parse(onboardingSurvey.CALENDLY_URL)
            );
          }

          if (discordPlugSurvey.openDiscordLink) {
            await vscode.commands.executeCommand(
              "vscode.open",
              vscode.Uri.parse(discordPlugSurvey.DISCORD_URL)
            );
          }

          const answerCount = [
            reasonResults,
            onboardingResults,
            additionCommentResult,
            discordPlugResult,
          ].filter((value) => !_.isUndefined(value)).length;
          AnalyticsUtils.track(SurveyEvents.LapsedUserSurveyAccepted, {
            answerCount,
          });

          MetadataService.instance().setLapsedUserSurveyStatus(
            LapsedUserSurveyStatusEnum.submitted
          );

          vscode.window.showInformationMessage(
            "Survey submitted! Thanks for helping us make Dendron better 🌱"
          );
        } else {
          vscode.window.showInformationMessage("Survey cancelled.");
          AnalyticsUtils.track(SurveyEvents.LapsedUserSurveyRejected);
          MetadataService.instance().setLapsedUserSurveyStatus(
            LapsedUserSurveyStatusEnum.cancelled
          );
        }
      })
      // @ts-ignore
      .catch((error: any) => {
        Logger.error({ msg: error });
      });
  }

  static async showInactiveUserSurvey() {
    // do not show in test
    if (getStage() === "test") {
      return;
    }
    AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyPrompted);
    await vscode.window
      .showInformationMessage(
        "Hey, we noticed you haven't used Dendron for a while. We would love to have you back! Could you give us some feedback on how we can do better?",
        { modal: true },
        { title: "Go to Survey" }
      )
      .then(async (resp) => {
        if (resp?.title === "Go to Survey") {
          const AIRTABLE_URL =
            "https://airtable.com/shry4eLgvVE6WR0Or?prefill_SurveyName=InactiveFeedback";
          VSCodeUtils.openLink(AIRTABLE_URL);

          MetadataService.instance().setInactiveUserMsgStatus(
            InactvieUserMsgStatusEnum.submitted
          );
          vscode.window.showInformationMessage(
            "Thanks for helping us make Dendron better 🌱"
          );
          AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyAccepted);
        } else {
          MetadataService.instance().setInactiveUserMsgStatus(
            InactvieUserMsgStatusEnum.cancelled
          );
          vscode.window.showInformationMessage("Survey cancelled.");
          AnalyticsUtils.track(SurveyEvents.InactiveUserSurveyRejected);
        }
      })
      // @ts-ignore
      .catch((error: any) => {
        Logger.error({ msg: error });
      });
  }
}
