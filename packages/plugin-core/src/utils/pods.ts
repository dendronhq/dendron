import { PodClassEntryV2 } from "@dendronhq/pods-core";
import { QuickPickItem, window } from "vscode";

export type PodItem = {
  id: string;
  description: string;
  podClass: PodClassEntryV2;
};

export type PodQuickPickItem = QuickPickItem & PodItem;

export const showPodQuickPickItems = (podItem: PodItem[]) => {
  const pickItems: PodQuickPickItem[] = podItem.map((podItem) => {
    return {
      label: podItem.id,
      ...podItem,
    } as PodQuickPickItem;
  });
  return window.showQuickPick(pickItems, {
    placeHolder: "Choose Pods to Import",
    ignoreFocusOut: false,
    matchOnDescription: true,
    canPickMany: false,
  });
};

export const podClassEntryToPodItem = (p: PodClassEntryV2): PodItem => {
  return {
    id: p.id,
    description: p.description,
    podClass: p,
  };
};
