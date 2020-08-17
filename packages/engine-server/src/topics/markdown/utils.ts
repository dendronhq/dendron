/* eslint-disable camelcase */
import _markdownit from "markdown-it";
// @ts-ignore
import markdownItAST from "markdown-it-ast";
import markdownItRegex from "markdown-it-regex";
import Token from "markdown-it/lib/token";
import { MDRenderer } from "./renderer";

enum NodeType {
  code_inline = "code_inline",
  code_block = "code_block",
  fence = "fence",
  image = "image",
  hardbreak = "hardbreak",
  softbreak = "softbreak",
  text = "text",
  html_block = "html_block",
  html_inline = "html_inline",
}

export type MDNode = {
  nodeType: NodeType;
  openNode: Token;
  closeNode: Token;
  children: Token[];
};

export function md() {
  return _markdownit();
}

function token2MD(token: Token) {
  switch (token.type) {
    case NodeType.text: {
      break;
    }
    default: {
      throw Error(`unhandled node type: ${token.type}`);
    }
  }
}

export function tokens2MD(tokens: Token[]): string {
  return new MDRenderer().renderInline(tokens, {}, {});
  //   return tokens
  //     .map((n) => {
  //       return token2MD(n);
  //     })
  //     .join("");
  //   const markdownIt = _markdownit();
  //   const renderer = new MDRenderer();
  //   const
  // @ts-ignore
  //   markdownIt.renderer = renderer;
  //   const options = {};
  //   const env = {};
  //     return renderer.render(nodes, {}, {});
  //   return markdownIt.render(nodes as string);
}

export function md2Tokens(txt: string): Token[] {
  const markdownIt = _markdownit();
  const tokens: Token[] = markdownIt
    .use(markdownItRegex, {
      name: "ref-document",
      regex: /\[\[([^\[\]]+?)\]\]/,
      // replace: (rawRef: string) => {
      //   const { ref, label } = parseRef(rawRef);
      //   // const fsPath = findUriByRef(getWorkspaceCache().allUris, ref)?.fsPath;
      //   // if (!fsPath) {
      //   //   return getInvalidRefAnchor(label || ref);
      //   // }
      //   return getRefAnchor(ref, label || ref);
      // },
    })
    .parse(txt, {});
  return tokens;
}
