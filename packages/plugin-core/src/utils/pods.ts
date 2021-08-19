import { PodItemV4 } from "@dendronhq/pods-core";
import { QuickPickItem, Uri, window } from "vscode";
import { gdocRequiredScopes, GLOBAL_STATE } from "../constants";
import open from "open";
import * as queryString from "query-string";
import { DendronWorkspace } from "../workspace";
import path from "path";
import fs from "fs-extra";
import { VSCodeUtils } from "../utils";
import { NoteUtils, NoteProps } from "@dendronhq/common-all";
import _ from "lodash";

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
    path.join(DendronWorkspace.wsRoot(), ".dendron.port"),
    { encoding: "utf8" }
  );

  const stringifiedParams = queryString.stringify({
    client_id:
      "587163973906-od2u5uaop9b2u6ero5ltl342hh38frth.apps.googleusercontent.com",
    redirect_uri: `http://localhost:${port}/api/oauth/getToken?service=google`,
    scope: gdocRequiredScopes.join(" "), // space seperated string
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });
  await open(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
  );
};
export const showDocumentQuickPick = async (
  docs: string[]
): Promise<{ label: string } | undefined> => {
  /** Least Recently Used Documents */
  let MRUDocs: string[] | undefined =
    await DendronWorkspace.instance().getGlobalState(GLOBAL_STATE.MRUDocs);
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
  DendronWorkspace.instance().updateGlobalState(key, value);

  /** to update the Most Recently Used Doc list with most recent doc at first */
  let MRUDocs: string[] | undefined =
    await DendronWorkspace.instance().getGlobalState(GLOBAL_STATE.MRUDocs);
  MRUDocs = _.isUndefined(MRUDocs)
    ? []
    : [key, ...MRUDocs.filter((doc) => doc !== key)];
  DendronWorkspace.instance().updateGlobalState(GLOBAL_STATE.MRUDocs, MRUDocs);
};

export const getGlobalState = async (
  key: GLOBAL_STATE
): Promise<string | undefined> => {
  return DendronWorkspace.instance().getGlobalState(key);
};

export const openFileInEditor = async (note: NoteProps): Promise<void> => {
  const npath = NoteUtils.getFullPath({
    note,
    wsRoot: DendronWorkspace.wsRoot(),
  });
  const uri = Uri.file(npath);
  await VSCodeUtils.openFileInEditor(uri);
};
