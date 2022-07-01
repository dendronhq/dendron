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

import { $createFormattableNode } from "./FormattableNode";
import _ from "lodash";
import { $createMatchTextTwoStateNode } from "./MatchTextTwoStateNode";

export const BOLD_STAR: TextFormatTransformer = {
  format: ["bold"],
  tag: "**",
  type: "text-format",
};

const replaceWithBlock = (
  createNode: (match: Array<string>) => ElementNode
): ElementTransformer["replace"] => {
  return (parentNode, children, match) => {
    const node = createNode(match);
    node.append(...children);
    parentNode.replace(node);
    node.select(0, 0);
  };
};

export const JY_HEADING: ElementTransformer = {
  export: (node, exportChildren) => {
    if (!$isHeadingNode(node)) {
      return null;
    }
    const level = Number(node.getTag().slice(1));
    return "#".repeat(level) + " " + exportChildren(node);
  },
  regExp: /^(#{1,6})\s/,
  replace: replaceWithBlock((match) => {
    const tag = ("h" + match[1].length) as HeadingTagType;
    return $createHeadingNode(tag);
  }),
  type: "element",
};

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
    console.log("Inside DENDRON_BOLD");
    // debugger;
    const [text] = match;

    // const formattableNode = $createFormattableNode(_.trim(text, "*"), text);
    const twoStateNode = $createMatchTextTwoStateNode(
      text,
      /\*\*(.*?)\*\*/,
      "**"
    );

    textNode.replace(twoStateNode);
    // const imageNode = $createImageNode({
    //   altText,
    //   maxWidth: 800,
    //   src,
    // });
    // textNode.replace(imageNode);
  },
  trigger: "*",
  type: "text-match",
};
