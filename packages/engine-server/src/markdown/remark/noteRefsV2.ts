import {
  CONSTANTS,
  DendronError,
  DNodeUtilsV2,
  DNoteLoc,
  DNoteRefLink,
  DUtils,
  getSlugger,
  NotePropsV2,
  NoteUtilsV2,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import _ from "lodash";
import { html, paragraph, root } from "mdast-builder";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { Node, Parent } from "unist";
import { SiteUtils } from "../../topics/site";
import { parseNoteRefV2 } from "../../utils";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  NoteRefNoteV4,
  NoteRefNoteV4_LEGACY,
} from "../types";
import { MDUtilsV4, renderFromNoteProps } from "../utils";
import { LinkUtils } from "./utils";
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
  note: NotePropsV2;
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
        return `ERROR converting ref: ${error.msg}`;
      }
      return data;
    };
  }
}

const MAX_REF_LVL = 3;

/**
 * Look at links and do initial pass
 */
function convertNoteRef(
  opts: ConvertNoteRefOpts
): { error: DendronError | undefined; data: string | undefined } {
  let data: string | undefined;
  let errors: DendronError[] = [];
  const { link, proc, compilerOpts } = opts;
  const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
  const refLvl = MDUtilsV4.getNoteRefLvl(proc());
  let { dest, vault } = MDUtilsV4.getDendronData(proc);
  if (link.data.vaultName) {
    vault = VaultUtils.getVaultByName({
      vaults: engine.vaultsv3,
      vname: link.data.vaultName,
      throwOnMissing: true,
    })!;
  }
  if (!vault) {
    return { error: new DendronError({ msg: "no vault specified" }), data: "" };
  }
  let { prettyRefs, wikiLinkOpts } = compilerOpts;
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ msg: "too many nested note refs" }),
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
      out.map((ent) => NoteUtilsV2.toNoteLoc(ent)),
      "fname"
    );
  } else {
    noteRefs.push(link.from);
  }
  const out = noteRefs.map((ref) => {
    const fname = ref.fname;
    const alias = ref.alias;
    // TODO: find first unit with path
    const npath = DNodeUtilsV2.getFullPath({
      wsRoot: engine.wsRoot,
      vault,
      basename: fname + ".md",
    });
    try {
      const note = file2Note(npath, vault);
      const body = note.body;
      // let noteRefProc = proc();
      // MDUtilsV4.setDendronData(proc, {overrides: {insertTitle: false}});
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
        let href = fname;
        if (wikiLinkOpts?.useId) {
          const maybeNote = NoteUtilsV2.getNoteByFnameV5({
            fname,
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          });
          if (!maybeNote) {
            return `error with ${ref}`;
          }
          href = maybeNote?.id;
        }
        if (dest === DendronASTDest.HTML) {
          const maybeNote = NoteUtilsV2.getNoteByFnameV5({
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
        return renderPretty({
          content: data,
          title: alias || fname || "no title",
          link,
        });
      } else {
        return data;
      }
    } catch (err) {
      debugger;
      const msg = `error reading file, ${npath}`;
      errors.push(new DendronError({ msg }));
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
  let {
    dest,
    vault,
    config,
    shouldApplyPublishRules,
  } = MDUtilsV4.getDendronData(proc);
  if (link.data.vaultName) {
    vault = VaultUtils.getVaultByName({
      vaults: engine.vaultsv3,
      vname: link.data.vaultName,
      throwOnMissing: true,
    })!;
  }

  if (!vault) {
    return { error: new DendronError({ msg: "no vault specified" }), data: [] };
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
      error: new DendronError({ msg: "too many nested note refs" }),
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
      out.map((ent) => NoteUtilsV2.toNoteLoc(ent)),
      "fname"
    );
  } else {
    noteRefs.push(link.from);
  }
  const out: Parent[] = noteRefs.map((ref) => {
    const fname = ref.fname;
    const alias = ref.alias;
    // TODO: find first unit with path
    const npath = DNodeUtilsV2.getFullPath({
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
        let href = fname;
        if (wikiLinkOpts?.useId) {
          const maybeNote = NoteUtilsV2.getNoteByFnameV5({
            fname,
            notes: engine.notes,
            vault,
            wsRoot: engine.wsRoot,
          });
          if (!maybeNote) {
            throw Error("error with ref");
            //return `error with ${ref}`;
          }
          href = maybeNote?.id;
        }
        if (dest === DendronASTDest.HTML) {
          const maybeNote = NoteUtilsV2.getNoteByFnameV5({
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
        return renderPrettyAST({
          content: data,
          title: alias || fname || "no title",
          link,
        });
      } else {
        return paragraph(data);
      }
    } catch (err) {
      debugger;
      const msg = `error reading file, ${npath}`;
      errors.push(new DendronError({ msg }));
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
  let anchorEndIndex = bodyAST.children.length;
  const slugger = getSlugger();

  if (anchorStart) {
    anchorStartIndex = findHeader({
      nodes: bodyAST.children,
      match: anchorStart,
      slugger,
    });
    if (anchorStartIndex < 0) {
      const data = MDUtilsV4.genMDMsg(`Start anchor ${anchorStart} not found`);
      return { data, error: null };
    }
  }

  if (anchorEnd) {
    anchorEndIndex = findHeader({
      nodes: bodyAST.children.slice(anchorStartIndex + 1),
      match: anchorEnd,
      slugger,
    });
    if (anchorEndIndex < 0) {
      const data = MDUtilsV4.genMDMsg(`end anchor ${anchorEnd} not found`);
      return { data, error: null };
    }
    anchorEndIndex += anchorStartIndex + 1;
  }
  // slice of interested range
  try {
    let out = root(
      bodyAST.children.slice(
        anchorStartIndex + anchorStartOffset,
        anchorEndIndex
      )
    );
    const tmpProc = MDUtilsV4.procFull({ ...procOpts });
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
        msg: "error processing note ref",
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
  let anchorEndIndex = bodyAST.children.length;
  const slugger = getSlugger();

  if (anchorStart) {
    anchorStartIndex = findHeader({
      nodes: bodyAST.children,
      match: anchorStart,
      slugger,
    });
    if (anchorStartIndex < 0) {
      return { data: `Start anchor ${anchorStart} not found`, error: null };
    }
  }

  if (anchorEnd) {
    anchorEndIndex = findHeader({
      nodes: bodyAST.children.slice(anchorStartIndex + 1),
      match: anchorEnd,
      slugger,
    });
    if (anchorEndIndex < 0) {
      return { data: `end anchor ${anchorEnd} not found`, error: null };
    }
    anchorEndIndex += anchorStartIndex + 1;
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
        msg: "error processing note ref",
        payload: err,
      }),
      data: "error processing ref",
    };
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

function renderPretty(opts: { content: string; title: string; link: string }) {
  const { content, title, link } = opts;
  return `
  <div class="portal-container">
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
  </div>
  `;
}

function renderPrettyAST(opts: {
  content: Parent;
  title: string;
  link: string;
}) {
  const { content, title, link } = opts;
  const top = `<div class="portal-container">
  <div class="portal-head">
  <div class="portal-backlink" >
  <div class="portal-title">From <span class="portal-text-title">${title}</span></div>
  <a href=${link} class="portal-arrow">Go to text <span class="right-arrow">→</span></a>
  </div>
  </div>
  <div id="portal-parent-anchor" class="portal-parent" markdown="1">
  <div class="portal-parent-fader-top"></div>
  <div class="portal-parent-fader-bottom"></div>
  `;
  const bottom = `\n</div>    
  </div>`;
  return paragraph([html(top)].concat([content]).concat([html(bottom)]));
}

export { plugin as noteRefsV2 };
export { PluginOpts as NoteRefsOptsV2 };
