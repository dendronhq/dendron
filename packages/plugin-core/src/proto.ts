import _markdownIt from "markdown-it";
// @ts-ignore
import markdownItAST from "markdown-it-ast";
import Token from "markdown-it/lib/token";
import { TokenMata } from "markdown-it/lib/rules_inline/state_inline";
import _, { map } from "lodash";
var markdownIt = _markdownIt();

// console.log(markdownIt);
// console.log(markdownItAST);

const txt = `
# Head 1

Head 1 Text

## Head 2.1

Head 2.1 Text

## Head 2.2

Head 2.2 Text`;

type ASTEnt = {
  nodeType: "heading" | "other";
  openNode: Token;
  closeNode: Token;
  children: Token[];
};

const tokens: Token[] = markdownIt.parse(txt, {});
const out: ASTEnt[] = markdownItAST.makeAST(tokens);
// console.log(txt.split('\n'));

const headings = out.filter((ent: ASTEnt) => ent.nodeType === "heading");
headings.forEach((h) => {
  const map = h.openNode.map;
  const content = h.children[0].content;
  console.log(content, map);
});
const stats = {
  lines: out.length,
  headings: headings.length,
};
console.log(stats);

function genAST(txt: string): ASTEnt[] {
  const tokens: Token[] = markdownIt.parse(txt, {});
  return markdownItAST.makeAST(tokens);
}

type TokenMap = [number, number] | null;

function extractBlock(
  txt: string,
  link: { anchorStart: string; anchorEnd?: string }
): any {
  const ast = genAST(txt);
  let { anchorStart, anchorEnd } = link;
  const clean = {
    anchorStart: _.trim(anchorStart),
    anchorEnd: _.trim(anchorEnd),
  };
  const out: any = {
    anchorStart: null,
    anchorEnd: null,
  };
  ast.forEach((ent) => {
    if (ent.nodeType === "heading") {
      let matchKey: keyof typeof clean = _.isNull(out["anchorStart"])
        ? "anchorStart"
        : "anchorEnd";
      if (_.trim(ent.children[0].content) === clean[matchKey]) {
        out[matchKey] = ent.openNode.map;
      }
    }
  });
  const txtAsLines = _.trim(txt).split("\n");
  console.log(txtAsLines);
  const start = out.anchorStart[0] - 1;
  const block = txtAsLines.slice(start).join("\n");
  return { out, block };
}

const out1 = extractBlock(txt, { anchorStart: "Head 2.1" });
console.log(out1);
console.log("done");
