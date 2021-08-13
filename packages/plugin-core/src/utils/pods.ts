import { PodItemV4 } from "@dendronhq/pods-core";
import { QuickPickItem, Uri, window } from "vscode";
import { gdocScope, GLOBAL_STATE } from "../constants";
import open from "open";
import * as queryString from "query-string";
import { DendronWorkspace } from "../workspace";
import path from "path";
import fs from "fs-extra";
import { VSCodeUtils } from "../utils";
import { NoteUtils, NoteProps } from "@dendronhq/common-all";

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

export const getOauthClient = async () => {
  const port = fs.readFileSync(
    path.join(DendronWorkspace.wsRoot(), ".dendron.port"),
    { encoding: "utf8" }
  );

  const stringifiedParams = queryString.stringify({
    client_id:
      "587163973906-od2u5uaop9b2u6ero5ltl342hh38frth.apps.googleusercontent.com",
    redirect_uri: `http://localhost:${port}/api/oauth/getToken`,
    scope: gdocScope.join(" "), // space seperated string
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
  });
  await open(
    `https://accounts.google.com/o/oauth2/v2/auth?${stringifiedParams}`
  );
};

export const showDocumentQuickPick = (docs: string[]) => {
  const pickItems = docs.map((doc) => {
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

export const getHierarchyDest = async (
  title: string
): Promise<string | undefined> => {
  const hierarchyDestination = await window.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Destination name here",
    title: "Hierarchy destination",
    prompt: "Enter the destination to import into ",
    value: title,
  });
  return hierarchyDestination;
};

export const updateGlobalState = async (opts: {
  key: GLOBAL_STATE;
  value: any;
}) => {
  const { key, value } = opts;
  DendronWorkspace.instance().updateGlobalState(key, value);
};

export const getGlobalState = async (key: GLOBAL_STATE) => {
  return DendronWorkspace.instance().getGlobalState(key);
};

export const openFileInEditor = async (note: NoteProps) => {
  const npath = NoteUtils.getFullPath({
    note,
    wsRoot: DendronWorkspace.wsRoot(),
  });
  const uri = Uri.file(npath);
  await VSCodeUtils.openFileInEditor(uri);
};
