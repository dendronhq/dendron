import { DLink, NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";

export function createWikiLinkRE(opts?: { oldLink: string }) {
  const { oldLink } = opts || {};
  if (oldLink) {
    const match = escapeForRegExp(oldLink);
    return `\\[\\[\\s*?(.*\\|)?\\s*${match}\\s*\\]\\]`;
  }
  return "\\[\\[\\s*?(.*\\|)?\\s*(.*)\\s*\\]\\]";
}

export const escapeForRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function findLinks({ note }: { note: NotePropsV2 }): DLink[] {
  const content = note.body;
  const reWiki = createWikiLinkRE();
  const wikiLinks = content.matchAll(new RegExp(reWiki, "i"));
  const wikiLinksMatches = Array.from(wikiLinks, (m) => {
    if (_.isUndefined(m.index)) {
      throw Error("no index found, findLinks");
    }
    return {
      match: m[0],
      start: m.index,
      end: m.index + m[0].length,
    };
  });
  return wikiLinksMatches.map((m) => ({
    type: "wiki",
    from: NoteUtilsV2.toLoc(note),
    original: m.match,
    pos: { start: m.start, end: m.end },
  }));
}

// export function replaceLinks({
//   content,
//   links,
// }: {
//   content: string;
//   links: { from: DNoteLink; to: DNoteLink }[];
//   onMatch?: () => void;
//   onReplace?: () => void;
// }) {
//   links.map(({ from, to }) => {
//     const pattern = createWikiLinkRE({ oldLink: from.from.fname });
//     const nextContent = content.replace(
//       new RegExp(pattern, "gi"),
//       ($0, $1, offset) => {
//         // const pos = document.positionAt(offset);

//         // if (
//         //   isInFencedCodeBlock(document, pos.line) ||
//         //   isInCodeSpan(document, pos.line, pos.character)
//         // ) {
//         //   return $0;
//         // }
//         return `[[${_.trim($1) || ""}${ref.new}]]`;
//       }
//     );
//   });
// }

// export const replaceRefs = ({
//   refs,
//   content,
//   onMatch,
//   onReplace,
// }: {
//   refs: { old: string; new: string }[];
//   content: string;
//   onMatch?: () => void;
//   onReplace?: () => void;
// }): string | null => {
//   const { updatedOnce, nextContent } = refs.reduce(
//     ({ updatedOnce, nextContent }, ref) => {
//       //const pattern = `\\[\\[${escapeForRegExp(ref.old)}(\\|.*)?\\]\\]`;
//       const oldRef = escapeForRegExp(ref.old);
//       const pattern = `\\[\\[\\s*?(.*\\|)?\\s*${oldRef}\\s*\\]\\]`;

//       if (new RegExp(pattern, "i").exec(content)) {
//         let replacedOnce = false;

//         // @ts-ignore
//         const nextContent = content.replace(
//           new RegExp(pattern, "gi"),
//           // @ts-ignore
//           ($0, $1, offset) => {
//             // const pos = document.positionAt(offset);

//             // if (
//             //   isInFencedCodeBlock(document, pos.line) ||
//             //   isInCodeSpan(document, pos.line, pos.character)
//             // ) {
//             //   return $0;
//             // }

//             if (!replacedOnce) {
//               onMatch && onMatch();
//             }

//             onReplace && onReplace();

//             replacedOnce = true;

//             return `[[${_.trim($1) || ""}${ref.new}]]`;
//           }
//         );

//         return {
//           updatedOnce: true,
//           nextContent,
//         };
//       }

//       return {
//         updatedOnce: updatedOnce,
//         nextContent: nextContent,
//       };
//     },
//     { updatedOnce: false, nextContent: content }
//   );

//   return updatedOnce ? nextContent : null;
// };
