import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import { PodItemV4 } from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import * as queryString from "query-string";
import { ProgressLocation, QuickPickItem, Uri, window } from "vscode";
import { gdocRequiredScopes, GLOBAL_STATE } from "../constants";
import { StateService } from "../services/stateService";
import { GOOGLE_OAUTH_ID } from "../types/global";
import { clipboard, VSCodeUtils } from "../utils";
import { getDWorkspace } from "../workspace";

export type PodQuickPickItemV4 = QuickPickItem & PodItemV4;

export const showPodQuickPickItemsV4 = (podItem: PodItemV4[]) => {
  const pickItems: PodQuickPickItemV4[] = podItem.map((podItem) => {
    return {
      label: podItem.id,
      ...podItem,
    } as PodQuickPickItemV4;
  });
  return window.showQuickPick(pickItems, {
    placeHolder: "Choose a Pod",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
};

export const launchGoogleOAuthFlow = async () => {
  const port = fs.readFileSync(
    path.join(getDWorkspace().wsRoot, ".dendron.port"),
    {
      encoding: "utf8",
    }
  );

  const stringifiedParams = queryString.stringify({
    client_id: GOOGLE_OAUTH_ID,
    redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google`,
    scope: gdocRequiredScopes.join(" "), // space seperated string
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });
  const link = `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`;
  await open(link);
  clipboard.writeText(link);
};
export const showDocumentQuickPick = async (
  docs: string[]
): Promise<{ label: string } | undefined> => {
  /** Least Recently Used Documents */
  let MRUDocs: string[] | undefined =
    await StateService.instance().getMRUGoogleDocs();
  MRUDocs = _.isUndefined(MRUDocs) ? [] : MRUDocs;

  docs = docs.filter((doc) => !MRUDocs?.includes(doc));

  const pickItems = MRUDocs.concat(docs).map((doc) => {
    return {
      label: doc,
    };
  });

  return window.showQuickPick(pickItems, {
    placeHolder: "Choose a document",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
};

export const showInputBox = async (
  options: any,
  title?: string
): Promise<string | undefined> => {
  const value = await window.showInputBox({
    ...options,
    value: title,
  });
  return value;
};

export const updateGlobalState = async (opts: {
  key: GLOBAL_STATE;
  value: any;
}): Promise<void> => {
  const { key, value } = opts;
  StateService.instance().updateGlobalState(key, value);

  /** to update the Most Recently Used Doc list with most recent doc at first */
  let MRUDocs: string[] | undefined =
    await StateService.instance().getMRUGoogleDocs();
  MRUDocs = _.isUndefined(MRUDocs)
    ? []
    : [key, ...MRUDocs.filter((doc) => doc !== key)];
  StateService.instance().updateMRUGoogleDocs(MRUDocs);
};

export const getGlobalState = async (key: GLOBAL_STATE) => {
  return StateService.instance().getGlobalState(key);
};

export const openFileInEditor = async (note: NoteProps): Promise<void> => {
  const npath = NoteUtils.getFullPath({
    note,
    wsRoot: getDWorkspace().wsRoot,
  });
  const uri = Uri.file(npath);
  await VSCodeUtils.openFileInEditor(uri);
};

export const getSelectionFromQuickpick = async (pagesMap: string[]) => {
  const pickItems = pagesMap.map((page) => {
    return {
      label: page,
    };
  });
  const selected = await window.showQuickPick(pickItems, {
    placeHolder: "Choose the Parent Page",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
  if (!selected) {
    return;
  }
  return selected.label;
};

export const withProgressOpts = {
  withProgress: window.withProgress,
  location: ProgressLocation.Notification,
  showMessage: window.showInformationMessage,
};
