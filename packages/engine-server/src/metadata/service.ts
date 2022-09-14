import {
  BacklinkPanelSortOrder,
  FOLDERS,
  GraphThemeEnum,
  Time,
  TreeViewItemLabelTypeEnum,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import os from "os";
import path from "path";

export enum ShowcaseEntry {
  TryMeetingNotes = "TryMeetingNotes",
  AutocompleteTip = "AutocompleteTip",
  TagsTip = "TagsTip",
  RenameHeader = "RenameHeader",
  TaskManagement = "TaskManagement",
  BlockRefs = "BlockRefs",
  HeaderRefs = "HeaderRefs",
  InsertNoteLink = "InsertNoteLink",
  GraphTheme = "GraphTheme",
  PublishTheme = "PublishTheme",
  PreviewTheme = "PreviewTheme",
  GraphPanel = "GraphPanel",
  BacklinksPanelHover = "BacklinksPanelHover",
  ObsidianImport = "ObsidianImport",
  SettingsUI = "SettingsUI",
  CreateScratchNoteKeybindingTip = "CreateScratchNoteKeybindingTip",
}

/**
 * Survey for users on which prior note-taking tools they've used.
 */
export enum PriorTools {
  No = "No",
  Foam = "Foam",
  Roam = "Roam",
  Logseq = "Logseq",
  Notion = "Notion",
  OneNote = "OneNote",
  Obsidian = "Obsidian",
  Evernote = "Evernote",
  GoogleKeep = "Google Keep",
  Confluence = "Confluence",
  Other = "Other",
}

type Metadata = Partial<{
  /**
   * When was dendron first installed
   */
  firstInstall: number;
  /**
   * What was the version of the first install?
   */
  firstInstallVersion: string;
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
  /**
   * Which index of tip-of-the-day the user has last seen so that we can show
   * the user tips that they havent seen.
   */
  tipOfTheDayIndex: number;
  /*
   * Theme for Note Graph View
   */
  graphTheme?: GraphThemeEnum;
  /**
   * tree view item label type
   */
  treeViewItemLabelType: TreeViewItemLabelTypeEnum;

  backlinksPanelSortOrder: BacklinkPanelSortOrder;
  /**
   * When the user first used Daily Journal command
   */
  firstDailyJournalTime: number;

  /**
   * Responses from this user to the initial survey about prior note-taking
   * tools used.
   */
  priorTools: [PriorTools];

  /**
   * The most recently opened Dendron workspaces
   */
  recentWorkspaces: string[];

  /**
   * One-off setting for tracking whether we've shown the v100 release notes
   * message
   */
  v100ReleaseMessageShown: boolean;

  /**
   * level set by user for local graph view and graph panel
   */
  graphDepth: number;
  /**
   * graph panel show backlinks
   */
  graphPanelShowBacklinks: boolean;
  /**
   * graph panel show outward links
   */
  graphPanelShowOutwardLinks: boolean;
  /**
   * graph panel show hierarchical edges
   */
  graphPanelShowHierarchy: boolean;
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
    return path.join(os.homedir(), FOLDERS.DENDRON_SYSTEM_ROOT, "meta.json");
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

  get TipOfDayIndex(): number | undefined {
    return this.getMeta().tipOfTheDayIndex;
  }

  getGraphTheme() {
    return this.getMeta().graphTheme;
  }

  getTreeViewItemLabelType() {
    return (
      this.getMeta().treeViewItemLabelType || TreeViewItemLabelTypeEnum.title
    );
  }

  get BacklinksPanelSortOrder(): BacklinkPanelSortOrder | undefined {
    return this.getMeta().backlinksPanelSortOrder;
  }

  get priorTools(): PriorTools[] | undefined {
    return this.getMeta().priorTools;
  }

  get RecentWorkspaces(): string[] | undefined {
    return this.getMeta().recentWorkspaces;
  }

  get graphDepth(): number | undefined {
    return this.getMeta().graphDepth;
  }

  get graphPanelShowBacklinks(): boolean | undefined {
    return this.getMeta().graphPanelShowBacklinks;
  }

  get graphPanelShowOutwardLinks(): boolean | undefined {
    return this.getMeta().graphPanelShowOutwardLinks;
  }

  get graphPanelShowHierarchy(): boolean | undefined {
    return this.getMeta().graphPanelShowHierarchy;
  }

  setMeta(key: keyof Metadata, value: any) {
    const stateFromFile = this.getMeta();
    stateFromFile[key] = value;
    fs.writeJSONSync(MetadataService.metaFilePath(), stateFromFile, {
      spaces: 4,
    });
  }

  get v100ReleaseMessageShown(): boolean | undefined {
    return this.getMeta().v100ReleaseMessageShown;
  }

  get firstInstallVersion(): string | undefined {
    return this.getMeta().firstInstallVersion;
  }

  /**
   * Set first install logic
   *  ^o4y7ijuvi5nv
   */
  setInitialInstall(time?: number) {
    time ||= Time.now().toSeconds();
    this.setMeta("firstInstall", time);
  }

  setInitialInstallVersion(version: string) {
    this.setMeta("firstInstallVersion", version);
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

  set TipOfDayIndex(index: number | undefined) {
    this.setMeta("tipOfTheDayIndex", index);
  }

  setGraphTheme(graphTheme: GraphThemeEnum) {
    const meta = this.getMeta();
    if (meta.graphTheme !== graphTheme) {
      this.setMeta("graphTheme", graphTheme);
    }
  }
  set graphDepth(graphDepth: number | undefined) {
    const meta = this.getMeta();
    if (meta.graphDepth !== graphDepth) {
      this.setMeta("graphDepth", graphDepth);
    }
  }

  setTreeViewItemLabelType(labelType: TreeViewItemLabelTypeEnum) {
    this.setMeta("treeViewItemLabelType", labelType);
  }

  set BacklinksPanelSortOrder(sortOrder: BacklinkPanelSortOrder | undefined) {
    this.setMeta("backlinksPanelSortOrder", sortOrder);
  }

  setFirstDailyJournalTime() {
    this.setMeta("firstDailyJournalTime", Time.now().toSeconds());
  }

  set priorTools(priorTools: PriorTools[] | undefined) {
    this.setMeta("priorTools", priorTools);
  }

  set v100ReleaseMessageShown(hasShown) {
    this.setMeta("v100ReleaseMessageShown", hasShown);
  }

  set graphPanelShowBacklinks(showBacklinks: boolean | undefined) {
    this.setMeta("graphPanelShowBacklinks", showBacklinks);
  }

  set graphPanelShowOutwardLinks(showOutwardLinks: boolean | undefined) {
    this.setMeta("graphPanelShowOutwardLinks", showOutwardLinks);
  }

  set graphPanelShowHierarchy(showHierarchy: boolean | undefined) {
    this.setMeta("graphPanelShowHierarchy", showHierarchy);
  }
  // Add a single path to recent workspaces. Recent workspaces acts like a FIFO
  // queue
  addToRecentWorkspaces(path: string) {
    const RECENT_WORKSPACE_ITEM_LIMIT = 5;

    const current = this.getMeta().recentWorkspaces;
    const updated: string[] = [];
    if (!current) {
      updated.push(path);
    } else {
      current.forEach((existingPath) => {
        if (existingPath !== path) {
          updated.push(existingPath);
        }
      });

      if (updated.length >= RECENT_WORKSPACE_ITEM_LIMIT) {
        updated.pop();
      }

      // The first element of the array is the most recent
      updated.unshift(path);
    }

    this.setMeta("recentWorkspaces", updated);
  }
}
