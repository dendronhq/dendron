import { PodItemV4 } from "@dendronhq/pods-core";
import { QuickPickItem, window } from "vscode";

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
