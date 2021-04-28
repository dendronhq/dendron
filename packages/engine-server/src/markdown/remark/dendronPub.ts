import { DendronError, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Image, Root } from "mdast";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { SiteUtils } from "../../topics/site";
import {
  DendronASTDest,
  NoteRefDataV4,
  VaultMissingBehavior,
  WikiLinkNoteV4,
} from "../types";
import { MDUtilsV4 } from "../utils";
import { NoteRefsOpts } from "./noteRefs";
import { convertNoteRefASTV2 } from "./noteRefsV2";
import { RemarkUtils } from "./utils";
import { addError, getNoteOrError } from "./utils";

type PluginOpts = NoteRefsOpts & {
  assetsPrefix?: string;
  insertTitle?: boolean;
  /**
   * Don't publish pages that are dis-allowd by dendron.yml
   */
  transformNoPublish?: boolean;
};

function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  const proc = this;
  let {
    dest,
    vault,
    fname,
    config,
    overrides,
    insideNoteRef,
  } = MDUtilsV4.getDendronData(proc);
  function transformer(tree: Node, _file: VFile) {
    let root = tree as Root;
    const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
    const insertTitle = !_.isUndefined(overrides?.insertTitle)
      ? overrides?.insertTitle
      : opts?.insertTitle;
    if (!insideNoteRef && insertTitle && root.children) {
      if (!fname || !vault) {
        // TODO: tmp
        console.log(JSON.stringify(engine.notes));
        throw new DendronError({
          msg: `dendronPub - no fname or vault for node: ${JSON.stringify(
            tree
          )}`,
        });
      }
      const note = NoteUtils.getNoteByFnameV5({
        fname,
        notes: engine.notes,
        vault: vault,
        wsRoot: engine.wsRoot,
      });
      if (!note) {
        throw new DendronError({ msg: `no note found for ${fname}` });
      }
      const idx = _.findIndex(root.children, (ent) => ent.type !== "yaml");
      root.children.splice(
        idx,
        0,
        u("heading", { depth: 1 }, [u("text", note.title)])
      );
    }
    visit(tree, (node, _idx, parent) => {
      if (
        node.type === "wikiLink" &&
        dest !== DendronASTDest.MD_ENHANCED_PREVIEW
      ) {
        let _node = node as WikiLinkNoteV4;
        let value = node.value as string;
        // we change this later
        let valueOrig = value;
        let isPublished = true;
        const data = _node.data;
        vault = MDUtilsV4.getVault(proc, data.vaultName, {
          vaultMissingBehavior: VaultMissingBehavior.FALLBACK_TO_ORIGINAL_VAULT,
        });
        if (error) {
          debugger;
          addError(proc, error);
        }

        const copts = opts?.wikiLinkOpts;
        if (opts?.transformNoPublish) {
          const notes = NoteUtils.getNotesByFname({
            fname: valueOrig,
            notes: engine.notes,
            vault,
          });
          const { error, note } = getNoteOrError(notes, value);
          if (error) {
            value = "403";
            addError(proc, error);
          } else {
            if (!note || !config) {
              value = "403";
              addError(proc, new DendronError({ msg: "no note or config" }));
            } else {
              isPublished = SiteUtils.isPublished({
                note,
                config,
                engine,
              });
              if (!isPublished) {
                value = "403";
              }
            }
          }
        }
        if (copts?.useId && isPublished) {
          const notes = NoteUtils.getNotesByFname({
            fname: valueOrig,
            notes: engine.notes,
            vault,
          });
          const { error, note } = getNoteOrError(notes, value);
          if (error) {
            addError(proc, error);
          } else {
            value = note!.id;
          }
        }
        const alias = data.alias ? data.alias : value;
        const href = `${copts?.prefix || ""}${value}.html${
          data.anchorHeader ? "#" + data.anchorHeader : ""
        }`;
        const exists = true;
        // for rehype
        //_node.value = newValue;
        //_node.value = alias;
        _node.data = {
          alias,
          permalink: href,
          exists: exists,
          hName: "a",
          hProperties: {
            // className: classNames,
            href,
          },
          hChildren: [
            {
              type: "text",
              value: alias,
            },
          ],
        };

        if (value === "403") {
          _node.data = {
            alias,
            hName: "a",
            hProperties: {
              "data-toggle": "popover",
              title: "This page has not yet sprouted",
              style: "cursor: pointer",
              "data-content": [
                `<a href="https://dendron.so/">Dendron</a> (the tool used to generate this site) lets authors selective publish content. You will see this page whenever you click on a link to an unpublished page`,
                "",
                "<img src='https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/not-sprouted.png'></img>",
              ].join("\n"),
            },
            hChildren: [
              {
                type: "text",
                value: alias,
              },
            ],
          };
        }
      }
      if (
        node.type === "refLinkV2" &&
        dest !== DendronASTDest.MD_ENHANCED_PREVIEW
      ) {
        // we have custom compiler for markdown to handle note ref
        const ndata = node.data as NoteRefDataV4;
        const copts: NoteRefsOpts = {
          wikiLinkOpts: opts?.wikiLinkOpts,
          prettyRefs: opts?.prettyRefs,
        };
        const procOpts = proc.data("procOpts") as any;
        const { data } = convertNoteRefASTV2({
          link: ndata.link,
          proc,
          compilerOpts: copts,
          procOpts,
        });
        if (data) {
          if (parent!.children.length > 1) {
            const children = parent!.children;
            const idx = RemarkUtils.findIndex(
              children,
              RemarkUtils.isNoteRefV2
            );
            parent!.children = children
              .slice(0, idx)
              .concat(data)
              .concat(children.slice(idx + 1, -1));
          } else {
            parent!.children = data;
          }
        }
      }
      if (node.type === "image" && dest === DendronASTDest.HTML) {
        let imageNode = node as Image;
        if (opts?.assetsPrefix) {
          imageNode.url =
            "/" +
            _.trim(opts.assetsPrefix, "/") +
            "/" +
            _.trim(imageNode.url, "/");
        }
      }
    });
    return tree;
  }
  return transformer;
}

export { plugin as dendronPub };
export { PluginOpts as DendronPubOpts };
