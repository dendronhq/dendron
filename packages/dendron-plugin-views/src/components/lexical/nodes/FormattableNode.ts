import { LexicalNode, NodeKey, TextNode } from "lexical";

//TODO: Support partial bolded line: *this part is bolded* but this is not
export class FormattableNode extends TextNode {
  __rawText: string;
  __displayText: string;
  __displayMode: "raw" | "display";

  constructor(
    displayText: string,
    rawText: string,
    mode: "raw" | "display",
    key?: NodeKey
  ) {
    super(mode === "raw" ? rawText : displayText, key);
    this.__rawText = rawText;
    this.__displayText = displayText;
    this.__displayMode = mode;

    if (mode === "display") {
      this.__format = 1;
    } else {
      this.__format = 0;
    }
  }

  static getType(): string {
    return "formattable";
  }

  static clone(node: FormattableNode): FormattableNode {
    return new FormattableNode(
      node.__displayText,
      node.__rawText,
      node.__displayMode,
      node.__key
    );
  }

  getDisplayText(): string {
    const self = this.getLatest();
    return self.__displayText;
  }

  getRawText(): string {
    const self = this.getLatest();
    return self.__rawText;
  }

  getDisplayMode(): "raw" | "display" {
    const self = this.getLatest();
    return self.__displayMode;
  }

  setDisplayMode(mode: "raw" | "display") {
    const self = this.getLatest();
    self.__displayMode = mode;
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

export function $createFormattableNode(
  text: string,
  rawText: string
): FormattableNode {
  return new FormattableNode(text, rawText, "display");
}

export function $isFormattableNode(
  node: LexicalNode | null | undefined
): node is FormattableNode {
  return node instanceof FormattableNode;
}

export function $setDisplayMode(
  node: FormattableNode,
  mode: "raw" | "display"
) {
  if (node.getDisplayMode() !== mode) {
    node.setDisplayMode(mode);

    if (mode === "raw") {
      node.setTextContent(node.getRawText());
      node.setFormat(0);
    } else {
      node.setTextContent(node.getDisplayText());
      node.setFormat(1);
    }
  }
}
