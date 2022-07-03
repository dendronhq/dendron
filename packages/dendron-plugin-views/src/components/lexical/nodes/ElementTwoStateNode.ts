import {
  TextNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  $isLineBreakNode,
  $isTextNode,
  $createTextNode,
  $createParagraphNode,
  $isParagraphNode,
} from "lexical";
import _ from "lodash";
import {
  TwoStateNode,
  TwoStateNodeMode,
  TwoStateNodeMode as TwoStateNodeState,
} from "./TwoStateNode";

import { $isHeadingNode } from "@lexical/rich-text";

//TODO: Support partial bolded line: *this part is bolded* but this is not
export class ElementTwoStateNode extends TwoStateNode {
  // public __regex: RegExp = /\*\*(.*?)\*\*/;
  // public tag = "**";

  private __formattedNumber: number = 0;

  public __regex: RegExp;
  public tag;

  private static convertRawTextToFormatted(
    rawText: string,
    tag: string
  ): string {
    return _.trim(rawText, tag);
  }

  constructor(
    rawText: string,
    regex: RegExp,
    tag: string,
    state: TwoStateNodeState,
    formatNumber: number,
    key?: NodeKey
  ) {
    super(
      ElementTwoStateNode.convertRawTextToFormatted(rawText, tag),
      rawText,
      state,
      key
    );

    this.tag = tag;
    this.__regex = regex;
    this.__formattedNumber = formatNumber;

    if (state === TwoStateNodeState.formatted) {
      this.__format = formatNumber;
    } else {
      this.__format = 0;
    }
  }

  static getType(): string {
    return "ElementTwoStateNode";
  }

  static clone(node: ElementTwoStateNode): ElementTwoStateNode {
    return new ElementTwoStateNode(
      node.__rawText,
      node.__regex,
      node.tag,
      node.__state,
      node.__formattedNumber,
      node.__key
    );
  }

  getCursorOffset(): number {
    return this.tag.length;
  }

  override setDisplayMode(mode: TwoStateNodeState) {
    const self = this.getLatest();
    self.__state = mode;

    if (mode === "raw") {
      self.setTextContent(self.getRawText());
      self.setFormat(0);
    } else {
      self.setTextContent(self.getFormattedText());
      self.setFormat(this.__formattedNumber);
    }
  }

  updateInternalTexts() {
    const self = this.getLatest();
    if (self.__state === TwoStateNodeState.raw) {
      self.__rawText = self.__text;
      self.__formattedText = _.trim(self.__text, this.tag);
    } else {
      self.__formattedText = self.__text;
      self.__rawText = `${this.tag}${self.__text}`;
    }
  }

  // createDOM(config: EditorConfig): HTMLElement {
  //   const element = super.createDOM(config);
  //   // element.style.color = this.__rawText;
  //   return element;
  // }

  // updateDOM(
  //   prevNode: FormattableNode,
  //   dom: HTMLElement,
  //   config: EditorConfig
  // ): boolean {
  //   const isUpdated = super.updateDOM(prevNode, dom, config);
  //   if (prevNode.__rawText !== this.__rawText) {
  //     dom.style.color = this.__rawText;
  //   }
  //   return isUpdated;
  // }
}

export function $createElementTwoStateNode(
  rawText: string,
  regex: RegExp,
  tag: string,
  formatNumber: number
): ElementTwoStateNode {
  return new ElementTwoStateNode(
    rawText,
    regex,
    tag,
    TwoStateNodeState.formatted,
    formatNumber
  );
}

export function $onElementTwoStateNodeModification(node: ElementTwoStateNode) {
  // Don't do anything unless we're in raw mode - i.e. the user has the cursor inside the node
  if (node.getDisplayMode() === TwoStateNodeState.formatted) {
    return;
  }

  const matches = node.__text.match(node.__regex);

  // First check if there's any regex match, if not, then convert back to text node and we're done.
  if (!matches || matches.length === 0) {
    console.log(`onModification - trying to remove parent`);
    const parent = node.getParent();
    if (parent && !$isParagraphNode(parent)) {
      const newParent = $createParagraphNode();
      newParent.append(...parent.getChildren());

      parent.replace(newParent);
      return;
    }

    console.log(`onModification - doing a replace back to textNode`);
    const newNode = $createTextNode(node.getRawText());
    node.replace(newNode);

    console.log(`onModification - returning`);
    // return newNode;
  }

  node.updateInternalTexts();
}

export function $isElementTwoStateNode(
  node: LexicalNode | null | undefined
): node is ElementTwoStateNode {
  return node instanceof ElementTwoStateNode;
}

export function $setDisplayMode(
  node: ElementTwoStateNode,
  mode: TwoStateNodeState
) {
  if (node.getDisplayMode() !== mode) {
    node.setDisplayMode(mode);
  }
}
