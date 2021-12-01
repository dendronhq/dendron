import {
  ConfigUtils,
  DendronError,
  DEngine,
  Diagnostic,
  GetDecorationsOpts,
  IDendronError,
  NonOptional,
  NoteProps,
  offsetRange,
} from "@dendronhq/common-all";
import { decorateUserTag } from "./userTags";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  UserTag,
  BlockAnchor,
  HashTag,
  NoteRefNoteV4,
  WikiLinkNoteV4,
} from "../types";
import { decorateHashTag } from "./hashTags";
import { decorateReference } from "./references";
import { Decoration, DecoratorIn, DecoratorOut } from "./utils";
import { decorateWikilink } from "./wikilinks";
import { decorateFrontmatter } from "./frontmatter";
import { decorateBlockAnchor } from "./blockAnchors";
import { MDUtilsV5, ProcMode } from "../utilsv5";
import { FrontmatterContent } from "mdast";
import visit from "unist-util-visit";
import {
  checkAndWarnBadFrontmatter,
  warnMissingFrontmatter,
} from "./diagnostics";
import _ from "lodash";

/** Dispatches the correct decorator based on the type of AST node. */
function runDecorator(opts: DecoratorIn): DecoratorOut | undefined {
  const { node } = opts;
  switch (node.type) {
    case DendronASTTypes.BLOCK_ANCHOR:
      return decorateBlockAnchor(opts as DecoratorIn<BlockAnchor>);
    case DendronASTTypes.HASHTAG:
      return decorateHashTag(opts as DecoratorIn<HashTag>);
    case DendronASTTypes.FRONTMATTER:
      return decorateFrontmatter(opts as DecoratorIn<FrontmatterContent>);
    case DendronASTTypes.USERTAG:
      return decorateUserTag(opts as DecoratorIn<UserTag>);
    case DendronASTTypes.WIKI_LINK:
      return decorateWikilink(opts as DecoratorIn<WikiLinkNoteV4>);
    case DendronASTTypes.REF_LINK_V2: // fall-through deliberate
    case DendronASTTypes.REF_LINK:
      return decorateReference(opts as DecoratorIn<NoteRefNoteV4>);
    default:
      return undefined;
  }
}

/** Get all decorations within the visible ranges for given note. */
export function getDecorations(
  opts: Omit<GetDecorationsOpts, "id"> & { note: NoteProps; engine: DEngine }
) {
  const { note, ranges, engine } = opts;

  const allDecorations: Decoration[] = [];
  const allDiagnostics: Diagnostic[] = [];
  const allErrors: IDendronError[] = [];

  for (const { range, text } of ranges) {
    if (text.length > ConfigUtils.getWorkspace(engine.config).maxNoteLength) {
      return {
        errors: [
          new DendronError({
            message: `Stopping decorations because visible range is too large. Unless you have a massive screen or really long lines of text, this may be a bug.`,
            payload: {
              maxNoteLength: ConfigUtils.getWorkspace(engine.config)
                .maxNoteLength,
              textLength: text.length,
            },
          }),
        ],
      };
    }
    const proc = MDUtilsV5.procRemarkParse(
      {
        mode: ProcMode.FULL,
        parseOnly: true,
      },
      {
        dest: DendronASTDest.MD_DENDRON,
        engine,
        vault: note.vault,
        fname: note.fname,
      }
    );
    const tree = proc.parse(text);
    let frontmatter: FrontmatterContent | undefined;

    visit(tree, (nodeIn) => {
      // This was parsed, it must have a position
      const node = nodeIn as NonOptional<DendronASTNode, "position">;

      // Need to update node position with the added offset from the range
      const decoratorOut = runDecorator({
        ...opts,
        node,
        note,
        noteText: text,
      });
      if (decoratorOut) {
        const { decorations, errors } = decoratorOut;
        allDecorations.push(
          ...decorations.map((decoration) => {
            // Add the offset from the start of the range so these decorations match up in the original document
            decoration.range = offsetRange(decoration.range, {
              line: range.start.line,
            });
            return decoration;
          })
        );
        if (errors) allErrors.push(...errors);
      }
      // Capture frontmatter if we come across it so we can check it for warnings
      if (node.type === DendronASTTypes.FRONTMATTER)
        frontmatter = nodeIn as FrontmatterContent;
    });

    if (range.start.line === 0) {
      // Can't check frontmatter if frontmatter is not visible
      if (_.isUndefined(frontmatter)) {
        allDiagnostics.push(warnMissingFrontmatter());
      } else {
        const { diagnostics, errors } = checkAndWarnBadFrontmatter(
          note,
          frontmatter
        );
        allDiagnostics.push(...diagnostics);
        if (errors) allErrors.push(...errors);
      }
    }
  }

  return {
    allDecorations,
    allDiagnostics,
    allErrors,
  };
}
