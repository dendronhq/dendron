"use strict";

import { Node } from "unist";
import { Heading } from "mdast";

var toString = require("mdast-util-to-string");

export function findIndex(array: Node[], fn: any) {
  for (var i = 0; i < array.length; i++) {
    if (fn(array[i], i)) {
      return i;
    }
  }
  return -1;
}

// module.exports = inject

/**
 * Inject some markdown into some other markdown at a desired heading.  Heading
 * levels in the source markdown are adjusted to match the target document
 * based on the target heading's level.  targetAst is modified in place
 *
 * @param {string} targetHeadingText The heading to look for in the target ast
 * @param {object} targetAst The target markdown document, as an mdast
 * @param {object} toInjectAst The source markdown to be injected into the target, also as an mdast.
 * @return {boolean} whether the specified section was found and content inserted
 * @example
 * var mdast = require('mdast')
 * var inject = require('mdast-util-inject')
 *
 * var target = mdast.parse('# A document\n## Section1\nBlah\n## Section2\nBlargh')
 * var newStuff = mdast.parse('# Some other document\nwith some content')
 * inject('Section1', target, newStuff)
 *
 * console.log(mdast.stringify(target))
 * // outputs:
 * // # A document
 * //
 * // ## Section1
 * //
 * // ### Some other document
 * //
 * // with some content
 * //
 * // ## Section2
 * //
 * // Blargh
 */
/*
function inject (targetHeadingText: string, targetAst: Node, toInjectAst: Node) {
  // find the heading after which to inject the new content
  var head = findIndex(targetAst.children as any[], function (node: Node) {
    return isHeading(node, targetHeadingText)
  })

  if (head === -1) {
    return false
  }

  // find the next heading at the same heading level, which is where we'll
  // STOP inserting
  var depth = targetAst.children[head].depth
  var nextHead = findIndex(targetAst.children, function (node, i) {
    return isHeading(node, false, depth) && i > head
  })

  // bump heading levels so they fall within the parent documents' heirarchy
  bumpHeadings(toInjectAst, depth)

  // insert content
  targetAst.children.splice.apply(targetAst.children, [
    head + 1, // start splice
    (nextHead >= 0 ? nextHead - head : targetAst.children.length - head) - 1 // items to delete
  ].concat(toInjectAst.children))

  return true
}
*/

/*
 * Test if the given node is a heading, optionally with the given text,
 * or <= the given depth
 */
export function isHeading(node: Node, text: string, depth?: number) {
  if (node.type !== "heading") {
    return false;
  }

  if (text) {
    var headingText = toString(node);
    // TODO: more flexible match?
    return text.trim().toLowerCase() === headingText.trim().toLowerCase();
  }

  if (depth) {
    return (node as Heading).depth <= depth;
  }

  return true;
}

var MAX_HEADING_DEPTH = 99999;

export function bumpHeadings(root: Node, baseDepth: number) {
  var headings: Heading[] = [];
  walk(root, function (node: Node) {
    if (node.type === "heading") {
      headings.push(node as Heading);
    }
  });

  var minDepth = headings.reduce(function (memo, h) {
    return Math.min(memo, h.depth);
  }, MAX_HEADING_DEPTH);

  var diff = baseDepth + 1 - minDepth;

  headings.forEach(function (h) {
    h.depth += diff;
  });
}

function walk(node: Node, fn: any) {
  fn(node);
  if (node.children) {
    (node.children as Node[]).forEach(function (n) {
      walk(n, fn);
    });
  }
}
