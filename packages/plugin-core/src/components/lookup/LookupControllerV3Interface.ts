import { DendronBtn } from "./ButtonTypes";
import { DendronQuickPickerV2, LookupControllerState } from "./types";
import { ILookupProviderV3 } from "./LookupProviderV3Interface";
import { CancellationTokenSource, QuickInputButton } from "vscode";
import { DNodeType } from "@dendronhq/common-all";
import { LookupView } from "../../views/LookupView";

export type CreateQuickPickOpts = {
  title?: string;
  placeholder: string;
  /**
   * QuickPick.ignoreFocusOut prop
   */
  ignoreFocusOut?: boolean;
  /**
   * Initial value for quickpick
   */
  initialValue?: string;
  nonInteractive?: boolean;
  /**
   * See {@link DendronQuickPickerV2["alwaysShow"]}
   */
  alwaysShow?: boolean;
  /**
   * if canSelectMany and items from selection, select all items at creation
   */
  selectAll?: boolean;
};

export type PrepareQuickPickOpts = CreateQuickPickOpts & {
  provider: ILookupProviderV3;
  onDidHide?: () => void;
};

export type ShowQuickPickOpts = {
  quickpick: DendronQuickPickerV2;
  provider: ILookupProviderV3;
  nonInteractive?: boolean;
  fuzzThreshold?: number;
};

export interface ILookupControllerV3 {
  readonly quickpick: DendronQuickPickerV2;

  fuzzThreshold: number;

  state: LookupControllerState;

  readonly cancelToken: CancellationTokenSource;

  nodeType: DNodeType;

  readonly provider: ILookupProviderV3;

  readonly view: LookupView | undefined;

  /**
   * Wire up quickpick and initialize buttons
   */
  prepareQuickPick(
    opts: PrepareQuickPickOpts
  ): Promise<{ quickpick: DendronQuickPickerV2 }>;

  showQuickPick(opts: ShowQuickPickOpts): Promise<DendronQuickPickerV2>;

  onHide(): void;

  show(
    opts: CreateQuickPickOpts & {
      /**
       * Don't show quickpick
       */
      nonInteractive?: boolean;
      /**
       * Initial value for quickpick
       */
      initialValue?: string;
      provider: ILookupProviderV3;
    }
  ): Promise<DendronQuickPickerV2>;

  createCancelSource(): CancellationTokenSource;

  onTriggerButton(btn: QuickInputButton): Promise<void>;
}

export interface ILookupControllerV3Factory {
  create(opts?: LookupControllerV3CreateOpts): ILookupControllerV3;
}

export type LookupControllerV3CreateOpts = {
  /**
   * Node type
   */
  nodeType: string;
  /**
   * Replace default buttons
   */
  buttons?: DendronBtn[];
  /**
   * When true, don't enable vault selection
   */
  disableVaultSelection?: boolean;
  /**
   * if vault selection isn't disabled,
   * press button on init if true
   */
  vaultButtonPressed?: boolean;
  /** If vault selection isn't disabled, allow choosing the mode of selection.
   *  Defaults to true. */
  vaultSelectCanToggle?: boolean;
  /**
   * Additional buttons
   */
  extraButtons?: DendronBtn[];
  /**
   * 0.0 = exact match
   * 1.0 = match anything
   */
  fuzzThreshold?: number;
  /**
   * disable lookup view
   */
  disableLookupView?: boolean;
};
