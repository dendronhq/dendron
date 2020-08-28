/* eslint-disable func-names */
/* eslint-disable no-plusplus */
/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/**
 * class Renderer
 **/
/**
 * DEPRECATE
 */

import * as _Renderer from "markdown-it/lib/renderer";
import { escapeHtml, unescapeAll } from "markdown-it/lib/common/utils";
import Token from "markdown-it/lib/token";
import MarkdownIt from "markdown-it";
import _, { assign } from "lodash";

type RenderRuleRecord = _Renderer.RenderRuleRecord;
// var assign          = require('./common/utils').assign;
// var unescapeAll     = require('./common/utils').unescapeAll;
// var escapeHtml      = require('./common/utils').escapeHtml;

const default_rules: RenderRuleRecord = {};

default_rules.code_inline = function (tokens, idx, _options, _env, _slf) {
  return "`" + escapeHtml(tokens[idx].content) + "`";
};

default_rules.code_block = function (tokens, idx, _options, _env, slf) {
  const token = tokens[idx];

  return (
    "<pre" +
    slf.renderAttrs(token) +
    "><code>" +
    escapeHtml(tokens[idx].content) +
    "</code></pre>\n"
  );
};

default_rules.fence = function (tokens, idx, options, _env, slf) {
  const token = tokens[idx];
  const info = token.info ? unescapeAll(token.info).trim() : "";
  let langName = "";
  let highlighted;
  let i;
  let tmpAttrs;
  let tmpToken;

  if (info) {
    langName = info.split(/\s+/g)[0];
  }

  if (options.highlight) {
    highlighted =
      options.highlight(token.content, langName) || escapeHtml(token.content);
  } else {
    highlighted = escapeHtml(token.content);
  }

  if (highlighted.indexOf("<pre") === 0) {
    return highlighted + "\n";
  }

  // If language exists, inject class gently, without modifying original token.
  // May be, one day we will add .clone() for token and simplify this part, but
  // now we prefer to keep things local.
  if (info) {
    i = token.attrIndex("class");
    tmpAttrs = token.attrs ? token.attrs.slice() : [];

    if (i < 0) {
      tmpAttrs.push(["class", options.langPrefix + langName]);
    } else {
      tmpAttrs[i][1] += " " + options.langPrefix + langName;
    }

    // Fake token just to render attributes
    tmpToken = {
      attrs: tmpAttrs,
    };

    return (
      "<pre><code" +
      slf.renderAttrs(tmpToken as Token) +
      ">" +
      highlighted +
      "</code></pre>\n"
    );
  }

  return "```\n" + highlighted + "```\n";
};

default_rules.image = function (tokens, idx, options, env, slf) {
  const token: Token = tokens[idx] as Token;

  // "alt" attr MUST be set, even if empty. Because it's mandatory and
  // should be placed on proper position for tests.
  //
  // Replace content with actual value
  //@ts-ignore
  token.attrs[token.attrIndex("alt")][1] = slf.renderInlineAsText(
    //@ts-ignore
    token.children,
    options,
    env
  );

  return slf.renderToken(tokens, idx, options);
};

default_rules.hardbreak = function (_tokens, _idx, options /*, env */) {
  return options.xhtmlOut ? "<br />\n" : "<br>\n";
};
default_rules.softbreak = function (_tokens, _idx, options /*, env */) {
  return options.breaks ? (options.xhtmlOut ? "<br />\n" : "<br>\n") : "\n";
};

default_rules.text = function (tokens, idx /*, options, env */) {
  return escapeHtml(tokens[idx].content);
};

default_rules.html_block = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};
default_rules.html_inline = function (tokens, idx /*, options, env */) {
  return tokens[idx].content;
};

export class MDRenderer {
  public rules: RenderRuleRecord;

  constructor() {
    this.rules = assign({}, default_rules);
  }

  /**
   * Renderer.renderAttrs(token) -> String
   *
   * Render token attributes to string.
   **/
  renderAttrs(token: Token): string {
    let i;
    let l;
    let result;

    if (!token.attrs) {
      return "";
    }

    result = "";

    for (i = 0, l = token.attrs.length; i < l; i++) {
      result +=
        " " +
        escapeHtml(token.attrs[i][0]) +
        '="' +
        escapeHtml(token.attrs[i][1]) +
        '"';
    }

    return result;
  }

  /**
   * Renderer.renderToken(tokens, idx, options) -> String
   * - tokens (Array): list of tokens
   * - idx (Numbed): token index to render
   * - options (Object): params of parser instance
   *
   * Default token renderer. Can be overriden by custom function
   * in [[Renderer#rules]].
   **/
  renderToken(
    tokens: Token[],
    idx: number,
    _options: MarkdownIt.Options
  ): string {
    let nextToken;
    let result = "";
    let needLf = false;
    const token = tokens[idx];

    // Tight list paragraphs
    if (token.hidden) {
      return "";
    }

    // Insert a newline between hidden paragraph and subsequent opening
    // block-level tag.
    //
    // For example, here we should insert a newline before blockquote:
    //  - a
    //    >
    //
    if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
      result += ` (debug-0: newline at beg)`;
      result += "\n";
    }

    // Add token name, e.g. `<img`
    // result += (token.nesting === -1 ? "</" : "<") + token.tag;
    const typesShowMarkup = ["list_item_open", "heading_open"];
    if (token.nesting === 1) {
      if (token.block && _.includes(typesShowMarkup, token.type)) {
        let markup = token.markup;
        // ordered list
        if (markup === ".") {
          markup = "1.";
        }
        result += markup + " ";
      }
    }

    // Encode attributes, e.g. `<img src="foo"`
    // result += this.renderAttrs(token);

    // Add a slash for self-closing tags, e.g. `<img src="foo" /`
    // if (token.nesting === 0 && options.xhtmlOut) {
    //   result += " /";
    // }

    const blocks_that_need_lf = [
      "paragraph_open",
      "paragraph_close",
      "heading_close",
    ];
    const blocksWithoutLF = ["bullet_list_close"];
    const matchNoLF = _.includes(blocksWithoutLF, token.type);
    const matchNeedLF = _.includes(blocks_that_need_lf, token.type);
    if (matchNeedLF) {
      needLf = true;
    }

    // Check if we need to add a newline after this tag
    if (token.block && !matchNeedLF) {
      needLf = true;
      if (matchNoLF) {
        needLf = false;
      }
      if (token.nesting === 1) {
        if (idx + 1 < tokens.length) {
          nextToken = tokens[idx + 1];

          if (nextToken.type === "inline" || nextToken.hidden) {
            // Block-level tag containing an inline tag.
            //
            needLf = false;
          } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
            // Opening tag + closing tag of the same type. E.g. `<li></li>`.
            //
            needLf = false;
          }
        }
      }
    }

    // result += ` (debug: needLf: ${needLf}, type:${token.type})`;
    result += needLf ? `\n` : "";
    return result;
  }

  /**
   * Renderer.renderInline(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to renter
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * The same as [[Renderer.render]], but for single token of `inline` type.
   **/
  renderInline(tokens: Token[], options: MarkdownIt.Options, env: any): string {
    let type;
    let result = "";
    const rules = this.rules;

    for (let i = 0, len = tokens.length; i < len; i++) {
      type = tokens[i].type;

      if (typeof rules[type] !== "undefined") {
        // @ts-ignore
        result += rules[type](tokens, i, options, env, this);
      } else {
        result += this.renderToken(tokens, i, options);
      }
    }

    return result;
  }

  /** internal
   * Renderer.renderInlineAsText(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to renter
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * Special kludge for image `alt` attributes to conform CommonMark spec.
   * Don't try to use it! Spec requires to show `alt` content with s
   * instead of simple escaping.
   **/
  renderInlineAsText(
    tokens: Token[],
    options: MarkdownIt.Options,
    env: any
  ): string {
    let result = "";

    for (let i = 0, len = tokens.length; i < len; i++) {
      if (tokens[i].type === "text") {
        result += tokens[i].content;
      } else if (tokens[i].type === "image") {
        // @ts-ignore
        result += this.renderInlineAsText(tokens[i].children, options, env);
      }
    }

    return result;
  }

  /**
   * Renderer.render(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to renter
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * Takes token stream and generates HTML. Probably, you will never need to call
   * this method directly.
   **/
  render(tokens: Token[], options: MarkdownIt.Options, env: any): string {
    let i;
    let len;
    let type;
    let result = "";
    const rules = this.rules;

    for (i = 0, len = tokens.length; i < len; i++) {
      type = tokens[i].type;

      if (type === "inline") {
        // @ts-ignore
        //result += this.renderInline(tokens[i].children, options, env);
        result += tokens[i].content;
      } else if (typeof rules[type] !== "undefined") {
        // @ts-ignore
        result += rules[tokens[i].type](tokens, i, options, env, this);
      } else {
        result += this.renderToken(tokens, i, options);
      }
    }

    return result;
  }
}
