import { $getRoot, $getNodeByKey } from "lexical";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  EditorState,
  ElementNode,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
} from "lexical";

import { $isElementNode } from "lexical";
import { useEffect } from "react";
import { postVSCodeMessage } from "../../utils/vscode";
import { DMessageSource, EditorMessageEnum } from "@dendronhq/common-all";

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
        // console.log(`Dirty Elements Count: ${dirtyElements.size}`);

        // debugger;
        // The latest EditorState can be found as `editorState`.
        // To read the contents of the EditorState, use the following API:

        // for (const [key, value] of dirtyElements.entries()) {
        //   console.log("found dirtyElement");
        //   console.log(key, value);
        // }

        for (const value of dirtyLeaves.values()) {
          console.log(` - Dirty Leaf: ${value}`);
          // console.log("found dirtyLeaf");
          // const node = editorState._nodeMap.get(value);
          // debugger;
          // console.log(value);
          // console.log(node?.__text);

          editorState.read(() => {
            const node = $getNodeByKey(value);

            // TODO: Adjust to also include line break nodes
            if (node) {
              if ($isTextNode(node) || $isLineBreakNode(node)) {
                const result = getLineNumber(editorState, value);

                console.log(`Line Number for Node ${value} is ${result}`);

                if (result) {
                  const text = $isTextNode(node)
                    ? node.getTextContent(true)
                    : ""; // TODO: Check parameter for getTextContent
                  const lineNumber = $isLineBreakNode(node)
                    ? result + 1
                    : result;

                  console.log(
                    `postVSCodeMessage. lineNumber: ${lineNumber}, editType: insertion, text: ${text}`
                  );
                  postVSCodeMessage({
                    type: EditorMessageEnum.documentChanged,
                    data: {
                      text,
                      lineNumber,
                      editType: "insertion",
                    },
                    source: DMessageSource.webClient,
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

                // if ($isLineBreakNode(node)) {
                // debugger;
                if (!node) {
                  console.log(
                    `JY_ERROR: Unable to find node with value ${value} in prevEditorState!`
                  );
                  //return;
                } else {
                  const result = getLineNumber(prevEditorState, value);

                  // debugger;
                  if (!result) {
                    console.log(
                      `JY_ERROR: Unable to get line number for node with value ${value} in prevEditorState!`
                    );
                  } else {
                    const lineNumber = $isLineBreakNode(node)
                      ? result + 1
                      : result;

                    console.log(
                      `postVSCodeMessage. lineNumber: ${lineNumber}, editType: deletion`
                    );

                    postVSCodeMessage({
                      type: EditorMessageEnum.documentChanged,
                      data: {
                        text: "",
                        lineNumber,
                        editType: "deletion",
                      },
                      source: DMessageSource.webClient,
                    });
                  }
                }
                // }
              });
            }
          });
        }
      }
    );

    return () => {
      removeUpdateListener();
    };
  }, [editor]);

  return null;
}
