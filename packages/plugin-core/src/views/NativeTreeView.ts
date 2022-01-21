import {
  DendronError,
  DNodeUtils,
  NoteProps,
  NotePropsDict,
  NoteUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import vscode, { ProviderResult, ThemeIcon } from "vscode";
import { ICONS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { Logger } from "../logger";
import { EngineEvents } from "../services/EngineEventService";
import { TreeNote } from "./DendronTreeView";

export class EngineNoteProviderV2
  implements vscode.TreeDataProvider<NoteProps>
{
  private _onDidChangeTreeDataEmitter: vscode.EventEmitter<
    NoteProps | undefined | void
  >;
  readonly onDidChangeTreeData: vscode.Event<NoteProps | undefined | void>;
  private _tree: { [key: string]: TreeNote } = {};

  private _engineEvents;
  // private sort(notes: TreeNote[]): TreeNote[] {
  //   return _.sortBy(notes, "label");
  // }

  constructor(engineEvents: EngineEvents) {
    this._onDidChangeTreeDataEmitter = new vscode.EventEmitter<
      NoteProps | undefined | void
    >();

    this.onDidChangeTreeData = this._onDidChangeTreeDataEmitter.event;

    this._engineEvents = engineEvents;

    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this._engineEvents.onNoteCreated((noteProps) => {
      //TODO add noteprops payload to optimize
      this._onDidChangeTreeDataEmitter.fire();
    });

    this._engineEvents.onNoteDeleted((noteProps) => {
      //TODO add noteprops payload to optimize
      this._onDidChangeTreeDataEmitter.fire();
    });
  }

  private sortChildren(children: string[], noteDict: NotePropsDict) {
    return _.sortBy(children, (id) => noteDict[id].title);
  }

  getTreeItem(noteProps: NoteProps): vscode.TreeItem {
    return this._tree[noteProps.id];
  }

  getChildren(noteProps?: NoteProps): ProviderResult<NoteProps[]> {
    const ctx = "TreeView:getChildren";
    Logger.debug({ ctx, id: noteProps });
    const { engine } = ExtensionProvider.getDWorkspace();
    const roots = _.filter(_.values(engine.notes), DNodeUtils.isRoot);
    if (!roots) {
      vscode.window.showInformationMessage("No notes found");
      return Promise.resolve([]);
    }
    if (noteProps) {
      const childrenIds = noteProps.children;

      const childrenNoteProps = childrenIds.map((id) => {
        return engine.notes[id];
      });
      //TODO: Resolve sort order
      // this.sortChildren(children, engine.notes);
      return Promise.resolve(childrenNoteProps);
    } else {
      Logger.info({ ctx, msg: "reconstructing tree: enter" });
      const out = Promise.all(
        roots.flatMap(async (root) => {
          const treeNote = await this.parseTree(root, engine.notes);
          return treeNote.note;
        })
      );
      Logger.info({ ctx, msg: "reconstructing tree: exit" });
      return out;
    }
  }

  getParent(id: NoteProps): ProviderResult<NoteProps> {
    const { engine: client } = ExtensionProvider.getDWorkspace();

    const maybeParent = client.notes[id.parent || ""];
    return maybeParent || null;
  }

  private createTreeNote(note: NoteProps) {
    const collapsibleState = _.isEmpty(note.children)
      ? vscode.TreeItemCollapsibleState.None
      : vscode.TreeItemCollapsibleState.Collapsed;
    const tn = new TreeNote({
      note,
      collapsibleState,
    });
    if (note.stub) {
      tn.iconPath = new ThemeIcon(ICONS.STUB);
    } else if (note.schema) {
      tn.iconPath = new ThemeIcon(ICONS.SCHEMA);
    }
    return tn;
  }

  private async parseTree(
    note: NoteProps,
    ndict: NotePropsDict
  ): Promise<TreeNote> {
    const ctx = "parseTree";
    const tn = this.createTreeNote(note);
    this._tree[note.id] = tn;
    const children = note.children;
    this.sortChildren(children, ndict);
    tn.children = await Promise.all(
      children.map(async (c) => {
        const childNote = ndict[c];
        if (!childNote) {
          const payload = {
            msg: `no childNote found: ${c}, current note: ${note.id}`,
            fullDump: _.values(ndict).map((n) => NoteUtils.toLogObj(n)),
          };
          const err = new DendronError({
            message: "error updating tree view",
            payload,
          });
          Logger.error({ ctx, error: err });
          throw err;
        }
        return (await this.parseTree(childNote, ndict)).id;
      })
    );
    // tn.children = this.sort(children).map((c) => c.id);
    // Logger.debug({ ctx, msg: "exit" });
    return tn;
  }
}

// export class TreeNoteV2 extends vscode.TreeItem {
//   public id: string;
//   public note: NoteProps;
//   public uri: Uri;
//   public children: string[] = [];
//   public L: typeof Logger;

//   constructor({
//     note,
//     collapsibleState,
//   }: {
//     note: NoteProps;
//     collapsibleState: vscode.TreeItemCollapsibleState;
//   }) {
//     super(DNodeUtils.basename(note.fname, true), collapsibleState);
//     this.note = note;
//     this.id = this.note.id;
//     this.tooltip = this.note.title;
//     const vpath = vault2Path({
//       vault: this.note.vault,
//       wsRoot: getDWorkspace().wsRoot,
//     });
//     this.uri = Uri.file(path.join(vpath, this.note.fname + ".md"));
//     if (DNodeUtils.isRoot(note)) {
//       this.label = `root (${VaultUtils.getName(note.vault)})`;
//     }
//     this.command = {
//       command: DENDRON_COMMANDS.GOTO_NOTE.key,
//       title: "",
//       arguments: [
//         {
//           qs: this.note.fname,
//           mode: "note",
//           vault: this.note.vault,
//         } as GotoNoteCommandOpts,
//       ],
//     };
//     this.L = Logger;
//   }
// }
