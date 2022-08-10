import {
  DVault,
  NoteQuickInputV2,
  SchemaModuleDict,
} from "@dendronhq/common-all";
import { CancellationToken } from "vscode";

export type provideItemsProps = {
  token?: CancellationToken;
  pickerValue: string;
  showDirectChildrenOnly: boolean;
  workspaceState: workspaceState; // TODO: Remove (Inject in constructor)
};

export type workspaceState = {
  vaults: DVault[];
  schemas: SchemaModuleDict;
};

export interface ILookupProvider {
  /**
   * Provide items to populate the lookup quick pick with
   * @param opts
   */
  provideItems(opts: provideItemsProps): Promise<NoteQuickInputV2[]>;
}
