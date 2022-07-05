import {
  $getRoot,
  $getNodeByKey,
  TextNode,
  $isDecoratorNode,
  ParagraphNode,
  $isParagraphNode,
} from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isListItemNode, $isListNode, ListNode } from "@lexical/list";
import { $isTableRowNode } from "@lexical/table";

import {
  EditorState,
  ElementNode,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isRootNode,
} from "lexical";

import { $isElementNode } from "lexical";
import { useEffect } from "react";
import { postVSCodeMessage } from "../../../utils/vscode";
import {
  DMessageSource,
  EditorChange,
  EditorChangeMessage,
  EditorDelete,
  EditorMessageEnum,
  Position,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  $isMatchTextTwoStateNode,
  MatchTextTwoStateNode,
} from "../nodes/MatchTextTwoStateNode";
import {
  $isTwoStateNode,
  $setDisplayMode,
  TwoStateNode,
  TwoStateNodeMode,
} from "../nodes/TwoStateNode";
import { isMarkdownSerializable } from "../nodes/MarkdownSerializable";

function calculateNodeHeight(node: LexicalNode): number {
  // TODO: This will require modifications in the future:
  if ($isLineBreakNode(node) || $isTableRowNode(node)) {
    return 1;
  }

  if ($isElementNode(node)) {
    let total = 1; // The element itself has a starting height of 1 (i.e. paragraph or heading)
    node.getChildren().forEach((childNode) => {
      total += calculateNodeHeight(childNode);
    });

    return total;
  }

  // TODO: need to have other special elements
  else {
    return 0;
  }
}

function getOffsetFromParent(node: LexicalNode): number {
  if (!node.getParent()) {
    return 0;
  }

  const prevSiblings = node.getPreviousSiblings();

  const parent = node.getParent();
  let total = 0;
  // let total = $isRootNode(parent) || $isListNode(parent) ? 0 : 1; // Some (most?) elements themselves have a starting height of 1 (i.e. paragraph or heading)

  prevSiblings.forEach((sibling) => {
    total += calculateNodeHeight(sibling);
  });

  return total;
}

function getLineNumber(editorState: EditorState, nodeKey: NodeKey) {
  const node = $getNodeByKey(nodeKey, editorState);

  if (!node) {
    return 0;
  }

  // First get the height relative to its position in its parent.
  const offsetFromParent = getOffsetFromParent(node);

  let parentsTotalHeight = 0;

  const parents = node.getParents();

  parents.forEach((parent) => {
    parentsTotalHeight += getOffsetFromParent(parent);
  });

  // debugger;

  console.log(
    `Resutlts from getLineNumber on ${nodeKey}: parentsTotalHeight: ${parentsTotalHeight} | offsetFromParent: ${offsetFromParent}`
  );

  return offsetFromParent + parentsTotalHeight;
}

function getElementRange(
  editorState: EditorState,
  node: ElementNode
): Position {
  const height = calculateNodeHeight(node);
  const lineNumber = getLineNumber(editorState, node.getKey());

  const MAX_COLUMN = 10_000;

  return {
    start: {
      line: lineNumber,
      column: 0,
    },
    end: {
      line: height + lineNumber - 1,
      column: MAX_COLUMN, // TODO: calculate correct value
    },
  };
}

function createChangesForElementNode(
  curEditorState: EditorState,
  prevEditorState: EditorState,
  key: NodeKey
): EditorChange[] {
  console.log(`createChangesForElementNode for ${key}`);

  let isCreation = false;
  let isDeletion = false;
  let curNodeState: LexicalNode | null = null;
  let prevNodeState: LexicalNode | null = null;

  const editorChanges: EditorChange[] = [];

  curEditorState.read(() => {
    curNodeState = $getNodeByKey(key);
  });

  prevEditorState.read(() => {
    prevNodeState = $getNodeByKey(key);
  });

  if (curNodeState && !prevNodeState) {
    isCreation = true;
  } else if (!curNodeState && prevNodeState) {
    isDeletion = true;
  } else if (!curNodeState && !prevNodeState) {
    //error
    return [];
  }

  if (isDeletion) {
    prevEditorState.read(() => {
      const prevNode = $getNodeByKey(key);

      let range = getElementRange(prevEditorState, prevNode as ElementNode);

      // The start needs to be the very end of the previous line.
      range.start.line = Math.max(0, range.start.line - 1);
      range.start.column = 10_000; // TODO: Fix

      editorChanges.push({
        editType: "delete",
        payload: {
          range,
        },
      });
    });
  } else if (isCreation) {
    const lineNumber = getLineNumber(curEditorState, key);

    curEditorState.read(() => {
      curNodeState = $getNodeByKey(key);

      const newText = "\n" + getLeafLevelText(curNodeState as ElementNode);

      editorChanges.push({
        editType: "insert",
        payload: {
          position: {
            line: Math.max(0, lineNumber - 1),
            column: 10_000,
          },
          newText,
        },
      });
    });
  } else {
    // This is a regular update
    prevEditorState.read(() => {
      const prevNode = $getNodeByKey(key);
      const range = getElementRange(prevEditorState, prevNode as ElementNode);
      const prevText = getLeafLevelText(prevNode as ElementNode);

      curEditorState.read(() => {
        const cur = $getNodeByKey(key);
        const newText = getLeafLevelText(cur as ElementNode);

        // Avoid redundant updates:
        if (prevText !== newText) {
          editorChanges.push({
            editType: "replace",
            payload: {
              range,
              newText,
            },
          });
        }
      });
    });
  }

  return editorChanges;
}

export function getLeafLevelText(node: ElementNode): string {
  if ($isListNode(node)) {
    return getContentForListNode(node);
  } else {
    return node
      .getChildren()
      .map((node) => {
        if (isMarkdownSerializable(node)) {
          return node.serialize();
        } else if ($isTextNode(node)) {
          if ($isTwoStateNode(node)) {
            return node.getRawText();
          } else {
            return node.getTextContent();
          }
        }
        return "";
      })
      .join("");
  }
}

function getContentForListNode(node: ListNode): string {
  const listType = node.getListType();

  const results: string[] = [];

  node.getChildren().forEach((listItemChild) => {
    if ($isListItemNode(listItemChild)) {
      const isChecked = listItemChild.getChecked();
      const indentLevel = listItemChild.getIndent();

      const text = getLeafLevelText(listItemChild);

      // TODO: I think this is hardcoded in Lexical right now too.
      const SPACES_FOR_INDENT = 4;

      let marker;

      switch (listType) {
        case "bullet":
          marker = "-";
          break;
        case "check":
          marker = isChecked ? "- [x]" : "- [ ]";
          break;
        case "number":
          marker = "1.";
          break;
        default:
          marker = "-";
          break;
      }

      const prefix = `${_.repeat(
        " ",
        SPACES_FOR_INDENT * indentLevel
      )}${marker} `;

      results.push(`${prefix}${text}`);
    }
  });

  return results.join("\n");
}

export default function UpdateVSCodePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
        console.log("Editor State Changed");
        console.log(`Dirty Elements Count: ${dirtyElements.size}`);
        console.log(`Dirty Leaves Count: ${dirtyLeaves.size}`);

        const msgToSend: EditorChange[] = [];

        for (const key of dirtyElements.keys()) {
          console.log(`- Dirty Element: ${key}`);

          editorState.read(() => {
            const node = $getNodeByKey(key);

            // debugger;

            // Only do top level elements (for now).
            if (
              node !== null &&
              ($isRootNode(node) || !$isRootNode(node?.getParent()))
            ) {
              return;
            }

            if ($isElementNode(node) || node === null) {
              console.log(`Processing Element Update with key ${key}`);
              const msgs = createChangesForElementNode(
                editorState,
                prevEditorState,
                key
              );
              msgToSend.push(...msgs);
            }
          });
        }

        if (msgToSend.length > 0) {
          const msg: EditorChangeMessage = {
            type: EditorMessageEnum.documentChanged,
            data: msgToSend,
            source: DMessageSource.webClient,
          };

          msgToSend.forEach((editorChange) => {
            console.log(
              `postVSCodeMessage.  editType: ${
                editorChange.editType
              }, payload: ${JSON.stringify(editorChange.payload)}`
            );
          });

          postVSCodeMessage(msg);
        }
      }
    );

    return () => {
      removeUpdateListener();
    };
  }, [editor]);

  return null;
}
