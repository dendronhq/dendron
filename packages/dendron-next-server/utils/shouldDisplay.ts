import _ from "lodash";
import { DendronConfig, DendronSiteConfig, DVault } from "@dendronhq/common-all";

// NOTE: not meant to be configurable in UI just yet
type ConfigKey = keyof DendronConfig | keyof DendronSiteConfig | keyof DVault;
const HIDDEN_KEYS: ConfigKey[] = [
  "hideBlockAnchors",
  "version",
  "dendronVersion",
  "useNunjucks",
  "noLegacyNoteRef",
  "feedback",
  "apiEndpoint",
  "defaultInsertHierarchy",
  // publishing
  "siteRootDir",
  "siteRepoDir",
  "siteNotesDir",
  "duplicateNoteBehavior", // menu is too complicated right now
  "writeStubs",
  // other
  "useContainers",
  "generateChangelog",
  "previewPort",
  "segmentKey",
  "cognitoUserPoolId",
  "cognitoClientId",
  // --- vault
  "userPermission",
  "sync",
  "noAutoPush"
];

export const shouldDisplay = (name?: string): boolean => {
  return !_.includes(HIDDEN_KEYS, name);
};
