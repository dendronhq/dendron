import {
  CONSTANTS,
  IntermediateDendronConfig,
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
  NoteUtils,
  RespV2,
  VaultUtils,
  ConfigUtils,
  DEngineClient,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import { RemarkUtils } from "../remark";
import _ from "lodash";
import { brk, html, paragraph, root } from "mdast-builder";
import { Eat } from "remark-parse";
import Unified, { Plugin, Processor } from "unified";
import { Node, Parent } from "unist";
import { SiteUtils } from "../../topics/site";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  NoteRefNoteRawV4,
  NoteRefNoteV4,
} from "../types";
import { ParentWithIndex } from "../utils";
import { MDUtilsV5, ProcMode } from "../utilsv5";
import { LinkUtils } from "./utils";
import { WikiLinksOpts } from "./wikiLinks";
import { MdastUtils, MDUtilsV4 } from "..";

const LINK_REGEX = /^!\[\[(.+?)\]\]/;

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
  engine,
}: {
  fname: string;
  vname?: string;
  vaults: DVault[];
  engine: DEngineClient;
}) => {
  const maybeVault = vname
    ? VaultUtils.getVaultByName({
        vaults,
        vname,
      })
    : undefined;
  const maybeNotes = NoteUtils.getNotesByFnameFromEngine({
    fname,
    engine,
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
        link.from.fname = MDUtilsV5.getProcData(proc).fname;
      const { value } = LinkUtils.parseLink(linkMatch);

      const refNote: NoteRefNoteV4 = {
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
        const refNote: NoteRefNoteRawV4 = {
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
          link.from.fname = MDUtilsV5.getProcData(proc).fname;
        const { value } = LinkUtils.parseLink(linkMatch);
        const refNote: NoteRefNoteV4 = {
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
  const { dest } = MDUtilsV5.getProcData(proc);

  if (visitors) {
    visitors.refLinkV2 = function refLinkV2(node: NoteRefNoteV4) {
      const ndata = node.data;
      if (dest === DendronASTDest.MD_DENDRON) {
        const { fname, alias } = ndata.link.from;

        const { anchorStart, anchorStartOffset, anchorEnd } = ndata.link.data;
        const link = alias ? `${alias}|${fname}` : fname;
        let suffix = "";

        const vaultPrefix = ndata.link.data.vaultName
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
  const errors: DendronError[] = [];
  const { link, proc, compilerOpts } = opts;
  const procData = MDUtilsV5.getProcData(proc);
  const { noteRefLvl: refLvl, dest, config, fname } = procData;
  // Needed for backwards compatibility until all MDUtilsV4 proc usages are removed
  const engine = procData.engine || MDUtilsV4.getEngineFromProc(proc).engine;
  let { vault } = procData;
  const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);

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
  const { wikiLinkOpts } = compilerOpts;
  let { prettyRefs } = compilerOpts;
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data,
    };
  }

  // The note that contains this reference might override the pretty refs option for references inside it.
  const containingNote = NoteUtils.getNoteByFnameFromEngine({
    fname,
    vault,
    engine,
  });
  if (prettyRefs === undefined) {
    prettyRefs = ConfigUtils.getEnablePrettyRefs(config, {
      note: containingNote,
      shouldApplyPublishRules,
    });
  }
  if (
    containingNote?.custom.usePrettyRefs !== undefined &&
    _.isBoolean(containingNote.custom.usePrettyRefs)
  ) {
    prettyRefs = containingNote.custom.usePrettyRefs;
  }

  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    const resp = engine.queryNotesSync({
      qs: link.from.fname,
      originalQS: link.from.fname,
      vault,
    });
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
        proc,
        compilerOpts,
      });
      if (error) {
        errors.push(error);
      }
      if (prettyRefs) {
        let suffix = "";
        let href = wikiLinkOpts?.useId ? note.id : fname;
        if (dest === DendronASTDest.HTML) {
          const maybeNote = NoteUtils.getNoteByFnameFromEngine({
            fname,
            engine,
            vault,
          });
          if (!MDUtilsV5.isV5Active(proc)) {
            suffix = ".html";
          }
          if (maybeNote?.custom.permalink === "/") {
            href = "";
            suffix = "";
          }
        }
        if (dest === DendronASTDest.MD_ENHANCED_PREVIEW) {
          suffix = ".md";
        }
        const link = `"${wikiLinkOpts?.prefix || ""}${href}${suffix}"`;
        const title = getTitle({
          config,
          note,
          loc: ref,
          shouldApplyPublishRules,
        });
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
  return { error: undefined, data: out.join("\n") };
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
        if (
          useId === undefined &&
          MDUtilsV5.isV5Active(proc) &&
          dest === DendronASTDest.HTML
        ) {
          useId = true;
        }
        let href = useId ? note.id : fname;
        const title = getTitle({
          config,
          note,
          loc: ref,
          shouldApplyPublishRules,
        });
        if (dest === DendronASTDest.HTML) {
          if (!MDUtilsV5.isV5Active(proc)) {
            suffix = ".html";
          }
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
      return MdastUtils.genMDErrorMsg(msg);
    }
  }

  const errors: DendronError[] = [];
  const { link, proc, compilerOpts, procOpts } = opts;
  const procData = MDUtilsV5.getProcData(proc);
  const { noteRefLvl: refLvl } = procData;
  // Needed for backwards compatibility until all MDUtilsV4 proc usages are removed
  const engine = procData.engine || MDUtilsV4.getEngineFromProc(proc).engine;

  // prevent infinite nesting.
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data: [MdastUtils.genMDErrorMsg("too many nested note refs")],
    };
  }

  // figure out configs that change how we process the note reference
  const { dest, config, vault: vaultFromProc, fname, vault } = procData;
  // Needed for backwards compatibility until all MDUtilsV4 proc usages are removed
  const shouldApplyPublishRules =
    MDUtilsV5.shouldApplyPublishingRules(proc) ||
    MDUtilsV4.getDendronData(proc).shouldApplyPublishRules;

  const { wikiLinkOpts } = compilerOpts;

  // The note that contains this reference might override the pretty refs option for references inside it.
  const containingNote = NoteUtils.getNoteByFnameFromEngine({
    fname,
    vault,
    engine,
  });
  let prettyRefs = ConfigUtils.getEnablePrettyRefs(config, {
    shouldApplyPublishRules,
    note: containingNote,
  });
  if (
    prettyRefs &&
    _.includes([DendronASTDest.MD_DENDRON, DendronASTDest.MD_REGULAR], dest)
  ) {
    prettyRefs = false;
  }

  const publishingConfig = ConfigUtils.getPublishingConfig(config);
  const duplicateNoteConfig = publishingConfig.duplicateNoteBehavior;
  // process note references.
  let noteRefs: DNoteLoc[] = [];
  if (link.from.fname.endsWith("*")) {
    // wildcard reference case
    const vault = procData.vault;
    const resp = engine.queryNotesSync({
      qs: link.from.fname,
      originalQS: link.from.fname,
      vault,
    });
    const out = _.filter(resp.data, (ent) =>
      DUtils.minimatch(ent.fname, link.from.fname)
    );
    noteRefs = _.sortBy(
      out.map((ent) => NoteUtils.toNoteLoc(ent)),
      "fname"
    );
    if (noteRefs.length === 0) {
      const msg = `Error rendering note reference. There are no matches for \`${link.from.fname}\`.`;
      return { error: undefined, data: [MdastUtils.genMDErrorMsg(msg)] };
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
        return MdastUtils.genMDMsg(msg);
      }
      return processRef(ref, note, fname);
    });
    return { error: undefined, data: processedRefs };
  } else {
    // single reference case.
    let note: NoteProps;
    const { vaultName: vname } = link.data;
    const { fname } = link.from;
    const resp = tryGetNotes({
      fname,
      vname,
      vaults: engine.vaults,
      engine,
    });

    // check for edge cases
    if (resp.error) {
      return {
        error: undefined,
        data: [MdastUtils.genMDErrorMsg(resp.error.message)],
      };
    }

    // multiple results
    if (resp.data.length > 1) {
      // applying publish rules but no behavior defined for duplicate notes
      if (shouldApplyPublishRules && _.isUndefined(duplicateNoteConfig)) {
        return {
          error: undefined,
          data: [
            MdastUtils.genMDErrorMsg(
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
            error: undefined,
            data: [
              MdastUtils.genMDErrorMsg(
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
    return { error: undefined, data: processedRefs };
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
  // eslint-disable-next-line no-plusplus
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
  // eslint-disable-next-line no-plusplus
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
  const { dest } = MDUtilsV5.getProcData(proc);
  let noteRefProc: Processor;
  // Workaround until all usages of MDUtilsV4 are removed
  const engine =
    MDUtilsV5.getProcData(proc).engine ||
    MDUtilsV4.getEngineFromProc(proc).engine;
  if (dest === DendronASTDest.HTML) {
    // For HTML, we need to make sure that we don't use a processor with HTML
    // target. Otherwise as we process recursive references, the HTML output
    // from deeper levels is broken (everything gets converted into `<div>`s for
    // some reason)
    noteRefProc = MDUtilsV5.procRemarkFull(
      {
        ...MDUtilsV5.getProcData(proc),
        insideNoteRef: true,
        fname: note.fname,
        vault: note.vault,
        engine,
      },
      MDUtilsV5.getProcOpts(proc)
    );
  } else {
    // Otherwise, just clone the existing proc instead of creating a new one.
    // This will largely preserve existing opts, we just need to change a few.
    noteRefProc = proc();
    // proc is the parser that was parsing the note the reference was in, so need to update fname to reflect that we are parsing the referred note
    MDUtilsV5.setProcData(noteRefProc, {
      fname: note.fname,
      insideNoteRef: true,
      vault: note.vault,
    });
  }
  const wsRoot = engine.wsRoot;
  noteRefProc = noteRefProc.data("fm", MDUtilsV5.getFM({ note, wsRoot }));
  MDUtilsV5.setNoteRefLvl(noteRefProc, refLvl);

  const bodyAST: DendronASTNode = noteRefProc.parse(
    note.body
  ) as DendronASTNode;
  // Make sure to get all footnote definitions, including ones not within the range, in case they are used inside the range
  const footnotes = RemarkUtils.extractFootnoteDefs(bodyAST);
  const { anchorStart, anchorEnd, anchorStartOffset } = _.defaults(link.data, {
    anchorStartOffset: 0,
  });

  const { start, end, data, error } = prepareNoteRefIndices({
    anchorStart,
    anchorEnd,
    bodyAST,
    makeErrorData: (anchorName, anchorType) => {
      return MdastUtils.genMDMsg(
        `${anchorType} anchor ${anchorName} not found`
      );
    },
  });
  if (data) return { data, error };

  // slice of interested range
  try {
    const out = root(
      bodyAST.children.slice(
        (start ? start.index : 0) + anchorStartOffset,
        end ? end.index + 1 : undefined
      )
    );
    // Add all footnote definitions back. We might be adding duplicates if the definition was already in range, but rendering handles this correctly.
    // We also might be adding definitions that weren't used in this range, but rendering will simply ignore those.
    out.children.push(...footnotes);

    const data = noteRefProc.runSync(out) as Parent;
    return {
      error: null,
      data,
    };
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
      data: MdastUtils.genMDMsg("error processing ref"),
    };
  }
}

function convertNoteRefHelper(
  opts: ConvertNoteRefHelperOpts
): Required<RespV2<string>> {
  const { body, proc, refLvl, link } = opts;
  const noteRefProc = proc();
  // proc is the parser that was parsing the note the reference was in, so need to update fname to reflect that we are parsing the referred note
  MDUtilsV5.setProcData(noteRefProc, { fname: link.from.fname });
  MDUtilsV5.setNoteRefLvl(noteRefProc, refLvl);
  const bodyAST = noteRefProc.parse(body) as DendronASTNode;
  const { anchorStart, anchorEnd, anchorStartOffset } = link.data;

  // Make sure to get all footnote definitions, including ones not within the range, in case they are used inside the range
  const footnotes = RemarkUtils.extractFootnoteDefs(bodyAST);
  const { start, end, data, error } = prepareNoteRefIndices({
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
    // Add all footnote definitions back. We might be adding duplicates if the definition was already in range, but rendering handles this correctly.
    // We also might be adding definitions that weren't used in this range, but rendering will simply ignore those.
    bodyAST.children.push(...footnotes);
    const procTree = noteRefProc.runSync(bodyAST);
    let out = noteRefProc.stringify(procTree);
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
  const foundIndex = MdastUtils.findIndex(nodes, (node: Node, idx: number) => {
    if (idx === 0 && match === "*") {
      return false;
    }
    return MdastUtils.matchHeading(node, match, { slugger });
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
  MdastUtils.visitParentsIndices({
    nodes,
    test: DendronASTTypes.BLOCK_ANCHOR,
    visitor: ({ node, index, ancestors }) => {
      // @ts-ignore
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
  config: IntermediateDendronConfig;
  note: NoteProps;
  loc: DNoteLoc;
  shouldApplyPublishRules?: boolean;
}) {
  const { config, note, loc, shouldApplyPublishRules } = opts;
  const { alias, fname } = loc;
  const enableNoteTitleForLink = ConfigUtils.getEnableNoteTitleForLink(
    config,
    shouldApplyPublishRules
  );

  return enableNoteTitleForLink ? note.title : alias || fname || "no title";
}

function renderPrettyAST(opts: {
  content: Parent;
  title: string;
  link?: string;
}) {
  const { content, title, link } = opts;
  const linkLine = _.isUndefined(link)
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
