import { DendronQuickPickerV2 } from "./types";
import { CancellationToken, CancellationTokenSource } from "vscode";
import {
  InvalidFilenameReason,
  NoteQuickInputV2,
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
  shouldRejectItem?: (opts: { item: NoteQuickInputV2 }) =>
    | {
        shouldReject: true;
        reason: InvalidFilenameReason;
      }
    | {
        shouldReject: false;
        reason?: never;
      };
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
  token?: CancellationToken;
  fuzzThreshold?: number;
  /**
   * force update even if picker vaule didn't change
   */
  forceUpdate?: boolean;
};

export type ILookupProviderOptsV3 = {
  /**
   * should provide `Create New`
   */
  allowNewNote: boolean;
  /**
   * should provide `Create New with Template`
   * `allowNewNote` must be true for this to take effect.
   * false by default.
   */
  allowNewNoteWithTemplate?: boolean;
  noHidePickerOnAccept?: boolean;
  /** Forces to use picker value as is when constructing the query string. */
  forceAsIsPickerValueUsage?: boolean;
  /**
   * Extra items to show in picker.
   * This will always be shown at the top
   * when (and only when) nothing is queried.
   */
  extraItems?: NoteQuickInputV2[];
  preAcceptValidators?: ((selectedItems: NoteQuickInputV2[]) => boolean)[];
};

export type NoteLookupProviderSuccessResp<T = never> = {
  selectedItems: readonly NoteQuickInputV2[];
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
  selectedItems: NoteQuickInputV2[];
}) => Promise<RespV2<any>>;
