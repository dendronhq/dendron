import type {
  ElementTransformer,
  TextMatchTransformer,
  TextFormatTransformer,
  Transformer,
} from "@lexical/markdown";
import type { ElementNode, LexicalNode } from "lexical";

import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from "@lexical/markdown";
import {
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $isTableNode,
  $isTableRowNode,
  TableCellHeaderStates,
  TableCellNode,
  TableNode,
} from "@lexical/table";
import {
  $createParagraphNode,
  $createTextNode,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
} from "lexical";

import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingTagType,
} from "@lexical/rich-text";

import { $isLinkNode, $createLinkNode } from "@lexical/link";

import _ from "lodash";
import {
  $createMatchTextTwoStateNode,
  MatchTextTwoStateNode,
} from "./MatchTextTwoStateNode";
import { $createElementTwoStateNode } from "./ElementTwoStateNode";
import { $setDisplayMode, TwoStateNodeMode } from "./TwoStateNode";
import { $createNoteRefNode } from "./NoteRefNode";
import { useEffect } from "react";

export const BOLD_STAR: TextFormatTransformer = {
  format: ["bold"],
  tag: "**",
  type: "text-format",
};

// const replaceWithBlock = (
//   createNode: (match: Array<string>) => ElementNode
// ): ElementTransformer["replace"] => {
//   return (parentNode, children, match) => {
//     // TODO - support multi children - not sure when this will happen tho?
//     const childNode = children[0];
//     $createElementTwoStateNode();
//     children[0].replace();
//     const node = createNode(match);
//     node.append(...children);
//     parentNode.replace(node);
//     node.select(0, 0);
//   };
// };

export const JY_HEADING: ElementTransformer = {
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) {
      return null;
    }
    const level = Number(node.getTag().slice(1));
    return "#".repeat(level) + " " + exportChildren(node);
  },
  regExp: /^(#{1,6})\s/,
  replace: (parentNode, children, match) => {
    console.log("Inside JY_HEADING replace");
    // debugger;
    // debugger;
    // children[0].replace(replacementChildNode);

    const tag = ("h" + match[1].length) as HeadingTagType;
    const headingNode = $createHeadingNode(tag);
    headingNode.append(...children);

    const prefix = "#".repeat(match[1].length);
    const replacementChildNode = $createElementTwoStateNode(
      prefix + " ", // TODO: this needs to use the tag level (how many #'s)
      /^(#{1,6})\s/,
      prefix,
      0
    );

    headingNode.append(replacementChildNode);

    parentNode.replace(headingNode);

    console.log(`pref is ${prefix}`);

    // headingNode.selectNext(prefix.length, prefix.length);
    headingNode.selectEnd();

    // replacementChildNode.select(prefix.length, prefix.length);
  },
  type: "element",
};

// export const JY_HEADING: ElementTransformer = {
//   export: (node, exportChildren) => {
//     if (!$isHeadingNode(node)) {
//       return null;
//     }
//     const level = Number(node.getTag().slice(1));
//     return "#".repeat(level) + " " + exportChildren(node);
//   },
//   regExp: /^(#{1,6})\s/,
//   replace: replaceWithBlock((match) => {
//     const tag = ("h" + match[1].length) as HeadingTagType;
//     return $createHeadingNode(tag);
//   }),
//   type: "element",
// };

export const JY_LINK: TextMatchTransformer = {
  export: (node, exportChildren, exportFormat) => {
    if (!$isLinkNode(node)) {
      return null;
    }
    const linkContent = `[${node.getTextContent()}](${node.getURL()})`;
    const firstChild = node.getFirstChild();
    // Add text styles only if link has single text node inside. If it's more
    // then one we ignore it as markdown does not support nested styles for links
    if (node.getChildrenSize() === 1 && $isTextNode(firstChild)) {
      return exportFormat(firstChild, linkContent);
    } else {
      return linkContent;
    }
  },
  importRegExp: /(?:\[([^[]+)\])(?:\(([^(]+)\))/,
  regExp: /(?:\[([^[]+)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, linkText, linkUrl] = match;
    const linkNode = $createLinkNode(linkUrl);
    const linkTextNode = $createTextNode(linkText);
    linkTextNode.setFormat(textNode.getFormat());
    linkNode.append(linkTextNode);
    textNode.replace(linkNode);
  },
  trigger: ")",
  type: "text-match",
};

// export const IS_BOLD = 1;
// export const IS_ITALIC = 1 << 1;
// export const IS_STRIKETHROUGH = 1 << 2;
// export const IS_UNDERLINE = 1 << 3;
// export const IS_CODE = 1 << 4;
// export const IS_SUBSCRIPT = 1 << 5;
// export const IS_SUPERSCRIPT = 1 << 6;

export const DENDRON_BOLD: TextMatchTransformer = {
  export: (node, exportChildren, exportFormat) => {
    // throw Error("Dendron_BOLD Export Not Implemented");
    if (!$isTextNode(node)) {
      return null;
    }

    return `![${node.getKey()})`;
  },
  importRegExp: /\*\*(.*?)\*\*/gm,
  regExp: /\*\*(.*?)\*\*/,
  replace: (textNode, match) => {
    const [text] = match;

    const twoStateNode = $createMatchTextTwoStateNode(
      text,
      /\*\*(.*?)\*\*/,
      "**",
      1
    );

    // We need to set the mode to raw immediately because the cursor will still
    // be in focus on this node. This way, we can set the cursor to the full
    // length of the node (while in raw form) immediately
    $setDisplayMode(twoStateNode, TwoStateNodeMode.raw);

    textNode.replace(twoStateNode);

    twoStateNode.select(
      twoStateNode.getRawText().length,
      twoStateNode.getRawText().length
    );
  },
  trigger: "*",
  type: "text-match",
};

export const DENDRON_ITALICS: TextMatchTransformer = {
  export: (node, exportChildren, exportFormat) => {
    // throw Error("Dendron_BOLD Export Not Implemented");
    if (!$isTextNode(node)) {
      return null;
    }

    return `![${node.getKey()})`;
  },
  importRegExp: /_(.*?)_/gm,
  regExp: /_(.*?)_/,
  replace: (textNode, match) => {
    const [text] = match;

    const twoStateNode = $createMatchTextTwoStateNode(text, /_(.*?)_/, "_", 2);

    // We need to set the mode to raw immediately because the cursor will still
    // be in focus on this node. This way, we can set the cursor to the full
    // length of the node (while in raw form) immediately
    $setDisplayMode(twoStateNode, TwoStateNodeMode.raw);

    textNode.replace(twoStateNode);

    // Need to move the cursor
    twoStateNode.select(
      twoStateNode.getRawText().length,
      twoStateNode.getRawText().length
    );
  },
  trigger: "_",
  type: "text-match",
};
