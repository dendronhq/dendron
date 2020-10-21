import { PodClassEntryV2, PodItemV3 } from "@dendronhq/pods-core";
import { QuickPickItem, window } from "vscode";

export type PodItem = {
  id: string;
  description: string;
  podClass: PodClassEntryV2;
};

export type PodQuickPickItem = QuickPickItem & PodItem;
export type PodQuickPickItemV3 = QuickPickItem & PodItemV3;

export const showPodQuickPickItems = (podItem: PodItem[]) => {
  const pickItems: PodQuickPickItem[] = podItem.map((podItem) => {
    return {
      label: podItem.id,
      ...podItem,
    } as PodQuickPickItem;
  });
  return window.showQuickPick(pickItems, {
    placeHolder: "Choose a Pod",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
};

export const showPodQuickPickItemsV3 = (podItem: PodItemV3[]) => {
  const pickItems: PodQuickPickItemV3[] = podItem.map((podItem) => {
    return {
      label: podItem.id,
      ...podItem,
    } as PodQuickPickItemV3;
  });
  return window.showQuickPick(pickItems, {
    placeHolder: "Choose a Pod",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
};
