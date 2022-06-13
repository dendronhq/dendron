/* eslint-disable no-dupe-class-members */
import {
  DendronError,
  DEngineClient,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNodeUtils,
  DNoteLoc,
  DVault,
  FuseEngine,
  NoteProps,
  NoteUtils,
  OrderedMatcher,
  RenameNoteOpts,
  RespV2,
  TransformedQueryString,
  VaultUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import _, { orderBy } from "lodash";
import path from "path";
import stringSimilarity from "string-similarity";
import { QuickPickItem, TextEditor, Uri, ViewColumn, window } from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronBtn, getButtonCategory } from "./ButtonTypes";
import {
  CREATE_NEW_DETAIL_LIST,
  CREATE_NEW_LABEL,
  CREATE_NEW_NOTE_DETAIL,
  MORE_RESULTS_LABEL,
} from "./constants";
import type { CreateQuickPickOpts } from "./LookupControllerV3Interface";
import { OnAcceptHook } from "./LookupProviderV3Interface";
import {
  DendronQuickPickerV2,
  DendronQuickPickState,
  VaultSelectionMode,
} from "./types";

export const UPDATET_SOURCE = {
  UPDATE_PICKER_FILTER: "UPDATE_PICKER_FILTER",
};

// Vault Recommendation Detail Descriptions
export const CONTEXT_DETAIL = "current note context";
export const HIERARCHY_MATCH_DETAIL = "hierarchy match";
export const FULL_MATCH_DETAIL = "hierarchy match and current note context";

export type VaultPickerItem = { vault: DVault; label: string } & Partial<
  Omit<QuickPickItem, "label">
>;

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
    detail: CREATE_NEW_NOTE_DETAIL,
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
  const { wsRoot } = ExtensionProvider.getDWorkspace();
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

export type OldNewLocation = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc & { note?: NoteProps };
};

export type NewLocation = {
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
    const engine = ExtensionProvider.getEngine();

    // get old note
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const oldUri: Uri = editor.document.uri;
    const oldFname = DNodeUtils.fname(oldUri.fsPath);

    const selectedItem = selectedItems[0];
    const fname = PickerUtilsV2.isCreateNewNotePickForSingle(selectedItem)
      ? quickpick.value
      : selectedItem.fname;

    // get new note
    const newNote = NoteUtils.getNoteByFnameFromEngine({
      fname,
      engine,
      vault: newVault,
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

  static NewLocationHook: OnAcceptHook = async ({
    quickpick,
  }): Promise<RespV2<NewLocation>> => {
    const activeEditorVault = PickerUtilsV2.getVaultForOpenEditor();
    const newVault = quickpick.vault ? quickpick.vault : activeEditorVault;

    const data = {
      newLoc: {
        fname: quickpick.value,
        vaultName: VaultUtils.getName(newVault),
      },
    };

    return { data, error: null };
  };
}

export class PickerUtilsV2 {
  static createDendronQuickPick(
    opts: CreateQuickPickOpts
  ): DendronQuickPickerV2 {
    const { title, placeholder, ignoreFocusOut, initialValue } = _.defaults(
      opts,
      {
        ignoreFocusOut: true,
      }
    );
    const quickPick =
      window.createQuickPick<DNodePropsQuickInputV2>() as DendronQuickPickerV2;
    quickPick.title = title;
    quickPick.state = DendronQuickPickState.IDLE;
    quickPick.nonInteractive = opts.nonInteractive;
    quickPick.placeholder = placeholder;
    quickPick.ignoreFocusOut = ignoreFocusOut;
    quickPick._justActivated = true;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
    quickPick.sortByLabel = false;
    quickPick.showNote = async (uri) => window.showTextDocument(uri);
    if (initialValue !== undefined) {
      quickPick.rawValue = initialValue;
      quickPick.prefix = initialValue;
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
    const { vaults, wsRoot } = ExtensionProvider.getDWorkspace();

    let vault: DVault;
    const activeDocument = VSCodeUtils.getActiveTextEditor()?.document;
    if (
      activeDocument &&
      WorkspaceUtils.isPathInWorkspace({
        wsRoot,
        vaults,
        fpath: activeDocument.uri.fsPath,
      })
    ) {
      Logger.info({ ctx, activeDocument: activeDocument.fileName });
      vault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
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

  /** @deprecated use `getVaultForOpenEditor` instead, this function no longer prompts anything. */
  static getOrPromptVaultForOpenEditor(): DVault {
    return PickerUtilsV2.getVaultForOpenEditor();
  }

  static getQueryUpToLastDot = (query: string) => {
    return query.lastIndexOf(".") >= 0
      ? query.slice(0, query.lastIndexOf("."))
      : "";
  };

  static getCreateNewItem = (
    items: readonly DNodePropsQuickInputV2[]
  ): DNodePropsQuickInputV2 | undefined => {
    return _.find(items, { label: CREATE_NEW_LABEL });
  };

  /**
   * Check if this picker still has further pickers
   */
  static hasNextPicker = (
    quickpick: DendronQuickPickerV2,
    opts: {
      selectedItems: readonly DNodePropsQuickInputV2[];
      providerId: string;
    }
  ): quickpick is Required<DendronQuickPickerV2> => {
    const { selectedItems, providerId } = opts;
    const nextPicker = quickpick.nextPicker;
    const isNewPick = PickerUtilsV2.isCreateNewNotePick(selectedItems[0]);
    const isNewPickAllowed = ["lookup", "dendron.moveHeader"];
    return (
      !_.isUndefined(nextPicker) &&
      (isNewPickAllowed.includes(providerId) ? isNewPick : true)
    );
  };

  static isCreateNewNotePickForSingle(node: DNodePropsQuickInputV2): boolean {
    if (!node) {
      return true;
    }
    if (
      CREATE_NEW_DETAIL_LIST.includes(node.detail || "") ||
      node.stub ||
      node.schemaStub
    ) {
      return true;
    } else {
      return false;
    }
  }

  static isCreateNewNotePick(node: DNodePropsQuickInputV2): boolean {
    if (!node) {
      return true;
    }
    if (
      CREATE_NEW_DETAIL_LIST.includes(node.detail || "") ||
      node.stub ||
      node.schemaStub
    ) {
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
    const engine = ExtensionProvider.getEngine();
    const vaultSuggestions = await PickerUtilsV2.getVaultRecommendations({
      vault,
      vaults: engine.vaults,
      engine,
      fname,
    });

    if (
      vaultSuggestions?.length === 1 ||
      vaultSelectionMode === VaultSelectionMode.auto
    ) {
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
    const { vaults: wsVaults } = ExtensionProvider.getDWorkspace();
    const pickerOverrides = isDVaultArray(overrides)
      ? overrides.map((value) => {
          return { vault: value, label: VaultUtils.getName(value) };
        })
      : overrides;

    const vaults: VaultPickerItem[] =
      pickerOverrides ??
      wsVaults.map((vault) => {
        return { vault, label: VaultUtils.getName(vault) };
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
    vaults,
    engine,
    fname,
  }: {
    vault: DVault;
    vaults: DVault[];
    engine: DEngineClient;
    fname: string;
  }): Promise<VaultPickerItem[]> {
    let vaultSuggestions: VaultPickerItem[] = [];

    // Only 1 vault, no other options to choose from:
    if (vaults.length <= 1) {
      return Array.of({ vault, label: VaultUtils.getName(vault) });
    }

    const domain = fname.split(".").slice(0, -1);
    const newQs = domain.join(".");
    const queryResponse = await engine.queryNotes({
      qs: newQs,
      originalQS: newQs,
      createIfNew: false,
    });

    // Sort Alphabetically by the Path Name
    const sortByPathNameFn = (a: DVault, b: DVault) => {
      return a.fsPath <= b.fsPath ? -1 : 1;
    };
    let allVaults = engine.vaults.sort(sortByPathNameFn);

    const vaultsWithMatchingHierarchy: VaultPickerItem[] | undefined =
      queryResponse.data
        .filter((value) => value.fname === newQs)
        .map((value) => value.vault)
        .sort(sortByPathNameFn)
        .map((value) => {
          return {
            vault: value,
            detail: HIERARCHY_MATCH_DETAIL,
            label: VaultUtils.getName(value),
          };
        });

    if (!vaultsWithMatchingHierarchy) {
      // Suggest current vault context as top suggestion
      vaultSuggestions.push({
        vault,
        detail: CONTEXT_DETAIL,
        label: VaultUtils.getName(vault),
      });

      allVaults.forEach((cmpVault) => {
        if (cmpVault !== vault) {
          vaultSuggestions.push({
            vault: cmpVault,
            label: VaultUtils.getName(vault),
          });
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
        label: VaultUtils.getName(vault),
      });

      // remove from allVaults the one we already pushed.
      allVaults = _.filter(allVaults, (v) => {
        return !_.isEqual(v, vault);
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
            label: VaultUtils.getName(ent.vault),
          });
          // remove from allVaults the one we already pushed.
          allVaults = _.filter(allVaults, (v) => {
            return !_.isEqual(v, ent.vault);
          });
        }
      });

      // push the rest of the vaults
      allVaults.forEach((wsVault) => {
        vaultSuggestions.push({
          vault: wsVault,
          label: VaultUtils.getName(wsVault),
        });
      });
    } else {
      // Suggest vaults with matching hierarchy, THEN current note context, THEN any other vaults
      vaultSuggestions = vaultSuggestions.concat(vaultsWithMatchingHierarchy);
      vaultSuggestions.push({
        vault,
        detail: CONTEXT_DETAIL,
        label: VaultUtils.getName(vault),
      });

      allVaults = _.filter(allVaults, (v) => {
        return !_.isEqual(v, vault);
      });

      allVaults.forEach((wsVault) => {
        vaultSuggestions.push({
          vault: wsVault,
          label: VaultUtils.getName(wsVault),
        });
      });
    }

    return vaultSuggestions;
  }

  static resetPaginationOpts(picker: DendronQuickPickerV2) {
    delete picker.moreResults;
    delete picker.offset;
    delete picker.allResults;
  }
}

function countDots(subStr: string) {
  return Array.from(subStr).filter((ch) => ch === ".").length;
}

function sortForQueryEndingWithDot(
  transformedQuery: TransformedQueryString,
  itemsToFilter: NoteProps[]
) {
  const lowercaseQuery = transformedQuery.originalQuery.toLowerCase();

  // If the user enters the query 'data.' we want to keep items that have 'data.'
  // and sort the results in the along the following order:
  //
  // ```
  // data.driven                  (data. has clean-match, grandchild-free, 1st in hierarchy)
  // level1.level2.data.integer   (data. has clean-match, grandchild-free, 3rd in hierarchy)
  // l1.l2.l3.data.bool           (data. has clean-match, grandchild-free, 4th in hierarchy)
  // l1.with-data.and-child       (data. has partial match 2nd level)
  // l1.l2.with-data.and-child    (data. has partial match 3rd level)
  // level1.level2.data.integer.has-grandchild
  // l1.l2.with-data.and-child.has-grandchild
  // data.stub (Stub notes come at the end).
  // ```

  const itemsWithMetadata = itemsToFilter
    .map((item) => {
      // Firstly pre-process the items in attempt to find the match.
      const lowercaseFName = item.fname.toLowerCase();
      const matchIndex = lowercaseFName.indexOf(lowercaseQuery);
      return { matchIndex, item };
    })
    // Filter out items without a match.
    .filter((item) => item.matchIndex !== -1)
    // Filter out items where the match is at the end (match does not have children)
    .filter(
      (item) =>
        !(item.matchIndex + lowercaseQuery.length === item.item.fname.length)
    )
    .map((item) => {
      // Meaning the match takes up entire level of the hierarchy.
      // 'one.two-hi.three'->'two-hi.' is clean match while 'o-hi.' is a
      // match but not a clean one.
      const isCleanMatch =
        item.matchIndex === 0 ||
        item.item.fname.charAt(item.matchIndex - 1) === ".";

      const dotsBeforeMatch = countDots(
        item.item.fname.substring(0, item.matchIndex)
      );
      const dotsAfterMatch = countDots(
        item.item.fname.substring(item.matchIndex + lowercaseQuery.length)
      );
      const isStub = item.item.stub;
      const zeroGrandchildren = dotsAfterMatch === 0;
      return {
        isStub,
        dotsBeforeMatch,
        dotsAfterMatch,
        zeroGrandchildren,
        isCleanMatch,
        ...item,
      };
    });

  const sortOrder: { fieldName: string; order: "asc" | "desc" }[] = [
    { fieldName: "isStub", order: "desc" },
    { fieldName: "zeroGrandchildren", order: "desc" },
    { fieldName: "isCleanMatch", order: "desc" },
    { fieldName: "dotsAfterMatch", order: "asc" },
    { fieldName: "dotsBeforeMatch", order: "asc" },
  ];

  return orderBy(
    itemsWithMetadata,
    sortOrder.map((it) => it.fieldName),
    sortOrder.map((it) => it.order)
  ).map((item) => item.item);
}

export const filterPickerResults = ({
  itemsToFilter,
  transformedQuery,
}: {
  itemsToFilter: NoteProps[];
  transformedQuery: TransformedQueryString;
}): NoteProps[] => {
  // If we have specific vault name within the query then keep only those results
  // that match the specific vault name.
  if (transformedQuery.vaultName) {
    itemsToFilter = itemsToFilter.filter(
      (item) => VaultUtils.getName(item.vault) === transformedQuery.vaultName
    );
  }

  // Ending the query with a dot adds special processing of showing matched descendents.
  if (transformedQuery.originalQuery.endsWith(".")) {
    itemsToFilter = sortForQueryEndingWithDot(transformedQuery, itemsToFilter);
  }

  if (transformedQuery.splitByDots && transformedQuery.splitByDots.length > 0) {
    const matcher = new OrderedMatcher(transformedQuery.splitByDots);

    itemsToFilter = itemsToFilter.filter((item) => matcher.isMatch(item.fname));
  }

  if (transformedQuery.wasMadeFromWikiLink) {
    // If we are dealing with a wiki link we want to show only the exact matches
    // for the link instead some fuzzy/partial matches.
    itemsToFilter = itemsToFilter.filter(
      (item) => item.fname === transformedQuery.queryString
    );
  }

  return itemsToFilter;
};

/** This function presumes that 'CreateNew' should be shown and determines whether
 *  CreateNew should be at the top of the look up results or not. */
export function shouldBubbleUpCreateNew({
  numberOfExactMatches,
  querystring,
  bubbleUpCreateNew,
}: {
  numberOfExactMatches: number;
  querystring: string;
  bubbleUpCreateNew?: boolean;
}) {
  // We don't want to bubble up create new if there is an exact match since
  // vast majority of times if there is an exact match user wants to navigate to it
  // rather than create a new file with exact same file name in different vault.
  const noExactMatches = numberOfExactMatches === 0;

  // Note: one of the special characters is space/' ' which for now we want to allow
  // users to make the files with ' ' in them but we won't bubble up the create new
  // option for the special characters, including space. The more contentious part
  // about previous/current behavior is that we allow creation of files with
  // characters like '$' which FuseJS will not match (Meaning '$' will NOT match 'hi$world').
  const noSpecialQueryChars =
    !FuseEngine.doesContainSpecialQueryChars(querystring);

  if (_.isUndefined(bubbleUpCreateNew)) bubbleUpCreateNew = true;

  return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
}

/**
 * Sorts the given candidates notes by similarity to the query string in
 * descending order (the most similar come first) */
export function sortBySimilarity(candidates: NoteProps[], query: string) {
  return (
    candidates
      // To avoid duplicate similarity score calculation we will first map
      // to have the similarity score cached and then sort using cached value.
      .map((cand) => ({
        cand,
        similarityScore: stringSimilarity.compareTwoStrings(cand.fname, query),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .map((v) => v.cand)
  );
}
