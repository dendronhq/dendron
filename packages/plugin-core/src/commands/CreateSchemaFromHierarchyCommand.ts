import {
  DVault,
  NotePropsMeta,
  NoteUtils,
  SchemaCreationUtils,
  SchemaInMaking,
  SchemaModuleProps,
  SchemaToken,
  SchemaUtils,
} from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
import * as fs from "fs";
import * as _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { PluginSchemaUtils } from "../pluginSchemaUtils";
import { PluginVaultUtils } from "../pluginVaultUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  candidates?: readonly SchemaCandidate[];
  schemaName?: string;
  hierarchyLevel?: HierarchyLevel;
  uri?: Uri;
  isHappy: boolean;
  stopReason?: StopReason;
};

type CommandOutput = {
  successfullyCreated: boolean;
};

/**
 * Represents the level of the file hierarchy that will have the '*' pattern.
 * */
export class HierarchyLevel {
  label: string;
  hierarchyTokens: string[];
  idx: number;
  noteMatchRegex: RegExp;

  constructor(idx: number, tokens: string[]) {
    this.hierarchyTokens = tokens;
    this.idx = idx;
    // https://regex101.com/r/kmOBbq/1
    this.noteMatchRegex = new RegExp(
      "^" + this.hierarchyTokens.slice(0, this.idx).join(".") + "\\..*"
    );
    this.label =
      [...tokens.slice(0, idx), "*", ...tokens.slice(idx + 1)].join(".") +
      ` (${tokens[idx]})`;
  }

  /** Id of the first token of the hierarchy (will be utilized for identifying the schema) */
  topId() {
    return this.hierarchyTokens[0];
  }

  tokenize(fname: string): string[] {
    const tokens = fname.split(".");

    return [...tokens.slice(0, this.idx), "*", ...tokens.slice(this.idx + 1)];
  }

  isCandidateNote(fname: string): boolean {
    return this.noteMatchRegex.test(fname);
  }

  getDefaultSchemaName() {
    // Schema naming currently is set to be a single level deep hence
    // we should avoid using '.' in schema names.
    return this.hierarchyTokens.slice(0, this.idx).join("-");
  }
}

export class Hierarchy {
  fname: string;
  levels: HierarchyLevel[];
  tokens: string[];

  constructor(fname: string) {
    this.fname = fname;
    this.tokens = fname.split(".");
    this.levels = [];
    for (let i = 0; i < this.tokens.length; i += 1) {
      this.levels.push(new HierarchyLevel(i, this.tokens));
    }
  }

  depth() {
    return this.tokens.length;
  }

  topId() {
    return this.levels[0].topId();
  }

  /**
   * Levels of the hierarchy that we deem as viable options for creating a schema for.
   * We remove the first level since having something like `*.h1.h2` with `*` at the
   * beginning will match all hierarchies. Therefore we slice off the first level.
   *
   * */
  getSchemaebleLevels() {
    return this.levels.slice(1);
  }
}

export type SchemaCandidate = {
  note: NotePropsMeta;
  label: string;
  detail: string;
};

function isDescendentOf(
  descendentCandidate: SchemaCandidate,
  ancestorCandidate: SchemaCandidate
) {
  const isChild = descendentCandidate.note.fname.startsWith(
    ancestorCandidate.note.fname + "."
  );
  return isChild;
}

function createCandidatesMapByFname(items: readonly SchemaCandidate[]) {
  return new Map(items.map((item) => [item.note.fname, item]));
}

function getUriFromSchema(schema: SchemaModuleProps) {
  const vaultPath = vault2Path({
    vault: schema.vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  const uri = Uri.file(
    SchemaUtils.getPath({ root: vaultPath, fname: schema.fname })
  );
  return uri;
}

function getSchemaUri(vault: DVault, schemaName: string) {
  const vaultPath = vault2Path({
    vault,
    wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
  });
  const uri = Uri.file(
    SchemaUtils.getPath({ root: vaultPath, fname: schemaName })
  );
  return uri;
}

export enum StopReason {
  SCHEMA_WITH_TOP_ID_ALREADY_EXISTS = "SCHEMA_WITH_TOP_ID_ALREADY_EXISTS",
  NOTE_DID_NOT_HAVE_REQUIRED_DEPTH = "NOTE_DID_NOT_HAVE_REQUIRED_DEPTH",
  DID_NOT_PICK_HIERARCHY_LEVEL = "DID_NOT_PICK_HIERARCHY_LEVEL",

  CANCELLED_PATTERN_SELECTION = "CANCELLED_PATTERN_SELECTION",
  UNSELECTED_ALL_PATTERNS = "UNSELECTED_ALL_PATTERNS",

  DID_NOT_PICK_SCHEMA_FILE_NAME = "DID_NOT_PICK_SCHEMA_FILE_NAME",
}

type HierarchyLevelRes = {
  hierarchyLevel?: HierarchyLevel;
  stopReason?: StopReason;
};
type PatternsFromCandidateRes = {
  pickedCandidates?: readonly SchemaCandidate[];
  stopReason?: StopReason;
};

/**
 * Encapsulates methods that are responsible for user interaction when
 * asking user for input data.
 * */
export class UserQueries {
  static async promptUserForSchemaFileName(
    hierarchyLevel: HierarchyLevel,
    vault: DVault
  ): Promise<string | undefined> {
    let alreadyExists = false;
    let schemaName: string | undefined;

    do {
      // eslint-disable-next-line no-await-in-loop
      schemaName = await VSCodeUtils.showInputBox({
        value: hierarchyLevel.getDefaultSchemaName(),
      });

      if (!schemaName) {
        // Cancelled.
        return schemaName;
      }

      alreadyExists = fs.existsSync(getSchemaUri(vault, schemaName).fsPath);
      if (alreadyExists) {
        vscode.window.showInformationMessage(
          `Schema with name '${schemaName}' already exists. Please choose a different name.`
        );
      }
    } while (alreadyExists);

    return schemaName;
  }

  static async promptUserToSelectHierarchyLevel(
    currDocFsPath: string
  ): Promise<HierarchyLevelRes> {
    const hierarchy = new Hierarchy(path.basename(currDocFsPath, ".md"));

    if (hierarchy.depth() <= 1) {
      // We require some depth to the hierarchy to be able to choose a variance
      // pattern within in it. More info within Hierarchy object.
      await vscode.window.showErrorMessage(
        `Pick a note with note depth greater than 1.`
      );

      return { stopReason: StopReason.NOTE_DID_NOT_HAVE_REQUIRED_DEPTH };
    }

    if (await PluginSchemaUtils.doesSchemaExist(hierarchy.topId())) {
      // To avoid unpredictable conflicts of schemas: for now we will not allow
      // creation schemas for hierarchies that already have existing top
      // level schema id. Instead we will pop up error message with navigation
      // action to the existing schema.
      const msgGoToSchema = "Go to schema";
      const action = await vscode.window.showErrorMessage(
        `Schema with top level id: '${hierarchy.topId()}' already exists.`,
        msgGoToSchema
      );
      if (action === msgGoToSchema) {
        const schema = await PluginSchemaUtils.getSchema(hierarchy.topId());
        if (schema.data) {
          await VSCodeUtils.openFileInEditor(getUriFromSchema(schema.data));
        }
      }

      return { stopReason: StopReason.SCHEMA_WITH_TOP_ID_ALREADY_EXISTS };
    }

    const hierarchyLevel: HierarchyLevel | undefined =
      await VSCodeUtils.showQuickPick(hierarchy.getSchemaebleLevels(), {
        title: "Select hierarchy level that will vary within note hierarchies.",
      });

    if (_.isUndefined(hierarchyLevel)) {
      return { stopReason: StopReason.DID_NOT_PICK_HIERARCHY_LEVEL };
    } else {
      return { hierarchyLevel };
    }
  }

  static promptUserToPickPatternsFromCandidates(
    labeledCandidates: SchemaCandidate[]
  ): Promise<PatternsFromCandidateRes> {
    let hasResolved = false;
    return new Promise((resolve) => {
      // There are limitations with .showQuickPick() for our use case (like checking/unchecking items)
      // hence we are using lower level createQuickPick().
      const quickPick = vscode.window.createQuickPick<SchemaCandidate>();
      quickPick.canSelectMany = true;
      quickPick.items = labeledCandidates;
      quickPick.selectedItems = quickPick.items;

      // By the time we get to onDidChangeSelection function quickPick.selectedItems
      // is already changed, hence we will keep our own copy of what was previously selected.
      let prevSelected: readonly SchemaCandidate[] = quickPick.selectedItems;

      quickPick.onDidChangeSelection(() => {
        const currSelected = quickPick.selectedItems;

        if (this.hasUnselected(prevSelected, currSelected)) {
          quickPick.selectedItems = this.determineAfterUnselect(
            prevSelected,
            currSelected
          );
        } else if (this.hasSelected(prevSelected, currSelected)) {
          quickPick.selectedItems = this.determineAfterSelect(
            prevSelected,
            currSelected,
            labeledCandidates
          );
        }

        prevSelected = quickPick.selectedItems;
      });
      quickPick.onDidHide(() => {
        if (!hasResolved) {
          resolve({ stopReason: StopReason.CANCELLED_PATTERN_SELECTION });
          hasResolved = true;
        }
        quickPick.dispose();
      });
      quickPick.onDidAccept(() => {
        if (quickPick.selectedItems.length === 0) {
          vscode.window.showErrorMessage(
            `Must select at least one pattern for schema creation.`
          );

          resolve({ stopReason: StopReason.UNSELECTED_ALL_PATTERNS });
        } else {
          resolve({ pickedCandidates: quickPick.selectedItems });
        }

        hasResolved = true;
        quickPick.hide();
      });
      quickPick.show();
    });
  }

  static determineAfterSelect(
    prevSelected: readonly SchemaCandidate[],
    currSelected: readonly SchemaCandidate[],
    all: SchemaCandidate[]
  ) {
    // When something is selected we want to make sure its hierarchical parents are selected
    // as well, since it makes no sense to have 'h1.h2.h3' selected without having
    // 'h1.h2' selected (since we will still need to create a schema path for 'h1.h2'.
    const justChecked = this.findCheckedItem(prevSelected, currSelected);

    const ancestorsToCheck = all.filter((ancestorCandidate) =>
      isDescendentOf(justChecked, ancestorCandidate)
    );

    // Create a map to avoid double counting ancestors
    const selectedMap = createCandidatesMapByFname(currSelected);
    ancestorsToCheck.forEach((ancestor) =>
      selectedMap.set(ancestor.note.fname, ancestor)
    );

    return Array.from(selectedMap.values());
  }

  static determineAfterUnselect(
    prevSelected: readonly SchemaCandidate[],
    currSelected: readonly SchemaCandidate[]
  ) {
    // When something is unselected we want to unselect all hierarchical
    // children of that note.
    const justUnchecked = this.findUncheckedItem(prevSelected, currSelected);

    const withoutUncheckedChildren = currSelected.filter(
      (item) => !isDescendentOf(item, justUnchecked)
    );
    return withoutUncheckedChildren;
  }

  static hasSelected(
    prevSelected: readonly SchemaCandidate[],
    currSelected: readonly SchemaCandidate[]
  ) {
    return prevSelected.length < currSelected.length;
  }

  static hasUnselected(
    prevSelected: readonly SchemaCandidate[],
    currSelected: readonly SchemaCandidate[]
  ) {
    return prevSelected.length > currSelected.length;
  }

  /** Finds the item from previously selected that is not selected anymore. */
  static findUncheckedItem(
    prevSelected: readonly SchemaCandidate[],
    currSelected: readonly SchemaCandidate[]
  ) {
    const map = createCandidatesMapByFname(currSelected);

    // The only time there will be more than one item unchecked in a single update event
    // is when all the items are unchecked at the same time. At such case we don't need to
    // worry about unchecking things anyway, hence we can just grab the first unchecked.
    const uncheckedItem = prevSelected.filter(
      (item) => !map.has(item.note.fname)
    )[0];

    return uncheckedItem;
  }

  /** Finds newly selected item.*/
  static findCheckedItem(
    prevSelected: readonly SchemaCandidate[],
    currSelected: readonly SchemaCandidate[]
  ) {
    const map = createCandidatesMapByFname(prevSelected);
    // The only time there will be more than checked one item in a single event
    // is when everything got checked. In that case we don't need to worry
    // about checking the parents anyway, hence we can just grab the first item.
    return currSelected.filter((item) => !map.has(item.note.fname))[0];
  }
}

/**
 * Responsible for forming the schema body from the hierarchical files that user chose. */
export class SchemaCreator {
  static makeSchemaBody({
    candidates,
    hierarchyLevel,
  }: {
    candidates: readonly SchemaCandidate[];
    hierarchyLevel: HierarchyLevel;
  }): string {
    const tokenizedMatrix: SchemaToken[][] = candidates.map((cand) =>
      hierarchyLevel.tokenize(cand.note.fname).map((value) => {
        return { pattern: value };
      })
    );

    const topLevel: SchemaInMaking = {
      // Top level schema requires an id to function.
      id: hierarchyLevel.topId(),
      title: hierarchyLevel.topId(),
      parent: "root",
    };

    return SchemaCreationUtils.getBodyForTokenizedMatrix({
      topLevel,
      tokenizedMatrix,
    });
  }
}

export class CreateSchemaFromHierarchyCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_SCHEMA_FROM_HIERARCHY.key;

  async sanityCheck() {
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();

    if (
      _.isUndefined(activeTextEditor) ||
      !NoteUtils.isNote(activeTextEditor.document.uri)
    ) {
      return "No note document open. Must have note document open for Create Schema from Hierarchy command.";
    }

    return;
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const activeTextEditor = VSCodeUtils.getActiveTextEditor();
    if (!activeTextEditor) {
      // Error message will be displayed from the sanityCheck function.
      return;
    }

    const currDocumentFSPath = activeTextEditor.document.uri.fsPath;
    const vault = PluginVaultUtils.getVaultByNotePath({
      fsPath: currDocumentFSPath,
    });
    const hierLvlOpts = await UserQueries.promptUserToSelectHierarchyLevel(
      currDocumentFSPath
    );
    if (hierLvlOpts.hierarchyLevel === undefined) {
      // User must have cancelled the command or the note was deemed not valid for
      // schema from hierarchy creation.
      return { isHappy: false, stopReason: hierLvlOpts.stopReason };
    }

    const candidates = await this.getHierarchyCandidates(
      hierLvlOpts.hierarchyLevel
    );
    const patternsOpts =
      await UserQueries.promptUserToPickPatternsFromCandidates(candidates);
    if (_.isUndefined(patternsOpts.pickedCandidates)) {
      return { isHappy: false, stopReason: patternsOpts.stopReason };
    }

    const schemaName = await UserQueries.promptUserForSchemaFileName(
      hierLvlOpts.hierarchyLevel,
      vault
    );
    if (schemaName === undefined || schemaName.length === 0) {
      // User must have cancelled the command, get out.
      return {
        isHappy: false,
        stopReason: StopReason.DID_NOT_PICK_SCHEMA_FILE_NAME,
      };
    }

    const uri = getSchemaUri(vault, schemaName);

    const commandOpts: CommandOpts = {
      candidates: patternsOpts.pickedCandidates,
      schemaName,
      hierarchyLevel: hierLvlOpts.hierarchyLevel,
      uri,
      isHappy: true,
    };
    return commandOpts;
  }

  private async getHierarchyCandidates(
    hierarchyLevel: HierarchyLevel
  ): Promise<SchemaCandidate[]> {
    const { engine } = ExtensionProvider.getDWorkspace();
    const engineNotes = await engine.findNotesMeta({ excludeStub: false });
    const noteCandidates = _.filter(engineNotes, (n) =>
      hierarchyLevel.isCandidateNote(n.fname)
    );

    const candidates: SchemaCandidate[] = this.formatSchemaCandidates(
      noteCandidates,
      hierarchyLevel
    );

    return this.filterDistinctLabel(candidates);
  }

  private filterDistinctLabel(candidates: SchemaCandidate[]) {
    const distinct: SchemaCandidate[] = [];
    new Map(candidates.map((cand) => [cand.label, cand])).forEach((value) => {
      distinct.push(value);
    });

    return distinct;
  }

  formatSchemaCandidates(
    noteCandidates: NotePropsMeta[],
    hierarchyLevel: HierarchyLevel
  ): SchemaCandidate[] {
    return noteCandidates
      .map((note) => {
        const tokens = note.fname.split(".");

        const patternStr = [
          ...tokens.slice(0, hierarchyLevel.idx),
          "*",
          ...tokens.slice(hierarchyLevel.idx + 1),
        ].join(".");

        return {
          label: patternStr,
          detail: `Will match notes like ${note.fname}`,
          note,
        };
      })
      .sort((a, b) => {
        if (a.note.fname === b.note.fname) {
          return 0;
        }
        return a.note.fname < b.note.fname ? -1 : 1;
      });
  }

  async execute({
    candidates,
    hierarchyLevel,
    uri,
    isHappy,
  }: CommandOpts): Promise<CommandOutput> {
    if (!isHappy) {
      return { successfullyCreated: false };
    }

    const schemaBody = SchemaCreator.makeSchemaBody({
      candidates: candidates!,
      hierarchyLevel: hierarchyLevel!,
    });

    fs.writeFileSync(uri!.fsPath, schemaBody);

    await ExtensionProvider.getExtension().schemaSyncService.saveSchema({
      uri: uri!,
      isBrandNewFile: true,
    });

    await VSCodeUtils.openFileInEditor(uri!);
    return { successfullyCreated: true };
  }

  addAnalyticsPayload(opts?: CommandOpts, out?: CommandOutput): any {
    if (out && out.successfullyCreated) {
      return { successfullyCreated: true };
    } else if (opts && opts.stopReason) {
      return {
        stopReason: opts.stopReason,
        successfullyCreated: false,
      };
    } else {
      return { successfullyCreated: false };
    }
  }
}
