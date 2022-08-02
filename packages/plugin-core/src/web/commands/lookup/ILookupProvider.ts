import {
  DVault,
  NoteQuickInput,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { CancellationToken } from "vscode";

export type provideItemsProps = {
  token?: CancellationToken;
  fuzzThreshold?: number; // TODO: Remove - pass all these into Provider Constructor
  pickerValue: string;
  showDirectChildrenOnly: boolean; // TODO: Remove
  workspaceState: workspaceState; // TODO: Remove
};

export type workspaceState = {
  wsRoot: string;
  vaults: DVault[];
  schemas: SchemaModuleDict;
};

export interface ILookupProvider {
  provideItems(opts: provideItemsProps): Promise<NoteQuickInput[] | undefined>;
}
