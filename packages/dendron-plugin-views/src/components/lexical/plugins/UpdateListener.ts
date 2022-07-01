import { $getRoot, $getNodeByKey } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

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
import { $isFormattableNode, FormattableNode } from "../nodes/FormattableNode";
import _ from "lodash";
import {
  $isMatchTextTwoStateNode,
  $setDisplayMode,
  MatchTextTwoStateNode,
} from "../nodes/MatchTextTwoStateNode";
import { TwoStateNodeMode } from "../nodes/TwoStateNode";

type LineCountSearchPayload = {
  count: number;
  found: boolean;
};

function getLineNumber(editorState: EditorState, nodeKey: NodeKey) {
  let res: LineCountSearchPayload = {
    count: 0,
    found: false,
  };

  editorState.read(() => {
    res = visitTree($getRoot(), nodeKey, {
      count: 1,
      found: false,
    });
  });

  if (res.found) {
    return res.count;
  } else {
    return null;
  }
}

function visitTree(
  currentNode: LexicalNode,
  id: NodeKey,
  payload: LineCountSearchPayload
): LineCountSearchPayload {
  // console.log(
  //   `current Node Key ${currentNode.__key} | searching for ${id}. Payload Line Count: ${payload.count}`
  // );
  if (currentNode.__key === id) {
    return {
      count: payload.count,
      found: true,
    };
  }

  if ($isElementNode(currentNode)) {
    const childNodes = currentNode.getChildren();

    for (let childNode of childNodes) {
      // console.log(
      //   `visiting child node. id: ${childNode.__key} | Type: ${
      //     childNode.__type
      //   } | IsElementNode: ${$isElementNode(childNode)}`
      // );
      payload = visitTree(childNode, id, {
        count: payload.count,
        found: false,
      });

      if (payload.found) {
        return payload;
      }
    }
  }

  return {
    count: $isLineBreakNode(currentNode) ? payload.count + 1 : payload.count,
    found: false,
  };
}

export default function UpdateListener() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    console.log("Inside UpdateListener");
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState }) => {
        console.log("Editor State Changed");
        console.log(`Dirty Leaves Count: ${dirtyLeaves.size}`);

        const msgToSend: EditorChange[] = [];

        const nodesLosingFocus: MatchTextTwoStateNode[] = [];
        const nodesGainingFocus: MatchTextTwoStateNode[] = [];

        prevEditorState.read(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();

            console.log("Node(s) out of selection:");
            nodes.forEach((node) => {
              console.log(` - ${node.getKey()}`);
              if ($isMatchTextTwoStateNode(node)) {
                console.log(`Formattable Node ${node.getKey()} out of focus`);
                nodesLosingFocus.push(node);
              }
            });
          }
        });

        editorState.read(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();

            console.log(`${nodes.length} node(s) in selection:`);
            nodes.forEach((node) => {
              console.log(` - ${node.getKey()}`);
              if ($isMatchTextTwoStateNode(node)) {
                console.log(`Formattable Node ${node.getKey()} in focus`);
                nodesGainingFocus.push(node);
              }
            });
          }
        });

        // _.difference(nodesGainingFocus, nodesLosingFocus);
        const nodesToUpdateGainingFocus = _.differenceWith(
          nodesGainingFocus,
          nodesLosingFocus,
          (left, right) => {
            return left.getKey() === right.getKey();
          }
        );

        const nodesToUpdateLosingFocus = _.differenceWith(
          nodesLosingFocus,
          nodesGainingFocus,
          (left, right) => {
            return left.getKey() === right.getKey();
          }
        );

        editor.update(() => {
          console.log(
            `Node Count to update gaining focus: ${nodesToUpdateGainingFocus.length}`
          );
          nodesToUpdateGainingFocus.forEach((node) => {
            console.log(`Dummy update on node ${node.getKey()} gaining focus`);
            $setDisplayMode(node, TwoStateNodeMode.raw);
          });

          console.log(
            `Node Count to update losing focus: ${nodesToUpdateLosingFocus.length}`
          );
          nodesToUpdateLosingFocus.forEach((node) => {
            console.log(`Dummy update on node ${node.getKey()} losing focus`);
            $setDisplayMode(node, TwoStateNodeMode.formatted);
          });
        });

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

              if ($isTextNode(node) || $isLineBreakNode(node)) {
                const result = getLineNumber(editorState, value);

                console.log(`Line Number for Node ${value} is ${result}`);

                if (result) {
                  const text = $isTextNode(node)
                    ? node.getTextContent(true)
                    : ""; // TODO: Check parameter for getTextContent
                  const lineNumber = result;

                  const nodeType = $isTextNode(node) ? "text" : "lineBreak";

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
                  console.log(
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
                  console.log(
                    `JY_ERROR: Unable to find node with value ${value} in prevEditorState!`
                  );
                  //return;
                } else {
                  const result = getLineNumber(prevEditorState, value);

                  if (!result) {
                    console.log(
                      `JY_ERROR: Unable to get line number for node with value ${value} in prevEditorState!`
                    );
                  } else {
                    const nodeType = $isTextNode(node) ? "text" : "lineBreak";
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
