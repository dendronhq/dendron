import {
  DEngineStore,
  DNode,
  DNodeDict,
  DNodeUtils,
  IDNode,
  Note,
  NoteDict,
  NoteRawProps,
  NoteUtils,
  SchemaNodeRaw,
  SchemaRawOpts,
  SchemaRawProps,
  assert
} from "@dendronhq/common-all";
import {
  createLogger,
  globMatch,
  mdFile2NodeProps
} from "@dendronhq/common-server";

import YAML from "yamljs";
import _ from "lodash";
import fs from "fs-extra";
import path from "path";

// @ts-ignore
const logger = createLogger("FileParser");

type FileMeta = {
  // file name: eg. foo.md, name = foo
  prefix: string;
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
type FileMetaDict = { [key: string]: FileMeta[] };

function getFileMeta(fpaths: string[]): FileMetaDict {
  const metaDict: FileMetaDict = {};
  _.forEach(fpaths, fpath => {
    const { name } = path.parse(fpath);
    const lvl = name.split(".").length;
    if (!_.has(metaDict, lvl)) {
      metaDict[lvl] = [];
    }
    metaDict[lvl].push({ prefix: name, fpath });
  });
  return metaDict;
}

function findClosestParent(fpath: string, nodes: DNodeDict): IDNode {
  const dirname = DNodeUtils.dirName(fpath);
  if (dirname === "") {
    return nodes["root"];
  }
  const maybeNode = _.find(nodes, { fname: dirname });
  if (maybeNode) {
    return maybeNode;
  } else {
    return findClosestParent(dirname, nodes);
  }
  // (_.find(nodes, { fname:  }))

  // let acc = 0;
  // if
  // //_.eachRight(parts, () => {
  // parts.forEach(() => {
  //   acc -= 1;
  //   const cand = parts.slice(acc);
  //   const resp = _.find(nodes, { fname: cand.join(".") });
  //   if (resp) {
  //     return resp;
  //   }
  //   return undefined;
  // });
  // // default parent to rootkk
  // return nodes["root"];
}

type FileParserOpts = {
  errorOnEmpty?: boolean;
  errorOnBadParse?: boolean;
};
type FileParserProps = Required<FileParserOpts>;

export class FileParser {
  public errors: any[];

  public opts: FileParserProps;

  public missing: Set<string>;

  public store: DEngineStore;

  constructor(store: DEngineStore, opts?: FileParserOpts) {
    this.errors = [];
    this.missing = new Set<string>();
    this.opts = _.defaults(opts, {
      errorOnEmpty: true,
      errorOnBadParse: true
    });
    this.store = store;
  }

  toNode(
    ent: FileMeta,
    parents: Note[],
    store: DEngineStore,
    opts?: {
      errorOnEmpty?: boolean;
      isRoot?: boolean;
      errorOnBadParse?: boolean;
    }
  ): { node: Note | null; missing: string | null } {
    opts = _.defaults(opts, {
      errorOnEmpty: true,
      isRoot: false,
      errorOnBadParse: true
    });
    // DEBUG: noteProps: {noteProps}
    // TODO: handle errors
    let noteProps: NoteRawProps;
    try {
      noteProps = mdFile2NodeProps(path.join(store.opts.root, ent.fpath));
    } catch (err) {
      logger.error({ ctx: "toNode", ent, opts, err });
      if (opts.errorOnBadParse) {
        throw err;
      } else {
        const errorMsg = {
          status: "BAD_PARSE",
          ent,
          err
        };
        this.errors.push(errorMsg);
        return { node: null, missing: null };
      }
    }
    // OPT
    //logger.debug({ ctx: "toNode:mdFile2NodeProps:post", noteProps })
    let parent: Note | null;
    let parentPath: string | null = null;
    let missing: null | string = null;
    if (noteProps.parent === "not_set") {
      parentPath = DNodeUtils.dirName(ent.prefix);
      parent = _.find(parents, p => p.path === parentPath) || null;
    } else {
      parent = _.find(parents, p => p.id === noteProps.parent) || null;
    }
    // error checking
    if (!parent && !opts.isRoot) {
      const errorMsg = {
        status: "NO_PARENT_PATH",
        ent,
        parentPath
      };
      this.errors.push(errorMsg);
      // should not be the case
      if (!parentPath) {
        throw Error(`no parent path found for ${JSON.stringify(errorMsg)}`);
      }
      missing = parentPath;
      if (opts.errorOnEmpty) {
        throw new Error(JSON.stringify(errorMsg));
      }
    }
    // children not looked at when parsing since we build iteratively based on parent
    const note = new Note({ ...noteProps, parent, children: [] });
    if (parent) {
      parent.addChild(note);
    }
    // OPT
    //logger.debug({ ctx: "toNode:exit", note: note.toRawProps(), missing })
    return { node: note, missing };
  }

  _parseSchema(fpath: string): SchemaRawProps[] {
    const fname = path.parse(fpath).name;
    const root = this.store.opts.root;

    const schemaOpts: SchemaRawOpts[] = YAML.parse(
      fs.readFileSync(path.join(root, fpath), "utf8")
    );
    const schemaProps = schemaOpts.map(o =>
      SchemaNodeRaw.createProps({ ...o, fname })
    );
    return schemaProps;
  }

  parseSchema(data: string[]): SchemaRawProps[] {
    if (_.isEmpty(data)) {
      return [];
    }
    return data.map(fpath => this._parseSchema(fpath)).flat();
  }

  parse(data: string[]): Note[] {
    if (_.isEmpty(data)) {
      return [];
    }
    // used to reconstruct missing notes
    const nodesStore: NoteDict = {};
    const store = this.store;
    const fileMetaDict: FileMetaDict = getFileMeta(data);
    // logger.debug({ ctx: "parse:getFileMeta:post", fileMetaDict })
    const out = [];
    const root = fileMetaDict[1].find(n => n.fpath === "root.md") as FileMeta;
    assert(!_.isUndefined(root), "no root found");
    const { node: rootNode } = this.toNode(root, [], store, {
      isRoot: true,
      errorOnBadParse: this.opts.errorOnBadParse
    }) as { node: Note };
    out.push(rootNode);
    nodesStore["root"] = rootNode;

    // domain root
    let lvl = 2;
    let prevNodes: Note[] = fileMetaDict[1]
      // don't count root node, handle separately
      .filter(n => n.fpath !== "root.md")
      .map(ent =>
        // first layer, no parent, expected
        {
          const { node } = this.toNode(ent, [], store, {
            isRoot: true
          });
          return node;
        }
      ) as Note[];
    prevNodes.forEach(n => {
      rootNode.addChild(n);
      nodesStore[n.fname] = n;
    });
    out.push(prevNodes);

    // domain root children
    while (_.has(fileMetaDict, lvl)) {
      // OPT: slow
      // logger.debug({
      //     ctx: "parse:while",
      //     prevNodes: prevNodes.map(n => n.toRawProps()),
      // })
      const currNodes = fileMetaDict[lvl]
        // eslint-disable-next-line no-loop-func
        .map(ent => {
          // ignore root.schema and other such files
          if (globMatch(["root.*"], ent.fpath)) {
            return null;
          }
          const { node, missing } = this.toNode(ent, prevNodes, store, {
            errorOnEmpty: this.opts.errorOnEmpty,
            errorOnBadParse: this.opts.errorOnBadParse
          });
          if (missing) {
            const closetParent = findClosestParent(
              (node as Note).logicalPath,
              nodesStore
            );
            NoteUtils.createStubNotes(closetParent as Note, node as Note);
            this.missing.add(missing);
          }
          return node;
        })
        .filter(Boolean) as Note[];
      lvl += 1;
      currNodes.forEach(n => {
        nodesStore[n.fname] = n;
      });
      // TODO: remove
      out.push(currNodes);
      prevNodes = currNodes;
    }
    // TODO: replace with _.values(nodeStore)
    return _.flatten(out);
  }

  report() {
    const { errors, missing } = this;
    return {
      numErrors: errors.length,
      errors,
      missing: Array.from(missing)
    };
  }
}
