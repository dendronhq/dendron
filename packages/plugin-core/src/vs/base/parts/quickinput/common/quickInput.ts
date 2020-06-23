import { Event, QuickPick, QuickPickItem } from "vscode";

import { IDisposable } from "../../../common/lifecycle";
import { IMatch } from "../../../common/filters";
import { ResolvedKeybinding } from "../../../common/keyCodes";
import { URI } from "../../../common/uri";

// === Basics

export interface IKeyMods {
  readonly ctrlCmd: boolean;
  readonly alt: boolean;
}

export enum ItemActivation {
  NONE,
  FIRST,
  SECOND,
  LAST,
}

export interface IQuickNavigateConfiguration {
  keybindings: ResolvedKeybinding[];
}

export interface IQuickPickSeparator {
  type: "separator";
  label?: string;
}

// === Rest

export interface IQuickPickItemHighlights {
  label?: IMatch[];
  description?: IMatch[];
  detail?: IMatch[];
}

export type IQuickPickItem = QuickPickItem;
// export interface IQuickPickItem {
//   type?: "item";
//   id?: string;
//   label: string;
//   ariaLabel?: string;
//   description?: string;
//   detail?: string;
//   /**
//    * Allows to show a keybinding next to the item to indicate
//    * how the item can be triggered outside of the picker using
//    * keyboard shortcut.
//    */
//   keybinding?: ResolvedKeybinding;
//   iconClasses?: string[];
//   italic?: boolean;
//   strikethrough?: boolean;
//   highlights?: IQuickPickItemHighlights;
//   buttons?: IQuickInputButton[];
//   picked?: boolean;
//   alwaysShow?: boolean;
// }

export interface IQuickInput extends IDisposable {
  readonly onDidHide: Event<void>;
  readonly onDispose: Event<void>;

  title: string | undefined;

  description: string | undefined;

  step: number | undefined;

  totalSteps: number | undefined;

  enabled: boolean;

  contextKey: string | undefined;

  busy: boolean;

  ignoreFocusOut: boolean;

  show(): void;

  hide(): void;
}

export interface IQuickPickAcceptEvent {
  /**
   * Signals if the picker item is to be accepted
   * in the background while keeping the picker open.
   */
  inBackground: boolean;
}

export interface IQuickInputButton {
  /** iconPath or iconClass required */
  iconPath?: { dark: URI; light?: URI };
  /** iconPath or iconClass required */
  iconClass?: string;
  tooltip?: string;
  /**
   * Whether to always show the button. By default buttons
   * are only visible when hovering over them with the mouse
   */
  alwaysVisible?: boolean;
}

export type IQuickPick<T extends IQuickPickItem> = QuickPick<T>;

// export interface IQuickPick<T extends IQuickPickItem> extends IQuickInput {
//   value: string;

//   /**
//    * A method that allows to massage the value used
//    * for filtering, e.g, to remove certain parts.
//    */
//   filterValue: (value: string) => string;

//   ariaLabel: string;

//   placeholder: string | undefined;

//   readonly onDidChangeValue: Event<string>;

//   readonly onDidAccept: Event<IQuickPickAcceptEvent>;

//   /**
//    * If enabled, will fire the `onDidAccept` event when
//    * pressing the arrow-right key with the idea of accepting
//    * the selected item without closing the picker.
//    */
//   canAcceptInBackground: boolean;

//   ok: boolean | "default";

//   readonly onDidCustom: Event<void>;

//   customButton: boolean;

//   customLabel: string | undefined;

//   customHover: string | undefined;

//   buttons: ReadonlyArray<IQuickInputButton>;

//   readonly onDidTriggerButton: Event<IQuickInputButton>;

//   readonly onDidTriggerItemButton: Event<IQuickPickItemButtonEvent<T>>;

//   items: ReadonlyArray<T | IQuickPickSeparator>;

//   canSelectMany: boolean;

//   matchOnDescription: boolean;

//   matchOnDetail: boolean;

//   matchOnLabel: boolean;

//   sortByLabel: boolean;

//   autoFocusOnList: boolean;

//   quickNavigate: IQuickNavigateConfiguration | undefined;

//   activeItems: ReadonlyArray<T>;

//   readonly onDidChangeActive: Event<T[]>;

//   /**
//    * Allows to control which entry should be activated by default.
//    */
//   itemActivation: ItemActivation;

//   selectedItems: ReadonlyArray<T>;

//   readonly onDidChangeSelection: Event<T[]>;

//   readonly keyMods: IKeyMods;

//   valueSelection: Readonly<[number, number]> | undefined;

//   validationMessage: string | undefined;

//   inputHasFocus(): boolean;

//   focusOnInput(): void;

//   /**
//    * Hides the input box from the picker UI. This is typically used
//    * in combination with quick-navigation where no search UI should
//    * be presented.
//    */
//   hideInput: boolean;
// }

export interface IQuickPickItemButtonEvent<T extends IQuickPickItem> {
  button: IQuickInputButton;
  item: T;
}

// === High
export type IQuickPickItemWithResource = IQuickPickItem & { resource?: URI };
