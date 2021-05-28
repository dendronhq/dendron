import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DNodeUtils,
  DNoteLoc,
  DNoteRefLink,
  DUtils,
  getSlugger,
  NoteProps,
  NoteUtils,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import _ from "lodash";
import { List } from "mdast";
import { html, paragraph, root } from "mdast-builder";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { Node, Parent } from "unist";
import visit from "unist-util-visit";
import { SiteUtils } from "../../topics/site";
import { parseNoteRefV2 } from "../../utils";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  NoteRefNoteV4,
  NoteRefNoteV4_LEGACY,
} from "../types";
import { MDUtilsV4, renderFromNoteProps } from "../utils";
import { AnchorUtils, LinkUtils } from "./utils";
import { WikiLinksOpts } from "./wikiLinks";

const LINK_REGEX = /^\!\[\[(.+?)\]\]/;

type PluginOpts = CompilerOpts;

type CompilerOpts = {
  prettyRefs?: boolean;
  wikiLinkOpts?: WikiLinksOpts;
};

type ConvertNoteRefOpts = {
  link: DNoteRefLink;
  proc: Unified.Processor;
  compilerOpts: CompilerOpts;
};
type ConvertNoteRefHelperOpts = ConvertNoteRefOpts & {
  refLvl: number;
  body: string;
  note: NoteProps;
};

const plugin: Plugin = function (this: Unified.Processor, opts?: PluginOpts) {
  attachParser(this);
  if (this.Compiler != null) {
    attachCompiler(this, opts);
  }
};

function attachParser(proc: Unified.Processor) {
  function locator(value: string, fromIndex: number) {
    return value.indexOf("![[", fromIndex);
  }

  function inlineTokenizer(eat: Eat, value: string) {
    const match = LINK_REGEX.exec(value);
    if (match) {
      const linkMatch = match[1].trim();
      const link = parseNoteRefV2(linkMatch);
      const { value } = LinkUtils.parseLink(linkMatch);

      let refNote: NoteRefNoteV4 = {
        type: DendronASTTypes.REF_LINK_V2,
        data: {
          link,
        },
        value,
      };

      return eat(match[0])(refNote);
    }
    return;
  }

  inlineTokenizer.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;
  inlineTokenizers.refLinkV2 = inlineTokenizer;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLinkV2");
  return Parser;
}

function attachCompiler(proc: Unified.Processor, opts?: CompilerOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  const copts = _.defaults(opts || {}, {});
  const { dest } = MDUtilsV4.getDendronData(proc);

  if (visitors) {
    visitors.refLinkV2 = function (node: NoteRefNoteV4_LEGACY) {
      const ndata = node.data;
      if (dest === DendronASTDest.MD_DENDRON) {
        const { fname, alias } = ndata.link.from;

        const { anchorStart, anchorStartOffset, anchorEnd } = ndata.link.data;
        let link = alias ? `${alias}|${fname}` : fname;
        let suffix = "";

        let vaultPrefix = ndata.link.data.vaultName
          ? `${CONSTANTS.DENDRON_DELIMETER}${ndata.link.data.vaultName}/`
          : "";

        if (anchorStart) {
          suffix += `#${anchorStart}`;
        }
        if (anchorStartOffset) {
          suffix += `,${anchorStartOffset}`;
        }
        if (anchorEnd) {
          suffix += `:#${anchorEnd}`;
        }
        return `![[${vaultPrefix}${link}${suffix}]]`;
      }

      const { error, data } = convertNoteRef({
        link: ndata.link,
        proc,
        compilerOpts: copts,
      });
      if (error) {
        return `ERROR converting ref: ${error.message}`;
      }
      return data;
    };
  }
}

const MAX_REF_LVL = 3;

/**
 * Look at links and do initial pass
 */
function convertNoteRef(opts: ConvertNoteRefOpts): {
  error: DendronError | undefined;
  data: string | undefined;
} {
  let data: string | undefined;
  let errors: DendronError[] = [];
  const { link, proc, compilerOpts } = opts;
  const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
  const refLvl = MDUtilsV4.getNoteRefLvl(proc());
  let { dest, vault, config } = MDUtilsV4.getDendronData(proc);
  if (link.data.vaultName) {
    vault = VaultUtils.getVaultByNameOrThrow({
      vaults: engine.vaults,
      vname: link.data.vaultName,
    })!;
  }
  if (!vault) {
    return {
      error: new DendronError({ message: "no vault specified" }),
      data: "",
    };
  }
  let { prettyRefs, wikiLinkOpts } = compilerOpts;
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data,
    };
  }

  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    const resp = engine.queryNotesSync({ qs: link.from.fname, vault });
    const out = _.filter(resp.data, (ent) =>
      DUtils.minimatch(ent.fname, link.from.fname)
    );
    noteRefs = _.sortBy(
      out.map((ent) => NoteUtils.toNoteLoc(ent)),
      "fname"
    );
  } else {
    noteRefs.push(link.from);
  }
  const out = noteRefs.map((ref) => {
    const fname = ref.fname;
    // TODO: find first unit with path
    const npath = DNodeUtils.getFullPath({
      wsRoot: engine.wsRoot,
      vault,
      basename: fname + ".md",
    });
    try {
      const note = file2Note(npath, vault);
      const body = note.body;
      const { error, data } = convertNoteRefHelper({
        body,
        note,
        link,
        refLvl: refLvl + 1,
        proc: MDUtilsV4.setDendronData(proc(), {
          overrides: { insertTitle: false },
        }),
        //proc,
        compilerOpts,
      });
      if (error) {
        errors.push(error);
      }
      if (prettyRefs) {
        let suffix = "";
        let href = wikiLinkOpts?.useId ? note.id : fname;
        if (dest === DendronASTDest.HTML) {
          const maybeNote = NoteUtils.getNoteByFnameV5({
            fname,
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          });
          suffix = ".html";
          if (maybeNote?.custom.permalink === "/") {
            href = "";
            suffix = "";
          }
        }
        if (dest === DendronASTDest.MD_ENHANCED_PREVIEW) {
          suffix = ".md";
        }
        const link = `"${wikiLinkOpts?.prefix || ""}${href}${suffix}"`;
        let title = getTitle({ config, note, loc: ref });
        return renderPretty({
          content: data,
          title,
          link,
        });
      } else {
        return data;
      }
    } catch (err) {
      debugger;
      const msg = `error reading file, ${npath}`;
      errors.push(new DendronError({ message: msg }));
      return msg;
    }
  });
  return { error, data: out.join("\n") };
}

export function convertNoteRefASTV2(
  opts: ConvertNoteRefOpts & { procOpts: any }
): { error: DendronError | undefined; data: Parent[] | undefined } {
  let errors: DendronError[] = [];
  const { link, proc, compilerOpts, procOpts } = opts;
  const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
  const refLvl = MDUtilsV4.getNoteRefLvl(proc());
  let { dest, vault, config, shouldApplyPublishRules } =
    MDUtilsV4.getDendronData(proc);
  if (link.data.vaultName) {
    vault = VaultUtils.getVaultByNameOrThrow({
      vaults: engine.vaults,
      vname: link.data.vaultName,
    })!;
  }

  if (!vault) {
    return {
      error: new DendronError({ message: "no vault specified" }),
      data: [],
    };
  }
  let { prettyRefs, wikiLinkOpts } = compilerOpts;
  if (
    !prettyRefs &&
    _.includes([DendronASTDest.HTML, DendronASTDest.MD_ENHANCED_PREVIEW], dest)
  ) {
    prettyRefs = true;
  }

  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data: [MDUtilsV4.genMDMsg("too many nested note refs")],
    };
  }

  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    const resp = engine.queryNotesSync({ qs: link.from.fname, vault });
    const out = _.filter(resp.data, (ent) =>
      DUtils.minimatch(ent.fname, link.from.fname)
    );
    noteRefs = _.sortBy(
      out.map((ent) => NoteUtils.toNoteLoc(ent)),
      "fname"
    );
  } else {
    noteRefs.push(link.from);
  }
  const out: Parent[] = noteRefs.map((ref) => {
    const fname = ref.fname;
    // TODO: find first unit with path
    const npath = DNodeUtils.getFullPath({
      wsRoot: engine.wsRoot,
      vault,
      basename: fname + ".md",
    });
    try {
      const note = file2Note(npath, vault);
      if (
        shouldApplyPublishRules &&
        !SiteUtils.canPublish({
          note,
          config: config!,
          engine,
        })
      ) {
        // TODO: in the future, add 403 pages
        return paragraph();
      }
      const body = note.body;
      const { error, data } = convertNoteRefHelperAST({
        body,
        link,
        refLvl: refLvl + 1,
        proc,
        compilerOpts,
        procOpts,
        note,
      });
      if (error) {
        errors.push(error);
      }
      if (prettyRefs) {
        let suffix = "";
        let href = wikiLinkOpts?.useId ? note.id : fname;
        let title = getTitle({ config, note, loc: ref });
        if (dest === DendronASTDest.HTML) {
          suffix = ".html";
          if (note.custom.permalink === "/") {
            href = "";
            suffix = "";
          }
        }
        if (dest === DendronASTDest.MD_ENHANCED_PREVIEW) {
          suffix = ".md";
        }
        const isPublished = SiteUtils.isPublished({
          note,
          config: config!,
          engine,
        });
        const link = isPublished
          ? `"${wikiLinkOpts?.prefix || ""}${href}${suffix}"`
          : undefined;
        return renderPrettyAST({
          content: data,
          title,
          link,
        });
      } else {
        return paragraph(data);
      }
    } catch (err) {
      debugger;
      const msg = `error reading file, ${npath}`;
      errors.push(new DendronError({ message: msg }));
      throw Error(msg);
      // return msg;
    }
  });
  return { error, data: out };
}

function convertNoteRefHelperAST(
  opts: ConvertNoteRefHelperOpts & { procOpts: any }
): Required<RespV2<Parent>> {
  const { proc, refLvl, link, note } = opts;
  const noteRefProc = proc();
  const engine = MDUtilsV4.getEngineFromProc(noteRefProc);
  MDUtilsV4.setNoteRefLvl(noteRefProc, refLvl);
  const procOpts = MDUtilsV4.getProcOpts(noteRefProc);
  let bodyAST: DendronASTNode;
  if (MDUtilsV4.getProcOpts(proc).config?.useNunjucks) {
    let contentsClean = renderFromNoteProps({
      fname: note.fname,
      vault: note.vault,
      wsRoot: engine!.engine.wsRoot,
      notes: engine!.engine.notes,
    });
    bodyAST = noteRefProc.parse(contentsClean) as DendronASTNode;
  } else {
    bodyAST = noteRefProc.parse(note.body) as DendronASTNode;
  }
  const { anchorStart, anchorEnd, anchorStartOffset } = _.defaults(link.data, {
    anchorStartOffset: 0,
  });

  // TODO: can i just strip frontmatter when reading?
  let anchorStartIndex = bodyAST.children[0].type === "yaml" ? 1 : 0;
  let secondaryStartIndex: number | undefined;
  let anchorEndIndex = bodyAST.children.length;
  let secondaryEndIndex: number | undefined;

  if (anchorStart) {
    [anchorStartIndex, secondaryStartIndex] = findAnchor({
      nodes: bodyAST.children,
      match: anchorStart,
    });
    if (anchorStartIndex < 0) {
      const data = MDUtilsV4.genMDMsg(`Start anchor ${anchorStart} not found`);
      return { data, error: null };
    }
  }

  if (anchorEnd) {
    [anchorEndIndex, secondaryEndIndex] = findAnchor({
      nodes: bodyAST.children.slice(anchorStartIndex + 1),
      match: anchorEnd,
    });
    if (anchorEndIndex < 0) {
      const data = MDUtilsV4.genMDMsg(`end anchor ${anchorEnd} not found`);
      return { data, error: null };
    }
    anchorEndIndex += anchorStartIndex + 1;
  } else if (AnchorUtils.isBlockAnchor(anchorStart)) {
    // If no end is specified and the start is a block anchor, the end is implicitly the end of the referenced block.
    anchorEndIndex = anchorStartIndex + 1;
  }

  if (bodyAST.children[anchorStartIndex].type === "list") {
    if (anchorStartIndex === anchorEndIndex) {
      // Within the same list
      (bodyAST.children[anchorStartIndex] as List).children.slice(
        secondaryStartIndex,
        secondaryEndIndex
      );
    } else {
      // Start anchor is in the list, but the end anchor is either not in the list, or is in a different list
      (bodyAST.children[anchorStartIndex] as List).children.slice(
        secondaryStartIndex
      );
    }
  }
  if (
    bodyAST.children[anchorEndIndex].type === "list" &&
    anchorStartIndex !== anchorEndIndex
  ) {
    // The end anchor is in the list, but the start anchor is either not in the list, or is in a different list
    (bodyAST.children[anchorEndIndex] as List).children.slice(
      secondaryEndIndex
    );
  }

  // slice of interested range
  try {
    let out = root(
      bodyAST.children.slice(
        anchorStartIndex + anchorStartOffset,
        anchorEndIndex
      )
    );
    let tmpProc = MDUtilsV4.procFull({ ...procOpts });
    tmpProc = MDUtilsV4.setDendronData(tmpProc, { insideNoteRef: true });

    // let tmpProc = proc.data("procFull") as Processor;
    const { dest } = MDUtilsV4.getDendronData(tmpProc);
    if (dest === DendronASTDest.HTML) {
      let out3 = tmpProc.runSync(out) as Parent;
      return { error: null, data: out3 };
    } else {
      let out2 = tmpProc.stringify(out);
      out = tmpProc.parse(out2) as Parent;
      return { error: null, data: out };
    }
  } catch (err) {
    debugger;
    console.log("ERROR WITH RE in AST");
    console.log(JSON.stringify(err));
    return {
      error: new DendronError({
        message: "error processing note ref",
        payload: err,
      }),
      data: MDUtilsV4.genMDMsg("error processing ref"),
    };
  }
}

function convertNoteRefHelper(
  opts: ConvertNoteRefHelperOpts
): Required<RespV2<string>> {
  const { body, proc, refLvl, link } = opts;
  const noteRefProc = proc();
  MDUtilsV4.setNoteRefLvl(noteRefProc, refLvl);
  const bodyAST = noteRefProc.parse(body) as DendronASTNode;
  const { anchorStart, anchorEnd, anchorStartOffset } = link.data;

  // TODO: can i just strip frontmatter when reading?
  let anchorStartIndex = bodyAST.children[0].type === "yaml" ? 1 : 0;
  let secondaryStartIndex: number | undefined;
  let anchorEndIndex = bodyAST.children.length;
  let secondaryEndIndex: number | undefined;

  if (anchorStart) {
    if (anchorStart[0] === "^") {
    } else {
      [anchorStartIndex, secondaryStartIndex] = findAnchor({
        nodes: bodyAST.children,
        match: anchorStart,
      });
    }
    if (anchorStartIndex < 0) {
      return { data: `Start anchor ${anchorStart} not found`, error: null };
    }
  }

  if (anchorEnd) {
    [anchorEndIndex, secondaryEndIndex] = findAnchor({
      nodes: bodyAST.children.slice(anchorStartIndex + 1),
      match: anchorEnd,
    });
    if (anchorEndIndex < 0) {
      return { data: `end anchor ${anchorEnd} not found`, error: null };
    }
    anchorEndIndex += anchorStartIndex + 1;
  } else if (AnchorUtils.isBlockAnchor(anchorStart)) {
    // If no end is specified and the start is a block anchor, the end is implicitly the end of the referenced block.
    anchorEndIndex = anchorStartIndex + 1;
  }

  if (bodyAST.children[anchorStartIndex].type === "list") {
    if (anchorStartIndex === anchorEndIndex) {
      // Within the same list
      (bodyAST.children[anchorStartIndex] as List).children.slice(
        secondaryStartIndex,
        secondaryEndIndex
      );
    } else {
      // Start anchor is in the list, but the end anchor is either not in the list, or is in a different list
      (bodyAST.children[anchorStartIndex] as List).children.slice(
        secondaryStartIndex
      );
    }
  }
  if (
    bodyAST.children[anchorEndIndex].type === "list" &&
    anchorStartIndex !== anchorEndIndex
  ) {
    // The end anchor is in the list, but the start anchor is either not in the list, or is in a different list
    (bodyAST.children[anchorEndIndex] as List).children.slice(
      secondaryEndIndex
    );
  }

  // slice of interested range
  try {
    bodyAST.children = bodyAST.children.slice(anchorStartIndex, anchorEndIndex);
    let out = noteRefProc
      .processSync(noteRefProc.stringify(bodyAST))
      .toString();
    if (anchorStartOffset) {
      out = out.split("\n").slice(anchorStartOffset).join("\n");
    }
    return { error: null, data: out };
  } catch (err) {
    console.log("ERROR WITH REF");
    console.log(JSON.stringify(err));
    return {
      error: new DendronError({
        message: "error processing note ref",
        payload: err,
      }),
      data: "error processing ref",
    };
  }
}

/** Searches for anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found.
 *   If the anchor was a block anchor and was found in a list, then the second index is the
 *   index of the list element where the anchor was found.
 */
function findAnchor({
  nodes,
  match,
}: {
  nodes: DendronASTNode["children"];
  match: string;
}): [number] | [number, number] {
  if (AnchorUtils.isBlockAnchor(match)) {
    const anchorId = match.slice(1);
    return findBlockAnchor({ nodes, match: anchorId });
  } else {
    return [findHeader({ nodes, match, slugger: getSlugger() })];
  }
}

function findHeader({
  nodes,
  match,
  slugger,
}: {
  nodes: DendronASTNode["children"];
  match: string;
  slugger: ReturnType<typeof getSlugger>;
}) {
  const foundIndex = MDUtilsV4.findIndex(nodes, function (node: Node) {
    return MDUtilsV4.matchHeading(node, match, { slugger });
  });
  return foundIndex;
}

/** Searches for block anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found.
 *   If the anchor was found in a list, then the second index is the index of the list element
 *   where the anchor was found.
 */
function findBlockAnchor({
  nodes,
  match,
}: {
  nodes: Node[];
  match: string;
}): [number] | [number, number] {
  function findMatch(node: Node) {
    let found = false;
    visit(node, DendronASTTypes.BLOCK_ANCHOR, (anchor: BlockAnchor) => {
      found = anchor.id === match;
      if (found) return false; // stop traversal
      return; // continue traversal
    });
    return found;
  }

  let foundIndex = MDUtilsV4.findIndex(nodes, findMatch);
  if (foundIndex >= 0) {
    const parent = nodes[foundIndex] as Parent;
    if (parent.type === "list") {
      // If it's in a list, we'll need to slice the children of the list so we need that index too.
      const listItemIndex = MDUtilsV4.findIndex(parent.children, findMatch);
      return [foundIndex, listItemIndex];
    }
    // If located independently after a block, then the block anchor refers to the previous block
    if (parent.children.length === 1) return [foundIndex - 1];
  }
  return [foundIndex];
}

function renderPretty(opts: { content: string; title: string; link: string }) {
  const { content, title, link } = opts;
  return `<div class="portal-container">
<div class="portal-head">
<div class="portal-backlink" >
<div class="portal-title">From <span class="portal-text-title">${title}</span></div>
<a href=${link} class="portal-arrow">Go to text <span class="right-arrow">→</span></a>
</div>
</div>
<div id="portal-parent-anchor" class="portal-parent" markdown="1">
<div class="portal-parent-fader-top"></div>
<div class="portal-parent-fader-bottom"></div>        

${_.trim(content)}

</div>    
</div>`;
}

function getTitle(opts: {
  config: DendronConfig;
  note: NoteProps;
  loc: DNoteLoc;
}) {
  const { config, note, loc } = opts;
  const { alias, fname } = loc;
  return config.useNoteTitleForLink ? note.title : alias || fname || "no title";
}

function renderPrettyAST(opts: {
  content: Parent;
  title: string;
  link?: string;
}) {
  const { content, title, link } = opts;
  let linkLine = _.isUndefined(link)
    ? ""
    : `<a href=${link} class="portal-arrow">Go to text <span class="right-arrow">→</span></a>`;
  const top = `<div class="portal-container">
<div class="portal-head">
<div class="portal-backlink" >
<div class="portal-title">From <span class="portal-text-title">${title}</span></div>
${linkLine}
</div>
</div>
<div id="portal-parent-anchor" class="portal-parent" markdown="1">
<div class="portal-parent-fader-top"></div>
<div class="portal-parent-fader-bottom"></div>`;
  const bottom = `\n</div></div>`;
  return paragraph([html(top)].concat([content]).concat([html(bottom)]));
}

export { plugin as noteRefsV2 };
export { PluginOpts as NoteRefsOptsV2 };
