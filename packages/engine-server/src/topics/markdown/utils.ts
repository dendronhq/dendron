// @ts-ignore
import markdownItAST from "markdown-it-ast";
import markdownItRegex from "markdown-it-regex";
import Token from "markdown-it/lib/token";
import _markdownit from "markdown-it";
import { MDRenderer } from "./renderer";

export type MDNode = {
  nodeType: "heading" | "other";
  openNode: Token;
  closeNode: Token;
  children: Token[];
};

export function mdNodes2MD(nodes: MDNode[] | string): string {
  const markdownIt = _markdownit();
  const renderer = new MDRenderer();
  // @ts-ignore
  markdownIt.renderer = renderer;
  const options = {};
  const env = {};
  //   return renderer.render(nodes, {}, {});
  return markdownIt.render(nodes as string);
}

export function md2MDNodes(txt: string): MDNode[] {
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
  return markdownItAST.makeAST(tokens);
}
