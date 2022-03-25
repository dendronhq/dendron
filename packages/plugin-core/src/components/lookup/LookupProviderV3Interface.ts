import { DendronQuickPickerV2 } from "./types";
import { CancellationToken, CancellationTokenSource } from "vscode";
import {
  DNodePropsQuickInputV2,
  NoteQuickInput,
  RespV2,
  SchemaQuickInput,
} from "@dendronhq/common-all";

export type ILookupProviderV3 = {
  id: string;
  provide: (opts: ProvideOpts) => Promise<void>;
  onUpdatePickerItems: (opts: OnUpdatePickerItemsOpts) => Promise<void>;
  registerOnAcceptHook: (hook: OnAcceptHook) => void;
  onDidAccept(opts: {
    quickpick: DendronQuickPickerV2;
    cancellationToken: CancellationTokenSource;
  }): any;
};

export interface INoteLookupProviderFactory {
  create(id: string, opts: ILookupProviderOptsV3): ILookupProviderV3;
}

export interface ISchemaLookupProviderFactory {
  create(id: string, opts: ILookupProviderOptsV3): ILookupProviderV3;
}

export type ProvideOpts = {
  quickpick: DendronQuickPickerV2;
  token: CancellationTokenSource;
  fuzzThreshold: number;
};

export type OnUpdatePickerItemsOpts = {
  picker: DendronQuickPickerV2;
  token: CancellationToken;
  fuzzThreshold?: number;
  /**
   * force update even if picker vaule didn't change
   */
  forceUpdate?: boolean;
};

export type ILookupProviderOptsV3 = {
  allowNewNote: boolean;
  noHidePickerOnAccept?: boolean;
  /** Forces to use picker value as is when constructing the query string. */
  forceAsIsPickerValueUsage?: boolean;
  /**
   * Extra items to show in picker.
   * This will always be shown at the top
   * when (and only when) nothing is queried.
   */
  extraItems?: DNodePropsQuickInputV2[];
  /** If given, override the default "Note does not exists, create?" detail for
   * the create new note option. */
  newNoteDetail?: string;
};

export type NoteLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly NoteQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
};
export type NoteLookupProviderChangeStateResp = {
  action: "hide";
};

export type SchemaLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly SchemaQuickInput[];
  onAcceptHookResp: T[];
  cancel?: boolean;
};

export type OnAcceptHook = (opts: {
  quickpick: DendronQuickPickerV2;
  selectedItems: NoteQuickInput[];
}) => Promise<RespV2<any>>;
