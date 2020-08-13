import MarkdownIt from "markdown-it";
import markdownItRegex from "markdown-it-regex";
import {
  findUriByRef,
  getFileUrlForMarkdownPreview,
  getWorkspaceCache,
  parseRef,
  extractEmbedRefs,
} from "../utils/utils";
import fs from "fs-extra";
import path from "path";
import { parseDendronRef, extractBlock } from "@dendronhq/engine-server";
import _ from "lodash";
import { readMD } from "@dendronhq/common-server";

const getInvalidRefAnchor = (text: string) =>
  `<a class="memo-invalid-link" title="Link does not exist yet. Please use cmd / ctrl + click in text editor to create a new one." href="javascript:void(0)">${text}</a>`;

const getRefAnchor = (href: string, text: string) =>
  `<a title="${href}" href="${href}">${text}</a>`;

const extendMarkdownIt = (md: MarkdownIt) => {
  const mdExtended = md
    .use(markdownItRegex, {
      name: "ref-resource",
      regex: /\(\(([^)]+)\)\)/,
      replace: (rawRef: string) => {
        // const { ref, label } = parseRef(rawRef);
        const { direction, link } = parseDendronRef(rawRef);
        let ref: string;
        let label: string;
        // open file
        if (link?.name && link.type === "file") {
          ref = link.name;
          label = ref;
        } else {
          throw new Error("unsupported");
        }
        const fsPath = findUriByRef(getWorkspaceCache().markdownUris, ref)
          ?.fsPath;
        if (!fsPath || !fs.existsSync(fsPath)) {
          return getInvalidRefAnchor(label || ref);
        }
        const name = path.parse(fsPath).name;
        const { content } = readMD(fsPath);
        const block = extractBlock(content, link);

        const cyclicLinkDetected = false;
        const refs = extractEmbedRefs(block).map((ref) => ref.toLowerCase());
        const html = `<div class="memo-markdown-embed">
        <div class="memo-markdown-embed-link">
          <a title="${fsPath}" href="${fsPath}">
            <i class="icon-link"></i> ${name}
          </a>
        </div>
        <div class="memo-markdown-embed-content">
          ${
            !cyclicLinkDetected
              ? (mdExtended as any).render(block, undefined, true)
              : '<div class="memo-cyclic-link-warning">Cyclic linking detected 💥.</div>'
          }
        </div>
      </div>`;
        return html;
      },
    })
    .use(markdownItRegex, {
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
