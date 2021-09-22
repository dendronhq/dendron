import { DPod, NoteProps } from "@dendronhq/common-all";

export interface PodClassEntryV4 {
  id: string;
  description: string;
  kind: PodKind;
  new (): DPod<any>;
}

export type PodItemV4 = {
  id: string;
  description: string;
  podClass: PodClassEntryV4;
};

export type PodKind = "import" | "export" | "publish";

export type GDocUtilMethods = {
  showInputBox: (arg0: any, arg1?: string) => Promise<string | undefined>;
  openFileInEditor: (arg0: NoteProps) => Promise<void>;
  showDocumentQuickPick: (
    arg0: string[]
  ) => Promise<{ label: string } | undefined>;
  getGlobalState: (arg0: any) => Promise<string | undefined> | undefined;
  updateGlobalState: (arg0: any) => Promise<void>;
};

export type NotionUtilMethods = {
  getSelectionFromQuickpick: (arg0: string[]) => Promise<string | undefined>;
  withProgressOpts: any;
};
