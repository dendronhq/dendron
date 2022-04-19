import { Time } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";

export enum ShowcaseEntry {
  TryMeetingNotes = "TryMeetingNotes",
}

type Metadata = Partial<{
  /**
   * When was dendron first installed
   */
  firstInstall: number;
  /**
   * When the first workspace was initialized
   */
  firstWsInitialize: number;
  /**
   * When the last time the lapsed user message was displayed to the user
   */
  lapsedUserMsgSendTime: number;
  /**
   * When the last time the inactive user message was displayed to the user
   */
  inactiveUserMsgSendTime: number;
  /**
   * The status of inactive user message. If submitted, we don't prompt again. If cancelled, we wait 2 weeks to send again.
   */
  inactiveUserMsgStatus: InactvieUserMsgStatusEnum;
  /**
   * The status of lapsed user message.
   */
  lapsedUserSurveyStatus: LapsedUserSurveyStatusEnum;
  /**
   * The status of initial survey.
   */
  initialSurveyStatus: InitialSurveyStatusEnum;
  /**
   * Set if a user has activated a dendron workspace
   */
  dendronWorkspaceActivated: number;
  /**
   * When the user first used lookup
   */
  firstLookupTime: number;
  /**
   * When the user last used lookup
   */
  lastLookupTime: number;
  /**
   * Time when the welcome button was clicked
   */
  welcomeClickedTime: number;
  /**
   * Time when feature showcase mssages have been shown.
   */
  featureShowcase: { [key in ShowcaseEntry]?: number };
  /**
   * Global version of Dendron
   */
  version: string;
  /**
   *
   */
  workspaceActivationContext: WorkspaceActivationContext;
}>;

export enum InactvieUserMsgStatusEnum {
  submitted = "submitted",
  cancelled = "cancelled",
}

export enum InitialSurveyStatusEnum {
  submitted = "submitted",
  cancelled = "cancelled",
}

export enum LapsedUserSurveyStatusEnum {
  submitted = "submitted",
  cancelled = "cancelled",
}

export enum WorkspaceActivationContext {
  // UNSET - Indicates this is the first Workspace Launch
  "normal", // Normal Launch; No Special Behavior
  "tutorial", // Launch the Tutorial
  "seedBrowser", // Open with Seed Browser Webview
}

let _singleton: MetadataService | undefined;

export class MetadataService {
  static instance() {
    if (!_singleton) {
      _singleton = new MetadataService();
    }
    return _singleton;
  }

  static metaFilePath() {
    return path.join(os.homedir(), ".dendron", "meta.json");
  }

  deleteMeta(key: keyof Metadata) {
    const stateFromFile = this.getMeta();
    delete stateFromFile[key];
    fs.writeJSONSync(MetadataService.metaFilePath(), stateFromFile, {
      spaces: 4,
    });
  }

  getMeta(): Metadata {
    const metaPath = MetadataService.metaFilePath();
    if (!fs.pathExistsSync(metaPath)) {
      fs.ensureFileSync(metaPath);
      fs.writeJSONSync(metaPath, {});
      return {};
    }
    return fs.readJSONSync(MetadataService.metaFilePath()) as Metadata;
  }

  getWelcomeClicked(): Date | false {
    const welcomeClickedTime =
      MetadataService.instance().getMeta()["welcomeClickedTime"];
    if (_.isNumber(welcomeClickedTime)) {
      return Time.DateTime.fromMillis(welcomeClickedTime).toJSDate();
    }
    return false;
  }

  getFeatureShowcaseStatus(key: ShowcaseEntry) {
    const featureShowcaseData = this.getMeta().featureShowcase;
    if (!featureShowcaseData) {
      return undefined;
    }

    return featureShowcaseData[key];
  }

  getGlobalVersion() {
    return this.getMeta().version || "0.0.0";
  }

  getLapsedUserSurveyStatus() {
    return this.getMeta().lapsedUserSurveyStatus;
  }

  getActivationContext() {
    return (
      this.getMeta().workspaceActivationContext ??
      WorkspaceActivationContext.normal
    );
  }

  setMeta(key: keyof Metadata, value: any) {
    const stateFromFile = this.getMeta();
    stateFromFile[key] = value;
    fs.writeJSONSync(MetadataService.metaFilePath(), stateFromFile, {
      spaces: 4,
    });
  }

  /**
   * Set first install logic
   *  ^o4y7ijuvi5nv
   */
  setInitialInstall(time?: number) {
    time ||= Time.now().toSeconds();
    this.setMeta("firstInstall", time);
  }

  setFirstWsInitialize() {
    this.setMeta("firstWsInitialize", Time.now().toSeconds());
  }

  setLapsedUserMsgSendTime() {
    this.setMeta("lapsedUserMsgSendTime", Time.now().toSeconds());
  }

  setDendronWorkspaceActivated() {
    this.setMeta("dendronWorkspaceActivated", Time.now().toSeconds());
  }

  setFirstLookupTime() {
    this.setMeta("firstLookupTime", Time.now().toSeconds());
  }

  setLastLookupTime() {
    this.setMeta("lastLookupTime", Time.now().toSeconds());
  }

  setInactiveUserMsgSendTime() {
    this.setMeta("inactiveUserMsgSendTime", Time.now().toSeconds());
  }

  setInactiveUserMsgStatus(value: InactvieUserMsgStatusEnum) {
    this.setMeta("inactiveUserMsgStatus", value);
  }

  setInitialSurveyStatus(value: InitialSurveyStatusEnum) {
    this.setMeta("initialSurveyStatus", value);
  }

  setLapsedUserSurveyStatus(value: LapsedUserSurveyStatusEnum) {
    this.setMeta("lapsedUserSurveyStatus", value);
  }

  setGlobalVersion(value: string) {
    this.setMeta("version", value);
  }

  setFeatureShowcaseStatus(key: ShowcaseEntry) {
    const meta = this.getMeta();

    if (!meta.featureShowcase) {
      meta.featureShowcase = {};
    }
    meta.featureShowcase[key] = Time.now().toSeconds();

    return this.setMeta("featureShowcase", meta.featureShowcase);
  }

  setActivationContext(context: WorkspaceActivationContext) {
    this.setMeta("workspaceActivationContext", context);
  }
}
