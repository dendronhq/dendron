import {
  ConfigService,
  DECORATION_TYPES,
  DendronError,
  DEngineClient,
  DNoteAnchorBasic,
  DVault,
  genUUIDInsecure,
  NoteProps,
  URI,
} from "@dendronhq/common-all";
import { Heading } from "@dendronhq/engine-server";
import {
  AnchorUtils,
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  linkedNoteType,
  MdastUtils,
  MDUtilsV5,
  ProcMode,
  select,
  UserTag,
  WikiLinkNoteV4,
} from "@dendronhq/unified";
import visit from "unist-util-visit";
import _ from "lodash";
import vscode, {
  Position,
  Selection,
  TextDocument,
  TextEditor,
  TextEditorEdit,
  ViewColumn,
} from "vscode";
import { TargetKind } from "../commands/GoToNoteInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { getReferenceAtPosition } from "./md";

export type ProcessSelectionOpts = {
  qs?: string;
  vault?: DVault;
  anchor?: DNoteAnchorBasic;
  overrides?: Partial<NoteProps>;
  kind?: TargetKind;
  /**
   * What {@link vscode.ViewColumn} to open note in
   */
  column?: ViewColumn;
  /** added for contextual UI analytics. */
  source?: string;
};

/**
 * Utility methods that take the {@link vscode.editor} and / or its components
 * and retrieve / modify the content of it.
 *
 * If you are creating a utility that does something common when using the active text editor,
 * consider adding them here.
 */
export class EditorUtils {
  /** Finds the header at the specified line, if any.
   *
   * @param editor the editor that has the document containing the header open
   * @param position the line where the header should be checked for
   * @returns the header text, or undefined if there wasn't a header
   */
  static getHeaderAt({
    document,
    position,
    engine: _engine,
  }: {
    document: TextDocument;
    position: Position;
    engine?: DEngineClient;
  }): undefined | string {
    const line = document.lineAt(position.line);
    const headerLine = _.trim(line.text);
    if (headerLine.startsWith("#")) {
      const proc = MDUtilsV5.procRemarkParseNoData(
        {},
        { dest: DendronASTDest.MD_DENDRON }
      );
      const parsed = proc.parse(headerLine);
      const header = select(DendronASTTypes.HEADING, parsed) as Heading | null;
      if (_.isNull(header)) return undefined;
      const headerText = AnchorUtils.headerText(header);
      if (headerText.length === 0) return undefined;
      return headerText;
    } else {
      return undefined;
    }
  }

  /** Finds the block anchor at the end of the specified line, if any.
   *
   * @param editor the editor that has the document containing the anchor open
   * @param position the line where the anchor should be checked for
   * @returns the anchor (with ^), or undefined if there wasn't an anchor
   */
  static getBlockAnchorAt({
    editor,
    position,
  }: {
    editor: TextEditor;
    position: Position;
    engine?: DEngineClient;
  }): string | undefined {
    const line = editor.document.lineAt(position.line);
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_DENDRON }
    );
    const parsed = proc.parse(_.trim(line.text));
    const blockAnchor = select(
      DendronASTTypes.BLOCK_ANCHOR,
      parsed
    ) as BlockAnchor | null;

    if (_.isNull(blockAnchor) || !blockAnchor.id) return undefined;
    return `^${blockAnchor.id}`;
  }

  /** Add a block anchor at the end of the specified line. The anchor is randomly generated if not supplied.
   *
   * If there is already an anchor at the end of this line, then this function doesn't actually insert an anchor but returns that anchor instead.
   *
   * @param editBuilder parameter of the callback in `editor.edit`
   * @param editor the editor that the editBuilder belongs to
   * @param position the line where the anchor will be inserted
   * @param anchor anchor id to insert (without ^), randomly generated if undefined
   * @returns the anchor that has been added (with ^)
   */
  static addOrGetAnchorAt(opts: {
    editBuilder: TextEditorEdit;
    editor: TextEditor;
    position: Position;
    anchor?: string;
    engine: DEngineClient;
  }) {
    const { editBuilder, editor, position } = opts;
    let { anchor } = opts;
    const line = editor.document.lineAt(position.line);
    const existingAnchor = EditorUtils.getAnchorAt(opts);
    if (!_.isUndefined(existingAnchor)) return existingAnchor;
    if (_.isUndefined(anchor)) anchor = genUUIDInsecure();
    editBuilder.insert(line.range.end, ` ^${anchor}`);
    return `^${anchor}`;
  }

  /** Finds the header or block anchor at the end of the specified line, if any.
   *
   * @param editor the editor that has the document containing the anchor open
   * @param position the line where the anchor should be checked for
   * @returns the anchor (with ^), or undefined if there wasn't an anchor
   */
  static getAnchorAt(args: {
    editor: TextEditor;
    position: Position;
    engine: DEngineClient;
  }): string | undefined {
    const { editor } = args;
    return (
      EditorUtils.getHeaderAt({ document: editor.document, ...args }) ||
      EditorUtils.getBlockAnchorAt(args)
    );
  }

  static async getSelectionAnchors(opts: {
    editor: TextEditor;
    selection?: Selection;
    doStartAnchor?: boolean;
    doEndAnchor?: boolean;
    engine: DEngineClient;
  }): Promise<{ startAnchor?: string; endAnchor?: string }> {
    const { editor, selection, doStartAnchor, doEndAnchor, engine } =
      _.defaults(opts, { doStartAnchor: true, doEndAnchor: true });
    if (_.isUndefined(selection)) return {};
    const { start, end } = selection;

    // first check if there's an existing anchor
    let startAnchor = doStartAnchor
      ? EditorUtils.getAnchorAt({ editor, position: start, engine })
      : undefined;

    // does the user have only a single
    const singleLine =
      // single line selected
      start.line === end.line ||
      // the first line selected in full, nothing on second line (default behavior when double clicking on a line)
      (start.line + 1 === end.line && end.character === 0);
    // does the user have any amount of text selected?
    const hasSelectedRegion =
      start.line !== end.line || start.character !== end.character;

    // first check if there's an existing anchor
    let endAnchor: string | undefined;
    if (!singleLine && doEndAnchor)
      endAnchor = EditorUtils.getAnchorAt({ editor, position: end, engine });

    // if we found both anchors already, just return them.
    if (!_.isUndefined(startAnchor) && !_.isUndefined(endAnchor))
      return { startAnchor, endAnchor };

    // otherwise, we'll need to edit the document to insert block anchors
    await editor.edit((editBuilder) => {
      if (_.isUndefined(startAnchor) && doStartAnchor && hasSelectedRegion)
        startAnchor = EditorUtils.addOrGetAnchorAt({
          editBuilder,
          editor,
          position: start,
          engine,
        });
      if (_.isUndefined(endAnchor) && doEndAnchor && !singleLine)
        endAnchor = EditorUtils.addOrGetAnchorAt({
          editBuilder,
          editor,
          position: end,
          engine,
        });
    });
    return { startAnchor, endAnchor };
  }

  /**
   * Utility method to check if the selected text is a broken wikilink
   */
  static async isBrokenWikilink({
    editor,
    selection,
    note,
    engine,
  }: {
    editor: TextEditor;
    selection: vscode.Selection;
    note: NoteProps;
    engine: DEngineClient;
  }): Promise<boolean> {
    const line = editor.document.lineAt(selection.start.line).text;
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(engine.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    const proc = MDUtilsV5.procRemarkParse(
      { mode: ProcMode.FULL },
      {
        noteToRender: note,
        dest: DendronASTDest.MD_DENDRON,
        vault: note.vault,
        fname: note.fname,
        config,
      }
    );
    const parsedLine = proc.parse(line);
    let link: WikiLinkNoteV4 | UserTag | HashTag | undefined;
    let type: DECORATION_TYPES | undefined;
    let fname: string;
    await MdastUtils.visitAsync(
      parsedLine,
      [
        DendronASTTypes.WIKI_LINK,
        DendronASTTypes.USERTAG,
        DendronASTTypes.HASHTAG,
      ],
      async (linkvalue) => {
        link = linkvalue as WikiLinkNoteV4 | UserTag | HashTag;
        if (!link) return false;
        fname =
          link.type === DendronASTTypes.WIKI_LINK ? link.value : link.fname;
        type = (await linkedNoteType({ fname, engine, vaults: engine.vaults }))
          .type;
        return false;
      }
    );
    return type === DECORATION_TYPES.brokenWikilink;
  }

  /**
   * NOTE: this method requires that `ExtensionProvider` be available and can provide a workspace
   */
  static async getLinkFromSelectionWithWorkspace() {
    const { selection, editor } = VSCodeUtils.getSelection();
    // can't just collapse to `selection?.start !== undefined`
    // because typescript compiler complains that selection might be undefined otherwise inside of the if block
    if (
      _.isEmpty(selection) ||
      _.isUndefined(selection) ||
      _.isUndefined(selection.start) ||
      !editor
    )
      return;
    const currentLine = editor.document.lineAt(selection.start.line).text;
    if (!currentLine) return;
    const ws = ExtensionProvider.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
    const reference = await getReferenceAtPosition({
      document: editor.document,
      position: selection.start,
      opts: { allowInCodeBlocks: true },
      wsRoot,
      vaults,
    });
    if (!reference) return;
    return {
      alias: reference.label,
      value: reference.ref,
      vaultName: reference.vaultName,
      anchorHeader: reference.anchorStart,
    };
  }

  /**
   * Given a document, get the end position of the frontmatter
   * if zeroIndex is true, the document's first line is 0
   * otherwise, it is 1 (default)
   */
  static getFrontmatterPosition(opts: {
    document: vscode.TextDocument;
    zeroIndex?: boolean;
  }): Promise<vscode.Position | false> {
    const { document, zeroIndex } = opts;
    return new Promise((resolve) => {
      const proc = MDUtilsV5.procRemarkParseNoData(
        {},
        { dest: DendronASTDest.MD_DENDRON }
      );
      const parsed = proc.parse(document.getText());
      visit(parsed, ["yaml"], (node) => {
        if (_.isUndefined(node.position)) return resolve(false); // Should never happen
        const offset = zeroIndex ? undefined : { line: 1 };
        const position = VSCodeUtils.point2VSCodePosition(
          node.position.end,
          offset
        );
        resolve(position);
      });
    });
  }

  /**
   * Given a text editor, determine if any of the selection
   * contains part of the frontmatter.
   * if given editor holds a document that doesn't have frontmatter,
   * it will throw an error
   */
  static async selectionContainsFrontmatter(opts: {
    editor: vscode.TextEditor;
  }): Promise<boolean> {
    const { editor } = opts;
    const { document, selections } = editor;
    const frontmatterEndPosition = await EditorUtils.getFrontmatterPosition({
      document,
      zeroIndex: true,
    });
    if (frontmatterEndPosition) {
      return selections.some((selection) => {
        const out = selection.start.compareTo(frontmatterEndPosition);
        return out < 1;
      });
    } else {
      throw new DendronError({ message: "Note a note." });
    }
  }
}
