import {
  DVault,
  NoteQuickInput,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { CancellationToken } from "vscode";

export type provideItemsProps = {
  token?: CancellationToken;
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
  /**
   * Provide items to populate the lookup quick pick with
   * @param opts
   */
  provideItems(opts: provideItemsProps): Promise<NoteQuickInput[] | undefined>;
}
