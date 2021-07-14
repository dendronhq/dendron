/* eslint-disable no-dupe-class-members */
import {
  DendronError,
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DNoteLoc,
  DVault,
  NoteProps,
  NoteQuickInput,
  NoteUtils,
  RenameNoteOpts,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { getDurationMilliseconds, vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { QuickPickItem, TextEditor, Uri, ViewColumn, window } from "vscode";
import { VaultSelectionMode } from "../../commands/LookupCommand";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace, getWS } from "../../workspace";
import { DendronBtn, getButtonCategory } from "./buttons";
import {
  CREATE_NEW_DETAIL,
  CREATE_NEW_LABEL,
  MORE_RESULTS_LABEL,
} from "./constants";
import { ILookupProviderV3, OnAcceptHook } from "./LookupProviderV3";
import { DendronQuickPickerV2 } from "./types";

const PAGINATE_LIMIT = 50;
export const UPDATET_SOURCE = {
  UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};

// Vault Recommendation Detail Descriptions
export const CONTEXT_DETAIL = "current note context";
export const HIERARCHY_MATCH_DETAIL = "hierarchy match";
export const FULL_MATCH_DETAIL = "hierarchy match and current note context";

export type VaultPickerItem = { vault: DVault } & Partial<QuickPickItem>;

function isDVaultArray(
  overrides?: VaultPickerItem[] | DVault[]
): overrides is DVault[] {
  return _.some(
    overrides,
    (item) => (item as VaultPickerItem).vault === undefined
  );
}

export function createNoActiveItem(vault: DVault): DNodePropsQuickInputV2 {
  const props = DNodeUtils.create({
    fname: CREATE_NEW_LABEL,
    type: "note",
    vault,
  });
  return {
    ...props,
    label: CREATE_NEW_LABEL,
    detail: CREATE_NEW_DETAIL,
    alwaysShow: true,
  };
}

export function createMoreResults(): DNodePropsQuickInputV2 {
  // @ts-ignore
  return {
    label: MORE_RESULTS_LABEL,
    detail: "",
    alwaysShow: true,
  };
}

export function node2Uri(node: DNodeProps): Uri {
  const ext = node.type === "note" ? ".md" : ".yml";
  const nodePath = node.fname + ext;
  const wsRoot = DendronWorkspace.wsRoot();
  const vault = node.vault;
  const vpath = vault2Path({ wsRoot, vault });
  return Uri.file(path.join(vpath, nodePath));
}

export async function showDocAndHidePicker(
  uris: Uri[],
  picker: DendronQuickPickerV2
) {
  const ctx = "showDocAndHidePicker";
  const maybeSplitSelection = _.find(picker.buttons, (ent: DendronBtn) => {
    return getButtonCategory(ent) === "split" && ent.pressed;
  });
  let viewColumn = ViewColumn.Active;
  if (maybeSplitSelection) {
    const splitType = (maybeSplitSelection as DendronBtn).type;
    if (splitType === "horizontal") {
      viewColumn = ViewColumn.Beside;
    } else {
      // TODO: close current button
      // await commands.executeCommand("workbench.action.splitEditorDown");
    }
  }

  await Promise.all(
    uris.map(async (uri) => {
      return window.showTextDocument(uri, { viewColumn }).then(
        () => {
          Logger.info({ ctx, msg: "showTextDocument", fsPath: uri.fsPath });
          picker.hide();
          return;
        },
        (err) => {
          Logger.error({ ctx, error: err, msg: "exit" });
          throw err;
        }
      );
    })
  );
  return uris;
}

export type CreateQuickPickOpts = {
  title: string;
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
};

export type PrepareQuickPickOpts = CreateQuickPickOpts & {
  provider: ILookupProviderV3;
};

export type ShowQuickPickOpts = {
  quickpick: DendronQuickPickerV2;
  provider: ILookupProviderV3;
  nonInteractive?: boolean;
  fuzzThreshold?: number;
};

export type OldNewLocation = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc & { note?: NoteProps };
};

export class ProviderAcceptHooks {
  /**
   * Returns current location and new location for note
   * @param param0
   * @returns
   */
  static oldNewLocationHook: OnAcceptHook = async ({
    quickpick,
    selectedItems,
  }): Promise<RespV2<OldNewLocation>> => {
    // setup vars
    const oldVault = PickerUtilsV2.getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : oldVault;
    const wsRoot = DendronWorkspace.wsRoot();
    const ws = getWS();
    const engine = ws.getEngine();
    const notes = engine.notes;

    // get old note
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const oldFname = DNodeUtils.fname(oldUri.fsPath);

    const selectedItem = selectedItems[0];
    const fname = PickerUtilsV2.isCreateNewNotePickForSingle(selectedItem)
      ? quickpick.value
      : selectedItem.fname;

    // get new note
    const newNote = NoteUtils.getNoteByFnameV5({
      fname,
      notes,
      vault: newVault,
      wsRoot,
    });
    const isStub = newNote?.stub;
    if (newNote && !isStub) {
      const vaultName = VaultUtils.getName(newVault);
      const errMsg = `${vaultName}/${quickpick.value} exists`;
      window.showErrorMessage(errMsg);
      return {
        error: new DendronError({ message: errMsg }),
      };
    }
    const data: RenameNoteOpts = {
      oldLoc: {
        fname: oldFname,
        vaultName: VaultUtils.getName(oldVault),
      },
      newLoc: {
        fname: quickpick.value,
        vaultName: VaultUtils.getName(newVault),
      },
    };
    return { data, error: null };
  };
}

export class PickerUtilsV2 {
  static createDefaultItems = ({
    picker,
    vault,
  }: {
    picker: DendronQuickPickerV2;
    vault: DVault;
  }) => {
    const out = [];
    if (_.find(picker.buttons, { type: "multiSelect" })?.pressed) {
      return [];
    } else {
      out.push(NotePickerUtils.createNoActiveItem(vault));
    }
    return out;
  };

  static createDendronQuickPick(opts: CreateQuickPickOpts) {
    const { title, placeholder, ignoreFocusOut, initialValue } = _.defaults(
      opts,
      {
        ignoreFocusOut: true,
      }
    );
    const quickPick =
      window.createQuickPick<DNodePropsQuickInputV2>() as DendronQuickPickerV2;
    quickPick.title = title;
    quickPick.nonInteractive = opts.nonInteractive;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick._justActivated = true;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
    quickPick.sortByLabel = false;
    quickPick.showNote = async (uri) => window.showTextDocument(uri);
    if (initialValue) {
      quickPick.value = initialValue;
    }
    return quickPick;
  }

  static createDendronQuickPickItem(
    opts: DNodePropsQuickInputV2
  ): DNodePropsQuickInputV2 {
    return {
      ...opts,
    };
  }

  static createDendronQuickPickItemFromNote(
    opts: NoteProps
  ): DNodePropsQuickInputV2 {
    return {
      ...opts,
      label: opts.fname,
    };
  }

  static dumpPicker(picker: DendronQuickPickerV2) {
    const activeItems = picker.activeItems.map((ent) =>
      NoteUtils.toLogObj(ent)
    );
    const selectedItems = picker.selectedItems.map((ent) =>
      NoteUtils.toLogObj(ent)
    );
    const value = picker.value;
    return { activeItems, selectedItems, value };
  }

  static getValue(picker: DendronQuickPickerV2) {
    return picker.value;
  }

  static getSelection(picker: DendronQuickPickerV2): DNodePropsQuickInputV2[] {
    return [...picker.selectedItems];
  }

  static filterCreateNewItem = (
    items: DNodePropsQuickInputV2[]
  ): DNodePropsQuickInputV2[] => {
    return _.reject(items, { label: CREATE_NEW_LABEL });
  };

  static filterDefaultItems = (
    items: DNodePropsQuickInputV2[]
  ): DNodePropsQuickInputV2[] => {
    return _.reject(
      items,
      (ent) =>
        ent.label === CREATE_NEW_LABEL || ent.label === MORE_RESULTS_LABEL
    );
  };

  /**
   * Reject all items that are over a given level
   * @param items
   * @param lvl
   */
  static filterByDepth = (
    items: DNodePropsQuickInputV2[],
    depth: number
  ): DNodePropsQuickInputV2[] => {
    return _.reject(items, (ent) => {
      return DNodeUtils.getDepth(ent) > depth;
    });
  };

  /** Reject all items that are stubs */
  static filterNonStubs(
    items: DNodePropsQuickInputV2[]
  ): DNodePropsQuickInputV2[] {
    return _.filter(items, (ent) => {
      return !ent.stub;
    });
  }

  static getFnameForOpenEditor(): string | undefined {
    const activeEditor = VSCodeUtils.getActiveTextEditor();
    if (activeEditor) {
      return path.basename(activeEditor.document.fileName, ".md");
    }
    return;
  }

  /**
   * Defaults to first vault if current note is not part of a vault
   * @returns
   */
  static getVaultForOpenEditor(): DVault {
    const ctx = "getVaultForOpenEditor";
    const vaults = DendronWorkspace.instance().vaultsv4;
    let vault: DVault;
    const activeDocument = VSCodeUtils.getActiveTextEditor()?.document;
    if (
      activeDocument &&
      getWS().workspaceService?.isPathInWorkspace(activeDocument.uri.fsPath)
    ) {
      Logger.info({ ctx, activeDocument: activeDocument.fileName });
      vault = VaultUtils.getVaultByNotePath({
        vaults,
        wsRoot: DendronWorkspace.wsRoot(),
        fsPath: activeDocument.uri.fsPath,
      });
    } else {
      Logger.info({ ctx, msg: "no active doc" });
      vault = vaults[0];
    }
    // TODO: remove
    Logger.info({ ctx, msg: "exit", vault });
    return vault;
  }

  static getOrPromptVaultForOpenEditor(): DVault {
    return PickerUtilsV2.getVaultForOpenEditor();
  }

  static getQueryUpToLastDot = (query: string) => {
    return query.lastIndexOf(".") >= 0
      ? query.slice(0, query.lastIndexOf("."))
      : "";
  };

  static isCreateNewNotePickForSingle(node: DNodePropsQuickInputV2): boolean {
    if (!node) {
      return true;
    }
    if (node.detail === CREATE_NEW_DETAIL || node.stub || node.schemaStub) {
      return true;
    } else {
      return false;
    }
  }

  static isCreateNewNotePick(node: DNodePropsQuickInputV2): boolean {
    if (!node) {
      return true;
    }
    if (node.detail === CREATE_NEW_DETAIL || node.stub || node.schemaStub) {
      return true;
    } else {
      return false;
    }
  }

  static isInputEmpty(value?: string): value is undefined {
    if (_.isUndefined(value)) {
      return true;
    }
    if (_.isEmpty(value)) {
      return true;
    }
    return false;
  }

  public static async getOrPromptVaultForNewNote({
    vault,
    fname,
    vaultSelectionMode = VaultSelectionMode.smart,
  }: {
    vault: DVault;
    fname: string;
    vaultSelectionMode?: VaultSelectionMode;
  }): Promise<DVault | undefined> {
    const vaultSuggestions = await PickerUtilsV2.getVaultRecommendations({
      vault,
      fname
    });

    if (vaultSuggestions?.length === 1 || vaultSelectionMode === VaultSelectionMode.auto) {
      return vaultSuggestions[0].vault;
    }

    // Auto select for the user if either the hierarchy pattern matches in the
    // current vault context, or if there are no hierarchy matches
    if (vaultSelectionMode === VaultSelectionMode.smart) {
      if (
        vaultSuggestions[0].detail === FULL_MATCH_DETAIL ||
        vaultSuggestions[0].detail === CONTEXT_DETAIL
      ) {
        return vaultSuggestions[0].vault;
      }
    }

    return PickerUtilsV2.promptVault(vaultSuggestions);
  }

  public static promptVault(overrides?: DVault[]): Promise<DVault | undefined>;
  public static promptVault(
    overrides?: VaultPickerItem[]
  ): Promise<DVault | undefined>;
  public static async promptVault(
    overrides?: VaultPickerItem[] | DVault[]
  ): Promise<DVault | undefined> {
    const pickerOverrides = isDVaultArray(overrides)
      ? overrides.map((value) => {
          return { vault: value };
        })
      : overrides;

    const vaults: VaultPickerItem[] =
      pickerOverrides ??
      DendronWorkspace.instance().vaultsv4.map((value) => {
        return { vault: value };
      });

    const items = vaults.map((ent) => ({
      ...ent,
      label: ent.label ? ent.label : ent.vault.fsPath,
    }));
    const resp = await VSCodeUtils.showQuickPick(items, {
      title: "Select Vault",
    });

    return resp ? resp.vault : undefined;
  }

  /**
   * Determine which vault(s) are the most appropriate to create this note in.
   * Vaults determined as better matches appear earlier in the returned array
   * @param
   * @returns
   */
  static async getVaultRecommendations({
    vault,
    fname
  }: {
    vault: DVault;
    fname: string;
  }): Promise<VaultPickerItem[]> {
    let vaultSuggestions: VaultPickerItem[] = [];

    const engine = getWS().getEngine();

    // Only 1 vault, no other options to choose from:
    if (engine.vaults.length <= 1) {
      return Array.of({ vault });
    }

    const domain = fname.split(".").slice(0, -1);
    const newQs = domain.join(".");
    const queryResponse = await engine.queryNotes({
      qs: newQs,
      createIfNew: false,
    });

    // Sort Alphabetically by the Path Name
    const sortByPathNameFn = (a: DVault, b: DVault) => {
      return a.fsPath <= b.fsPath ? -1 : 1;
    };
    const allVaults = engine.vaults.sort(sortByPathNameFn);

    const vaultsWithMatchingHierarchy: VaultPickerItem[] | undefined =
      queryResponse.data
        .filter((value) => value.fname === newQs)
        .map((value) => value.vault)
        .sort(sortByPathNameFn)
        .map((value) => {
          return {
            vault: value,
            detail: HIERARCHY_MATCH_DETAIL,
          };
        });

    if (!vaultsWithMatchingHierarchy) {
      // Suggest current vault context as top suggestion
      vaultSuggestions.push({
        vault,
        detail: CONTEXT_DETAIL,
      });

      allVaults.forEach((cmpVault) => {
        if (cmpVault.fsPath !== vault.fsPath) {
          vaultSuggestions.push({ vault: cmpVault });
        }
      });
    }
    // One of the vaults with a matching hierarchy is also the current note context:
    else if (
      vaultsWithMatchingHierarchy.find(
        (value) => value.vault.fsPath === vault.fsPath
      ) !== undefined
    ) {
      // Prompt with matching hierarchies & current context, THEN other matching contexts; THEN any other vaults
      vaultSuggestions.push({
        vault,
        detail: FULL_MATCH_DETAIL,
      });

      vaultsWithMatchingHierarchy.forEach((ent) => {
        if (
          !vaultSuggestions.find(
            (suggestion) => suggestion.vault.fsPath === ent.vault.fsPath
          )
        ) {
          vaultSuggestions.push({
            vault: ent.vault,
            detail: HIERARCHY_MATCH_DETAIL,
          });
        }
      });

      allVaults.forEach((wsVault) => {
        if (
          !vaultSuggestions.find(
            (suggestion) => suggestion.vault.fsPath === wsVault.fsPath
          )
        ) {
          vaultSuggestions.push({ vault: wsVault });
        }
      });
    } else {
      // Suggest vaults with matching hierarchy, THEN current note context, THEN any other vaults
      vaultSuggestions = vaultSuggestions.concat(vaultsWithMatchingHierarchy);
      vaultSuggestions.push({
        vault,
        detail: CONTEXT_DETAIL,
      });

      allVaults.forEach((wsVault) => {
        if (
          !vaultSuggestions.find(
            (suggestion) => suggestion.vault.fsPath === wsVault.fsPath
          )
        ) {
          vaultSuggestions.push({ vault: wsVault });
        }
      });
    }

    return vaultSuggestions;
  }

  static refreshButtons(opts: {
    quickpick: DendronQuickPickerV2;
    buttons: DendronBtn[];
    buttonsPrev: DendronBtn[];
  }) {
    opts.buttonsPrev = opts.quickpick.buttons.map((b: DendronBtn) => b.clone());
    opts.quickpick.buttons = opts.buttons;
  }

  /**
   * Toggle all button enablement effects
   * @param opts
   */
  static async refreshPickerBehavior(opts: {
    quickpick: DendronQuickPickerV2;
    buttons: DendronBtn[];
  }) {
    const buttonsEnabled = _.filter(opts.buttons, { pressed: true });
    const buttonsDisabled = _.filter(opts.buttons, { pressed: false });
    await Promise.all(
      buttonsEnabled.map((bt) => {
        bt.onEnable({ quickPick: opts.quickpick });
      })
    );
    await Promise.all(
      buttonsDisabled.map((bt) => {
        bt.onDisable({ quickPick: opts.quickpick });
      })
    );
  }

  static resetPaginationOpts(picker: DendronQuickPickerV2) {
    delete picker.moreResults;
    delete picker.offset;
    delete picker.allResults;
  }

  static slashToDot(ent: string) {
    return ent.replace(/\//g, ".");
  }
}

export class NotePickerUtils {
  static createNoActiveItem(vault: DVault): DNodePropsQuickInputV2 {
    const props = DNodeUtils.create({
      fname: CREATE_NEW_LABEL,
      type: "note",
      vault,
    });
    return {
      ...props,
      label: CREATE_NEW_LABEL,
      detail: CREATE_NEW_DETAIL,
      alwaysShow: true,
    };
  }

  static getInitialValueFromOpenEditor() {
    const initialValue = path.basename(
      VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath || "",
      ".md"
    );
    return initialValue;
  }

  static getSelection(picker: DendronQuickPickerV2): NoteQuickInput[] {
    return [...picker.selectedItems];
  }

  static fetchRootResults = (opts: { engine: DEngineClient }) => {
    const { engine } = opts;
    const nodeDict = engine.notes;
    const roots = NoteUtils.getRoots(nodeDict);
    const childrenOfRoot = roots.flatMap((ent) => ent.children);
    const nodes = _.map(childrenOfRoot, (ent) => nodeDict[ent]).concat(roots);
    return nodes.map((ent) => {
      return DNodeUtils.enhancePropForQuickInput({
        wsRoot: DendronWorkspace.wsRoot(),
        props: ent,
        schemas: engine.schemas,
        vaults: DendronWorkspace.instance().vaultsv4,
      });
    });
  };

  static async fetchPickerResults(opts: {
    picker: DendronQuickPickerV2;
    qs: string;
  }) {
    const ctx = "createPickerItemsFromEngine";
    const start = process.hrtime();
    const { picker, qs } = opts;
    const engine = getWS().getEngine();
    let nodes: NoteProps[];
    // if we are doing a query, reset pagination options
    PickerUtilsV2.resetPaginationOpts(picker);
    const resp = await engine.queryNotes({ qs });
    nodes = resp.data;
    if (nodes.length > PAGINATE_LIMIT) {
      picker.allResults = nodes;
      picker.offset = PAGINATE_LIMIT;
      picker.moreResults = true;
      nodes = nodes.slice(0, PAGINATE_LIMIT);
    } else {
      PickerUtilsV2.resetPaginationOpts(picker);
    }
    const updatedItems = await Promise.all(
      nodes.map(async (ent) =>
        DNodeUtils.enhancePropForQuickInputV3({
          wsRoot: DendronWorkspace.wsRoot(),
          props: ent,
          schemas: engine.schemas,
          vaults: DendronWorkspace.instance().vaultsv4,
          alwaysShow: picker.alwaysShowAll,
        })
      )
    );
    const profile = getDurationMilliseconds(start);
    Logger.info({ ctx, msg: "engine.query", profile });
    return updatedItems;
  }
}
