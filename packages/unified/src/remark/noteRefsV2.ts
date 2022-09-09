/* eslint-disable no-console */
/* eslint-disable func-names */
import {
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DEngineClient,
  DNodeUtils,
  DNoteLoc,
  DNoteRefLink,
  DUtils,
  DVault,
  ErrorFactory,
  getSlugger,
  IDendronError,
  IntermediateDendronConfig,
  isBlockAnchor,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Heading } from "mdast";
import { html, paragraph, root } from "mdast-builder";
import { Eat } from "remark-parse";
import Unified, { Plugin, Processor } from "unified";
import { Node, Parent } from "unist";
import { MdastUtils } from "..";
import { RemarkUtils } from "../remark";
import { SiteUtils } from "../SiteUtils";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  NoteRefNoteRawV4,
  NoteRefNoteV4,
} from "../types";
import { ParentWithIndex } from "../utils";
import { getRefId, MDUtilsV5, ProcMode } from "../utilsv5";
import { LinkUtils } from "./utils";
import { WikiLinksOpts } from "./wikiLinks";

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

function gatherNoteRefs({
  link,
  engine,
  vault,
}: {
  link: DNoteRefLink;
  engine: DEngineClient;
  vault: DVault;
}) {
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
  return noteRefs;
}

export function isBeginBlockAnchorId(anchorId: string) {
  return anchorId === "begin";
}

export function isEndBlockAnchorId(anchorId: string) {
  return anchorId === "end";
}

function shouldRenderPretty({ proc }: { proc: Processor }): boolean {
  const procData = MDUtilsV5.getProcData(proc);
  const { config, fname, engine, vault, dest } = procData;

  // pretty refs not valid for regular markdown
  if (
    _.includes([DendronASTDest.MD_DENDRON, DendronASTDest.MD_REGULAR], dest)
  ) {
    return false;
  }

  // The note that contains this reference might override the pretty refs option for references inside it.
  const containingNote = NoteUtils.getNoteByFnameFromEngine({
    fname,
    vault,
    engine,
  });
  const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);

  let prettyRefs =
    ConfigUtils.getEnablePrettyRefs(config, {
      note: containingNote,
      shouldApplyPublishRules,
    }) ?? true;
  if (
    containingNote?.custom?.usePrettyRefs !== undefined &&
    _.isBoolean(containingNote.custom?.usePrettyRefs)
  ) {
    prettyRefs = containingNote.custom.usePrettyRefs;
  }
  return prettyRefs;
}

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
        if (link.from?.fname === "") {
          link.from.fname = MDUtilsV5.getProcData(proc).fname;
        }
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
  inlineTokenizerV5.locator = locator;

  const Parser = proc.Parser;
  const inlineTokenizers = Parser.prototype.inlineTokenizers;
  const inlineMethods = Parser.prototype.inlineMethods;

  inlineTokenizers.refLinkV2 = inlineTokenizerV5;
  inlineMethods.splice(inlineMethods.indexOf("link"), 0, "refLinkV2");
  return Parser;
}

function attachCompiler(proc: Unified.Processor, _opts?: CompilerOpts) {
  const Compiler = proc.Compiler;
  const visitors = Compiler.prototype.visitors;
  const { dest } = MDUtilsV5.getProcData(proc);

  if (visitors) {
    visitors.refLinkV2 = (node: NoteRefNoteV4) => {
      const ndata = node.data;

      // converting to itself (used for doctor commands. preserve existing format)
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
      return;
    };
  }
}

const MAX_REF_LVL = 3;

// ^m0vy37pdpzgy
/**
 * This exists because {@link dendronPub} converts note refs using the AST
 */
export function convertNoteRefASTV2(
  opts: ConvertNoteRefOpts & { procOpts: any }
): { error: DendronError | undefined; data: Parent[] | undefined } {
  const errors: IDendronError[] = [];
  const { link, proc, compilerOpts, procOpts } = opts;
  const procData = MDUtilsV5.getProcData(proc);
  const { noteRefLvl: refLvl } = procData;
  const engine = procData.engine;
  /**
   * Takes a note ref and processes it
   * @param ref DNoteLoc (note reference) to process
   * @param note actual note at the reference
   * @param fname fname (either from the actual note ref, or inferred.)
   * @returns process note references
   */
  function processRef(
    ref: DNoteLoc,
    note: NoteProps,
    fname: string
  ): Parent<Node<any>, any> {
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

        let isPublished = true;
        if (dest === DendronASTDest.HTML) {
          if (!MDUtilsV5.isV5Active(proc)) {
            suffix = ".html";
          }
          if (note.custom.permalink === "/") {
            href = "";
            suffix = "";
          }
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
        const linkString = isPublished
          ? `"${wikiLinkOpts?.prefix || ""}${href}${suffix}"`
          : undefined;

        // publishing
        if (MDUtilsV5.getProcOpts(proc).flavor === ProcFlavor.PUBLISHING) {
          if (!_.isUndefined(linkString)) {
            return genRefAsIFrame({
              proc,
              link,
              noteId: note.id,
              content: data,
              title,
            });
          } else {
            // todo
            return paragraph();
          }
        }

        return renderPrettyAST({
          content: data,
          title,
          link: linkString,
        });
      } else {
        return paragraph(data);
      }
    } catch (err) {
      const msg = `Error rendering note reference for ${note?.fname}`;
      return MdastUtils.genMDErrorMsg(msg);
    }
  }

  // prevent infinite nesting.
  if (refLvl >= MAX_REF_LVL) {
    return {
      error: new DendronError({ message: "too many nested note refs" }),
      data: [MdastUtils.genMDErrorMsg("too many nested note refs")],
    };
  }

  // figure out configs that change how we process the note reference
  const { dest, config, vault: vaultFromProc } = procData;
  const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
  const { wikiLinkOpts } = compilerOpts;

  const prettyRefs = shouldRenderPretty({ proc });

  const publishingConfig = ConfigUtils.getPublishingConfig(config);
  const duplicateNoteConfig = publishingConfig.duplicateNoteBehavior;
  // process note references.
  // let noteRefs: DNoteLoc[] = [];
  const vault = procData.vault;
  const noteRefs: DNoteLoc[] = gatherNoteRefs({ link, engine, vault });
  if (link.from.fname.endsWith("*")) {
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
        // TODO: Get rid of these legacy engine.noteFnames, engine.notes references
        const noteIds = engine.noteFnames[fname];

        const noteCandidates = noteIds
          .map((id) => engine.notes[id])
          .filter((props) => VaultUtils.isEqualV2(props.vault, vault));

        if (noteCandidates.length !== 1) {
          throw new DendronError({
            message: `Unable to find note with fname ${fname} and vault ${vault.fsPath} for note reference`,
          });
        }
        note = noteCandidates[0];
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

    if (resp.data.length === 1) {
      note = resp.data[0];
    } else if (resp.data.length > 1) {
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
      throw new Error("Expected 1 or more notes");
    }

    // why iterate?  won't there be only one note?
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
  makeErrorData: (msg: string) => T;
}): {
  start: FindAnchorResult;
  end: FindAnchorResult;
  data: T | null;
  error: any;
} {
  const genErrorMsg = (anchorName: string, anchorType: "Start" | "End") => {
    return `${anchorType} anchor ${anchorName} not found`;
  };

  // TODO: can i just strip frontmatter when reading?
  let start: FindAnchorResult = {
    type: "none",
    index: bodyAST.children[0]?.type === "yaml" ? 1 : 0,
  };
  let end: FindAnchorResult = null;

  if (anchorStart) {
    start = findAnchor({
      nodes: bodyAST.children,
      match: anchorStart,
    });
    if (start?.type === "block-end") {
      return {
        data: makeErrorData(
          "the '^end' anchor cannot be used as the starting anchor"
        ),
        start: null,
        end: null,
        error: null,
      };
    }
    if (_.isNull(start)) {
      return {
        data: makeErrorData(genErrorMsg(anchorStart, "Start")),
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
        data: makeErrorData(genErrorMsg(anchorEnd, "End")),
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

  if (
    !anchorEnd &&
    // smart header ref
    (start.type === "header" ||
      // smart block
      start.type === "block-begin") &&
    start.node
  ) {
    // if block-begin, accept header of any depth
    const startHeaderDepth: number =
      start.type === "header" ? start.node.depth : 99;
    // anchor end is next header that is smaller or equal
    const nodes = RemarkUtils.extractHeaderBlock(
      bodyAST,
      startHeaderDepth,
      start.index,
      // stop at first header
      start.type === "block-begin"
    );
    // TODO: diff behavior if we fail at extracting header block
    end = { index: start.index + nodes.length - 1, type: "header" };
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
  let noteRefProc: Processor;
  const { engine } = MDUtilsV5.getProcData(proc);

  // Create a new proc to parse the reference; set the fname accordingly.
  // NOTE: a new proc is created here instead of using the proc() copy
  // constructor, as that is an expensive op since it deep clones the entire
  // engine state in proc.data
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

  noteRefProc = noteRefProc.data("fm", MDUtilsV5.getFM({ note }));
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
    makeErrorData: (msg) => {
      return MdastUtils.genMDMsg(msg);
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
    return {
      error: new DendronError({
        message: "error processing note ref",
        payload: err,
      }),
      data: MdastUtils.genMDMsg("error processing ref"),
    };
  }
}

type FindAnchorResult =
  | {
      type: "block";
      index: number;
      anchorType?: "block";
      node?: Node;
    }
  | {
      type: "header";
      index: number;
      anchorType?: "header";
      node?: Heading;
    }
  | {
      type: "block-begin";
      index: number;
      node: Node;
    }
  | {
      type: "block-end";
      index: number;
      node: Node;
    }
  | {
      type: "list";
      index: number;
      ancestors: ParentWithIndex[];
      anchorType?: "block";
    }
  | {
      type: "none";
      index: number;
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
    if (isBeginBlockAnchorId(anchorId)) {
      return findBeginBlockAnchor({ nodes });
    }
    if (isEndBlockAnchorId(anchorId)) {
      return findEndBlockAnchor({ nodes });
    }
    return findBlockAnchor({ nodes, match: anchorId });
  } else {
    return MdastUtils.findHeader({ nodes, match, slugger: getSlugger() });
  }
}

/**
 * Search for start of document and traverse until first header
 */
function findBeginBlockAnchor({ nodes }: { nodes: Node[] }): FindAnchorResult {
  // TODO: error if no first node found
  const firstNode = nodes[0];
  return {
    type: "block-begin",
    index: 0,
    node: firstNode,
  };
}

/**
 * Search for end of document;
 */
function findEndBlockAnchor({ nodes }: { nodes: Node[] }): FindAnchorResult {
  // TODO: error if no first node found
  const lastNode = _.last(nodes);
  if (!lastNode) {
    // TODO: should not happen
    throw Error("no nodes found for end-anchor");
  }
  return {
    type: "block-end",
    index: nodes.length,
    node: lastNode,
  };
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

const genRefAsIFrame = ({
  proc,
  link,
  noteId,
  content,
  title,
}: {
  proc: Unified.Processor;
  link: DNoteRefLink;
  noteId: string;
  content: Parent;
  title: string;
}) => {
  const refId = getRefId({ id: noteId, link });
  MDUtilsV5.serializeRefId(proc, { refId: { id: noteId, link }, content });

  // maybe don't wrap in paragraph
  return paragraph(
    html(
      `<iframe src="/refs/${refId}" title="Reference to the note called ${title}">Your browser does not support iframes.</iframe>`
    )
  );
};

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
