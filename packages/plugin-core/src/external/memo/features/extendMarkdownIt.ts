import MarkdownIt from "markdown-it";
import markdownItRegex from "markdown-it-regex";
import {
  findUriByRef,
  getFileUrlForMarkdownPreview,
  getWorkspaceCache,
  parseRef,
} from "../utils/utils";

const getInvalidRefAnchor = (text: string) =>
  `<a class="memo-invalid-link" title="Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one." href="javascript:void(0)">${text}</a>`;

const getRefAnchor = (href: string, text: string) =>
  `<a title="${href}" href="${href}">${text}</a>`;

const extendMarkdownIt = (md: MarkdownIt) => {
  const mdExtended = md.use(markdownItRegex, {
    name: "ref-document",
    regex: /\[\[([^\[\]]+?)\]\]/,
    replace: (rawRef: string) => {
      const { ref, label } = parseRef(rawRef);
      const fsPath = findUriByRef(getWorkspaceCache().allUris, ref)?.fsPath;
      if (!fsPath) {
        return getInvalidRefAnchor(label || ref);
      }
      return getRefAnchor(getFileUrlForMarkdownPreview(fsPath), label || ref);
    },
  });
  return mdExtended;
};

export default extendMarkdownIt;
