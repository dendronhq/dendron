import { $getRoot, $getNodeByKey, TextNode, $isDecoratorNode } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isListItemNode, $isListNode } from "@lexical/list";

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
  EditorMessageEnum,
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
  if ($isLineBreakNode(node)) {
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
  let total = $isRootNode(parent) || $isListNode(parent) ? 0 : 1; // Some (most?) elements themselves have a starting height of 1 (i.e. paragraph or heading)

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

  // Trim the first and last elements of parents - as that corresponds to the
  // immediate parent (we don't want to include this, because we calculated
  // offsetFromParent), and the root, which we don't want to include either
  // parents.shift();
  // parents.pop();

  parents.forEach((parent) => {
    parentsTotalHeight += getOffsetFromParent(parent);
  });

  // debugger;

  console.log(
    `parentsTotalHeight: ${parentsTotalHeight} | offsetFromParent: ${offsetFromParent}`
  );

  return offsetFromParent + parentsTotalHeight;
}

// Need to take into account siblings under the same parent
function getFullLineOfTextForNode(node: LexicalNode): string {
  let nodeList: LexicalNode[] = [];

  const prevTextNodes = node.getPreviousSiblings();
  // .filter((node) => $isTextNode(node)) as TextNode[];

  const nextTextNodes = node.getNextSiblings();
  // .filter((node) => $isTextNode(node)) as TextNode[];

  nodeList.push(...prevTextNodes);
  nodeList.push(node);
  nodeList.push(...nextTextNodes);

  const unformattedText = nodeList
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

  // Handle list item nodes
  let prefix = "";
  const parentNode = node.getParent();

  if (parentNode && $isListItemNode(parentNode)) {
    const grandParentNode = parentNode.getParent();

    if (!grandParentNode || !$isListNode(grandParentNode)) {
      console.error(`List Item Node's Parent isn't a ListNode?`);
      return unformattedText;
    }

    const listType = grandParentNode.getListType();
    const isChecked = parentNode.getChecked();
    const indentLevel = parentNode.getIndent();

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

    prefix = `${_.repeat(" ", SPACES_FOR_INDENT * indentLevel)}${marker} `;
  }

  return `${prefix}${unformattedText}`;
}

export default function UpdateVSCodePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log("Inside UpdateVSCodePlugin");
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
        console.log("Editor State Changed");
        console.log(`Dirty Elements Count: ${dirtyElements.size}`);
        console.log(`Dirty Leaves Count: ${dirtyLeaves.size}`);

        // debugger;

        const msgToSend: EditorChange[] = [];

        // Send updates back to VS Code based on changes:
        for (const value of dirtyLeaves.values()) {
          console.log(` - Dirty Leaf: ${value}`);

          editorState.read(() => {
            const node = $getNodeByKey(value);

            if (node) {
              // In some cases, it's not actually dirty?
              if ($isLineBreakNode(node)) {
                let shouldContinue = true;
                prevEditorState.read(() => {
                  if ($getNodeByKey(node.getKey())) {
                    console.log(
                      `node ${node.getKey()} exists in prev editor state too, ignoring`
                    );
                    shouldContinue = false;
                  }
                });

                if (!shouldContinue) {
                  return;
                }
              }

              if (
                $isTextNode(node) ||
                $isLineBreakNode(node) ||
                $isDecoratorNode(node)
              ) {
                const result = getLineNumber(editorState, value);

                console.log(`Line Number for Node ${value} is ${result}`);

                if (result) {
                  const text =
                    $isTextNode(node) || $isDecoratorNode(node)
                      ? getFullLineOfTextForNode(node)
                      : ""; // TODO: Check parameter for getTextContent
                  const lineNumber = result;

                  const nodeType = $isLineBreakNode(node)
                    ? "lineBreak"
                    : "text";

                  console.log(
                    `postVSCodeMessage. lineNumber: ${lineNumber}, editType: insertion, text: ${text}, nodeType: ${nodeType}`
                  );
                  msgToSend.push({
                    text,
                    lineNumber,
                    editType: "insertion",
                    nodeType,
                  });
                } else {
                  console.error(
                    `JY_ERROR: Unable to find node with value ${value}`
                  );
                }
              }
            }
            // This must? mean that a node was deleted, so look into previous state
            else {
              console.log(`Attempting processing of deletion`);
              prevEditorState.read(() => {
                const node = $getNodeByKey(value);

                if (!node) {
                  console.error(
                    `JY_ERROR: Unable to find node with value ${value} in prevEditorState!`
                  );
                  //return;
                } else {
                  const result = getLineNumber(prevEditorState, value);

                  if (!result) {
                    console.error(
                      `JY_ERROR: Unable to get line number for node with value ${value} in prevEditorState!`
                    );
                  } else {
                    const nodeType = $isLineBreakNode(node)
                      ? "lineBreak"
                      : "text";
                    const lineNumber = result;

                    console.log(
                      `postVSCodeMessage. lineNumber: ${lineNumber}, editType: deletion, nodeType: ${nodeType}`
                    );
                    msgToSend.push({
                      text: "",
                      lineNumber,
                      editType: "deletion",
                      nodeType,
                    });
                  }
                }
              });
            }
          });
        }

        for (const key of dirtyElements.keys()) {
          console.log(`- Dirty Element: ${key}`);

          editorState.read(() => {
            const node = $getNodeByKey(key);

            if (!node) {
              prevEditorState.read(() => {
                const node = $getNodeByKey(key);

                if (!node) {
                  console.error(
                    `JY_ERROR: Unable to find node with key ${key} in prevEditorState!`
                  );
                  //return;
                } else {
                  console.log(`Processing Element Deletion with key ${key}`);
                  const result = getLineNumber(prevEditorState, key);

                  if (!result) {
                    console.error(
                      `JY_ERROR: Unable to get line number for node with key ${key} in prevEditorState!`
                    );
                  } else {
                    const nodeType = $isLineBreakNode(node)
                      ? "lineBreak"
                      : "text";
                    const lineNumber = result;

                    console.log(
                      `postVSCodeMessage. lineNumber: ${lineNumber}, editType: deletion, nodeType: ${nodeType}`
                    );
                    msgToSend.push({
                      text: "",
                      lineNumber,
                      editType: "deletion",
                      nodeType,
                    });
                  }
                }
              });
            } else {
              let shouldContinue = true;
              prevEditorState.read(() => {
                const nodeFromPrevState = $getNodeByKey(key);

                if (nodeFromPrevState) {
                  shouldContinue = false;
                }
              });

              if (!shouldContinue) {
                return;
              }

              console.log(`Processing Element Insertion with key ${key}`);
              // This means this node was newly created
              const result = getLineNumber(editorState, key);

              console.log(`Line Number for Node ${key} is ${result}`);

              if (result) {
                let text = "";

                if (isMarkdownSerializable(node)) {
                  text = node.serialize();
                } else if ($isTextNode(node)) {
                  text = node.getTextContent(true); // TODO: Check parameter for getTextContent
                }
                const lineNumber = result;

                const nodeType = $isLineBreakNode(node) ? "lineBreak" : "text";

                console.log(
                  `postVSCodeMessage. lineNumber: ${lineNumber}, editType: insertion, text: ${text}, nodeType: ${nodeType}`
                );
                msgToSend.push({
                  text,
                  lineNumber,
                  editType: "insertion",
                  nodeType,
                });
              } else {
                console.error(
                  `JY_ERROR: Unable to find node with value ${key}`
                );
              }
            }
          });
        }

        if (msgToSend.length > 0) {
          const msg: EditorChangeMessage = {
            type: EditorMessageEnum.documentChanged,
            data: msgToSend,
            source: DMessageSource.webClient,
          };

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
