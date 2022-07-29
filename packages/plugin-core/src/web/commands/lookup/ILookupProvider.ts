import {
  DVault,
  NoteQuickInput,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { CancellationToken } from "vscode";

export type provideItemsProps = {
  // _justActivated: boolean;
  // nonInteractive: boolean;
  // forceAsIsPickerValueUsage: boolean;
  token?: CancellationToken;
  fuzzThreshold?: number;
  pickerValue: string;
  showDirectChildrenOnly: boolean;
  // filterMiddleware?: FilterQuickPickFunction;
  workspaceState: workspaceState;
};

export type workspaceState = {
  wsRoot: string;
  vaults: DVault[];
  schemas: SchemaModuleDict;
};

export interface ILookupProvider {
  provideItems(opts: provideItemsProps): Promise<NoteQuickInput[] | undefined>;
}
