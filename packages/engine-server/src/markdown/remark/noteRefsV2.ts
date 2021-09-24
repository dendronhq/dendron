import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DNodeUtils,
  DNoteLoc,
  DNoteRefLink,
  DUtils,
  DVault,
  ErrorFactory,
  getSlugger,
  isBlockAnchor,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import _ from "lodash";
import { brk, html, paragraph, root } from "mdast-builder";
import { Eat } from "remark-parse";
import Unified, { Plugin } from "unified";
import { Node, Parent } from "unist";
import { DConfig } from "../../config";
import { SiteUtils } from "../../topics/site";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  NoteRefNoteRawV4,
  NoteRefNoteV4,
  NoteRefNoteV4_LEGACY,
} from "../types";
import { MDUtilsV4, ParentWithIndex, renderFromNoteProps } from "../utils";
import { MDUtilsV5, ProcMode } from "../utilsv5";
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
  note: NoteProps;
};

const createMissingNoteErrorMsg = (opts: { fname: string; vname?: string }) => {
  const out = [`No note with name ${opts.fname} found`];
  if (opts.vname) {
    out.push(`in vault ${opts.vname}`);
  }
  return out.join(" ");
};

const tryGetNotes = ({
  fname,
  vname,
  vaults,
  notes,
}: {
  fname: string;
  vname?: string;
  vaults: DVault[];
  notes: NotePropsDict;
}) => {
  const maybeVault = vname
    ? VaultUtils.getVaultByName({
        vaults,
        vname,
      })
    : undefined;
  const maybeNotes = NoteUtils.getNotesByFname({
    fname,
    notes,
    vault: maybeVault,
  });
  if (maybeNotes.length === 0) {
    return {
      error: ErrorFactory.createInvalidStateError({
        message: createMissingNoteErrorMsg({ fname, vname }),
      }),
    };
  }
  return { error: undefined, data: maybeNotes };
};

const plugin: Plugin = function (this: Unified.Processor, opts?: PluginOpts) {
  const procOptsV5 = MDUtilsV5.getProcOpts(this);

  attachParser(this);
  if (this.Compiler != null && !procOptsV5.parseOnly) {
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
      const link = LinkUtils.parseNoteRef(linkMatch);
      // If the link is same file [[#header]], it's implicitly to the same file it's located in
      if (link.from.fname === "")
        link.from.fname = MDUtilsV4.getDendronData(proc).fname;
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

  function inlineTokenizerV5(eat: Eat, value: string) {
    const procOpts = MDUtilsV5.getProcOpts(proc);
    const match = LINK_REGEX.exec(value);
    if (match) {
      const linkMatch = match[1].trim();
      if (procOpts?.mode === ProcMode.NO_DATA) {
        const link = LinkUtils.parseNoteRefRaw(linkMatch);
        const { value } = LinkUtils.parseLink(linkMatch);
        let refNote: NoteRefNoteRawV4 = {
          type: DendronASTTypes.REF_LINK_V2,
          data: {
            link,
          },
          value,
        };
        return eat(match[0])(refNote);
      } else {
        const link = LinkUtils.parseNoteRef(linkMatch);
        // If the link is same file [[#header]], it's implicitly to the same file it's located in
        if (link.from?.fname === "")
          link.from.fname = MDUtilsV4.getDendronData(proc).fname;
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
    }
    return;
  }
  inlineTokenizer.locator = locator;
  inlineTokenizerV5.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;

  if (MDUtilsV5.isV5Active(proc)) {
    inlineTokenizers.refLinkV2 = inlineTokenizerV5;
    inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLinkV2");
  } else {
    inlineTokenizers.refLinkV2 = inlineTokenizer;
    inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLinkV2");
  }
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
  /**
   * Takes a note ref and processes it
   * @param ref DNoteLoc (note reference) to process
   * @param note actual note at the reference
   * @param fname fname (either from the actual note ref, or inferred.)
   * @returns process note references
   */
  function processRef(ref: DNoteLoc, note: NoteProps, fname: string) {
    try {
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
        let useId = wikiLinkOpts?.useId;
        if (MDUtilsV5.isV5Active(proc) && dest === DendronASTDest.HTML) {
          useId = true;
        }
        let href = useId ? note.id : fname;
        const title = getTitle({ config, note, loc: ref });
        if (dest === DendronASTDest.HTML) {
          suffix = ".html";
          if (note.custom.permalink === "/") {
            href = "";
            suffix = "";
          }
        }
        if (dest === DendronASTDest.MD_ENHANCED_PREVIEW) {
          suffix = ".md";
          // NOTE: parsing doesn't work properly for first line, not sure why
          // this HACK fixes it
          data.children = [brk].concat(data.children);
        }
        let isPublished = true;
        if (dest === DendronASTDest.HTML) {
          // check if we need to check publishign rules
          if (
            MDUtilsV5.isV5Active(proc) &&
            !MDUtilsV5.shouldApplyPublishingRules(proc)
          ) {
            isPublished = true;
          } else {
            isPublished = SiteUtils.isPublished({
              note,
              config: config!,
              engine,
            });
          }
        }
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
      const msg = `Error rendering note reference for ${note?.fname}`;
      return MDUtilsV4.genMDErrorMsg(msg);
    }
  }

  const errors: DendronError[] = [];
  const { link, proc, compilerOpts, procOpts } = opts;
  const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
  const refLvl = MDUtilsV4.getNoteRefLvl(proc());

  // prevent infinite nesting.
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data: [MDUtilsV4.genMDErrorMsg("too many nested note refs")],
    };
  }

  // figure out configs that change how we process the note reference
  const dendronData = MDUtilsV4.getDendronData(proc);
  const { dest, config, vault: vaultFromProc } = dendronData;
  let { shouldApplyPublishRules } = dendronData;

  const { wikiLinkOpts } = compilerOpts;

  const siteConfig = DConfig.getProp(procOpts.config, "site");
  const sitePrettyRefConfig = siteConfig.usePrettyRefs;
  const prettyRefConfig = DConfig.getProp(procOpts.config, "usePrettyRefs");

  if (MDUtilsV5.isV5Active(proc)) {
    shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
  }

  let prettyRefs = shouldApplyPublishRules
    ? sitePrettyRefConfig
    : prettyRefConfig;
  if (
    prettyRefs &&
    _.includes([DendronASTDest.MD_DENDRON, DendronASTDest.MD_REGULAR], dest)
  ) {
    prettyRefs = false;
  }

  const duplicateNoteConfig = siteConfig.duplicateNoteBehavior;
  // process note references.
  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    // wildcard reference case
    const vault = dendronData.vault;
    const resp = engine.queryNotesSync({ qs: link.from.fname, vault });
    const out = _.filter(resp.data, (ent) =>
      DUtils.minimatch(ent.fname, link.from.fname)
    );
    noteRefs = _.sortBy(
      out.map((ent) => NoteUtils.toNoteLoc(ent)),
      "fname"
    );
    if (noteRefs.length === 0) {
      const msg = `Error rendering note reference. There are no matches for \`${link.from.fname}\`.`;
      return { error, data: [MDUtilsV4.genMDErrorMsg(msg)] };
    }

    const processedRefs = noteRefs.map((ref) => {
      const fname = ref.fname;
      const npath = DNodeUtils.getFullPath({
        wsRoot: engine.wsRoot,
        vault: vault as DVault,
        basename: fname + ".md",
      });
      let note: NoteProps;
      try {
        note = file2Note(npath, vault as DVault);
      } catch (err) {
        const msg = `error reading file, ${npath}`;
        return MDUtilsV4.genMDMsg(msg);
      }
      return processRef(ref, note, fname);
    });
    return { error, data: processedRefs };
  } else {
    // single reference case.
    let note: NoteProps;
    const { vaultName: vname } = link.data;
    const { fname } = link.from;
    const resp = tryGetNotes({
      fname,
      vname,
      vaults: engine.vaults,
      notes: engine.notes,
    });

    // check for edge cases
    if (resp.error) {
      return { error, data: [MDUtilsV4.genMDErrorMsg(resp.error.message)] };
    }

    // multiple results
    if (resp.data.length > 1) {
      // applying publish rules but no behavior defined for duplicate notes
      if (shouldApplyPublishRules && _.isUndefined(duplicateNoteConfig)) {
        return {
          error,
          data: [
            MDUtilsV4.genMDErrorMsg(
              `Error rendering note reference. There are multiple notes with the name ${link.from.fname}. Please specify the vault prefix.`
            ),
          ],
        };
      }

      // apply publish rules and do duplicate
      if (shouldApplyPublishRules && !_.isUndefined(duplicateNoteConfig)) {
        const maybeNote = SiteUtils.handleDup({
          allowStubs: false,
          dupBehavior: duplicateNoteConfig,
          engine,
          config,
          fname: link.from.fname,
          noteCandidates: resp.data,
          noteDict: engine.notes,
        });
        if (!maybeNote) {
          return {
            error,
            data: [
              MDUtilsV4.genMDErrorMsg(
                `Error rendering note reference for ${link.from.fname}`
              ),
            ],
          };
        }
        note = maybeNote;
      } else {
        // no need to apply publish rules, try to pick the one that is in same vault

        const _note = _.find(resp.data, (note) =>
          VaultUtils.isEqual(note.vault, vaultFromProc, engine.wsRoot)
        );
        if (_note) {
          note = _note;
        } else {
          note = resp.data[0];
        }
      }
    } else {
      note = resp.data[0];
    }

    noteRefs.push(link.from);
    const processedRefs = noteRefs.map((ref) => {
      const fname = note.fname;
      return processRef(ref, note, fname);
    });
    return { error, data: processedRefs };
  }
}

/** For any List in `nodes`, removes the children before or after the index of the following ListItem in `nodes`. */
function removeListItems({
  nodes,
  remove,
}: {
  nodes: ParentWithIndex[];
  remove: "before-index" | "after-index";
}): void {
  for (let i = 0; i < nodes.length; i++) {
    const list = nodes[i];
    const listItem = nodes[i + 1];
    if (list.ancestor.type !== DendronASTTypes.LIST) continue;
    if (_.isUndefined(listItem)) {
      console.error(
        "Found a list that has a list anchor in it, but no list items"
      );
      continue; // Should never happen, but let's try to render at least the whole list if it does
    }
    if (remove === "after-index") {
      list.ancestor.children = list.ancestor.children.slice(
        undefined,
        listItem.index + 1
      );
    } else {
      // keep === after-index
      list.ancestor.children = list.ancestor.children.slice(
        listItem.index,
        undefined
      );
    }
  }
}

/** For references like `#^item:#^item`, only include a single list item and not it's children. */
function removeExceptSingleItem(nodes: ParentWithIndex[]) {
  let closestListItem: Parent | undefined;
  // Find the list item closest to the anchor
  _.forEach(nodes, ({ ancestor }) => {
    if (ancestor.type === DendronASTTypes.LIST_ITEM) {
      closestListItem = ancestor;
    }
  });
  if (_.isUndefined(closestListItem)) return;
  // If this list item has any nested lists, remove them to get rid of the children
  closestListItem.children = closestListItem.children.filter(
    (node) => !(node.type === DendronASTTypes.LIST)
  );
}

/** If there are nested lists with a single item in them, replaces the outer single-item lists with the first multi-item list. */
function removeSingleItemNestedLists(nodes: ParentWithIndex[]): void {
  let outermost: ParentWithIndex | undefined;
  for (let i = 0; i < nodes.length; i++) {
    const list = nodes[i];
    if (list.ancestor.type !== DendronASTTypes.LIST) continue;
    // Find the outermost list
    if (_.isUndefined(outermost)) {
      outermost = list;
      // If the outermost list has multiple children, we have nothing to do
      if (outermost.ancestor.children.length > 1) return;
      continue;
    } else {
      // Found the nested list which will replace the outermost one
      outermost.ancestor.children = list.ancestor.children;
      // The nested list is the new outermost now
      outermost = list;
      // If we found a list with multiple children, stop because we want to keep it
      if (outermost.ancestor.children.length > 1) return;
    }
  }
}

function prepareNoteRefIndices<T>({
  anchorStart,
  anchorEnd,
  bodyAST,
  makeErrorData,
}: {
  anchorStart?: string;
  anchorEnd?: string;
  bodyAST: DendronASTNode;
  makeErrorData: (anchorName: string, anchorType: "Start" | "End") => T;
}): {
  start: FindAnchorResult;
  end: FindAnchorResult;
  data: T | null;
  error: any;
} {
  // TODO: can i just strip frontmatter when reading?
  let start: FindAnchorResult = {
    type: "header",
    index: bodyAST.children[0]?.type === "yaml" ? 1 : 0,
  };
  let end: FindAnchorResult = null;

  if (anchorStart) {
    start = findAnchor({
      nodes: bodyAST.children,
      match: anchorStart,
    });
    if (_.isNull(start)) {
      return {
        data: makeErrorData(anchorStart, "Start"),
        start: null,
        end: null,
        error: null,
      };
    }
  }

  if (anchorEnd) {
    const nodes = bodyAST.children.slice(start.index);
    end = findAnchor({
      nodes,
      match: anchorEnd,
    });
    if (anchorEnd === "*" && _.isNull(end)) {
      end = {
        type: "header",
        index: nodes.length,
        anchorType: "header",
      };
    }
    if (_.isNull(end)) {
      return {
        data: makeErrorData(anchorEnd, "End"),
        start: null,
        end: null,
        error: null,
      };
    }
    end.index += start.index;
  } else if (start.type === "block") {
    // If no end is specified and the start is a block anchor referencing a block, the end is implicitly the end of the referenced block.
    end = { type: "block", index: start.index };
  } else if (start.type === "list") {
    // If no end is specified and the start is a block anchor in a list, the end is the list element referenced by the start.
    end = { ...start };
  }

  // Handle anchors inside lists. Lists need to slice out sibling list items, and extract out nested lists.
  // We need to remove elements before the start or after the end.
  // We do end first and start second in case they refer to the same list, so that the indices don't shift.
  if (end && end.type === "list") {
    removeListItems({ nodes: end.ancestors, remove: "after-index" });
  }
  if (start && start.type === "list") {
    removeListItems({ nodes: start.ancestors, remove: "before-index" });
  }
  // For anchors inside lists, if the start and end is the same then the reference is only referring to a single item
  if (
    end &&
    start &&
    end.type === "list" &&
    start.type === "list" &&
    anchorStart === anchorEnd
  ) {
    removeExceptSingleItem(start.ancestors);
  }
  // If removing items left single-item nested lists at the start of the ancestors, we trim these out.
  if (end && end.type === "list") {
    removeSingleItemNestedLists(end.ancestors);
  }
  if (end && end.type === "header" && end.anchorType === "header") {
    // TODO: check if this does right thing with header
    end.index -= 1;
  }
  if (start && start.type === "list") {
    removeSingleItemNestedLists(start.ancestors);
  }

  return { start, end, data: null, error: null };
}

function convertNoteRefHelperAST(
  opts: ConvertNoteRefHelperOpts & { procOpts: any }
): Required<RespV2<Parent>> {
  const { proc, refLvl, link, note } = opts;
  const noteRefProc = proc();
  // proc is the parser that was parsing the note the reference was in, so need to update fname to reflect that we are parsing the referred note
  MDUtilsV4.setDendronData(noteRefProc, { fname: link.from.fname });
  const engine = MDUtilsV4.getEngineFromProc(noteRefProc);
  MDUtilsV4.setNoteRefLvl(noteRefProc, refLvl);
  const procOpts = MDUtilsV4.getProcOpts(noteRefProc);

  const isV5Active = MDUtilsV5.isV5Active(proc);

  let bodyAST: DendronASTNode;
  if (MDUtilsV4.getProcOpts(proc).config?.useNunjucks) {
    const contentsClean = renderFromNoteProps({
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

  const { start, end, data, error } = prepareNoteRefIndices({
    anchorStart,
    anchorEnd,
    bodyAST,
    makeErrorData: (anchorName, anchorType) => {
      return MDUtilsV4.genMDMsg(`${anchorType} anchor ${anchorName} not found`);
    },
  });
  if (data) return { data, error };

  // slice of interested range
  try {
    let out = root(
      bodyAST.children.slice(
        (start ? start.index : 0) + anchorStartOffset,
        end ? end.index + 1 : undefined
      )
    );
    // Copy the current proc to preserve all options
    let tmpProc = MDUtilsV4.procFull(procOpts);
    // but change the fname and vault to the referenced note, since we're inside that note now
    tmpProc = MDUtilsV4.setDendronData(tmpProc, {
      insideNoteRef: true,
      fname: note.fname,
      vault: note.vault,
    });
    if (isV5Active) {
      if (procOpts.dest === DendronASTDest.HTML) {
        tmpProc = MDUtilsV5.procRemarkFull({
          ...MDUtilsV5.getProcData(proc),
          insideNoteRef: true,
          fname: note.fname,
          vault: note.vault,
        });
      }
    }

    const { dest } = MDUtilsV4.getDendronData(tmpProc);
    if (dest === DendronASTDest.HTML) {
      const out3 = tmpProc.runSync(out) as Parent;
      return { error: null, data: out3 };
    } else {
      const out2 = tmpProc.stringify(out);
      out = tmpProc.parse(out2) as Parent;
      return { error: null, data: out };
    }
  } catch (err) {
    console.log(
      JSON.stringify({
        ctx: "convertNoteRefHelperAST",
        msg: "Failed to render note reference",
        err,
      })
    );
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
  // proc is the parser that was parsing the note the reference was in, so need to update fname to reflect that we are parsing the referred note
  MDUtilsV4.setDendronData(noteRefProc, { fname: link.from.fname });
  MDUtilsV4.setNoteRefLvl(noteRefProc, refLvl);
  const bodyAST = noteRefProc.parse(body) as DendronASTNode;
  const { anchorStart, anchorEnd, anchorStartOffset } = link.data;

  let { start, end, data, error } = prepareNoteRefIndices({
    anchorStart,
    anchorEnd,
    bodyAST,
    makeErrorData: (anchorName, anchorType) => {
      return `${anchorType} anchor ${anchorName} not found`;
    },
  });
  if (data) return { data, error };

  // slice of interested range
  try {
    bodyAST.children = bodyAST.children.slice(start?.index, end?.index);
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

type FindAnchorResult =
  | {
      type: "header" | "block";
      index: number;
      anchorType?: "block" | "header";
    }
  | {
      type: "list";
      index: number;
      ancestors: ParentWithIndex[];
      anchorType?: "block";
    }
  | null;

/** Searches for anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found, or -1 if not found.
 */
function findAnchor({
  nodes,
  match,
}: {
  nodes: DendronASTNode["children"];
  match: string;
}): FindAnchorResult {
  if (isBlockAnchor(match)) {
    const anchorId = match.slice(1);
    return findBlockAnchor({ nodes, match: anchorId });
  } else {
    return findHeader({ nodes, match, slugger: getSlugger() });
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
}): FindAnchorResult {
  let foundIndex = MDUtilsV4.findIndex(nodes, (node: Node, idx: number) => {
    if (idx === 0 && match === "*") {
      return false;
    }
    return MDUtilsV4.matchHeading(node, match, { slugger });
  });
  if (foundIndex < 0) return null;
  return { type: "header", index: foundIndex, anchorType: "header" };
}

/** Searches for block anchors, then returns the index for the top-level ancestor.
 *
 * @param nodes The list of nodes to search through.
 * @param match The block anchor string, like "header-anchor" or "^block-anchor"
 * @returns The index of the top-level ancestor node in the list where the anchor was found, or -1 if not found.
 */
function findBlockAnchor({
  nodes,
  match,
}: {
  nodes: Node[];
  match: string;
}): FindAnchorResult {
  // Find the anchor in the nodes
  let foundIndex: number | undefined;
  let foundAncestors: ParentWithIndex[] = [];
  MDUtilsV4.visitParentsIndices({
    nodes,
    test: DendronASTTypes.BLOCK_ANCHOR,
    visitor: ({ node, index, ancestors }) => {
      if (node.id === match) {
        // found anchor!
        foundIndex = ancestors.length > 0 ? ancestors[0].index : index;
        foundAncestors = ancestors;
        return false; // stop traversal
      }
      return true; // continue traversal
    },
  });

  if (_.isUndefined(foundIndex)) return null;
  if (!_.isEmpty(foundAncestors)) {
    if (
      foundAncestors[0].ancestor.children.length === 1 &&
      foundAncestors[0].ancestor.children[0].type ===
        DendronASTTypes.BLOCK_ANCHOR
    ) {
      // If located by itself after a block, then the block anchor refers to the previous block
      return { type: "block", index: foundIndex - 1 };
    }
    if (foundAncestors[0].ancestor.type === DendronASTTypes.LIST) {
      // The block anchor is in a list, which will need special handling to slice the list elements
      return {
        type: "list",
        index: foundIndex,
        ancestors: foundAncestors,
        anchorType: "block",
      };
    }
  }
  // Otherwise, it's an anchor inside some regular block. The anchor refers to the block it's inside of.
  return { type: "block", index: foundIndex, anchorType: "block" };
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
