// @ts-ignore
import markdownItAST from "markdown-it-ast";
import markdownItRegex from "markdown-it-regex";
import Token from "markdown-it/lib/token";
import _markdownit from "markdown-it";

const markdownIt = _markdownit();

export type MDNode = {
  nodeType: "heading" | "other";
  openNode: Token;
  closeNode: Token;
  children: Token[];
};

export function md2MDNodes(txt: string): MDNode[] {
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
