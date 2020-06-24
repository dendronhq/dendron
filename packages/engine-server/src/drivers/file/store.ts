// @ts-ignore
import {
  DEngineStore,
  DNodeData,
  DNodeRawProps,
  EngineQueryResp,
  IDNode,
  IllegalOperationError,
  NodeBuilder,
  NoteRawProps,
  QueryMode,
  QueryOpts,
  Schema,
  SchemaRawProps,
  Scope,
  StoreGetResp,
  assert,
  createLogger,
  makeResponse
} from "@dendronhq/common-all";
import {
  deleteFile,
  getAllFiles,
  mdFile2NodeProps,
  node2MdFile,
  schema2YMLFile
} from "@dendronhq/common-server";

import { FileParser } from "./parser";
// import NodeCache from 'node-cache';
import _ from "lodash";
import path from "path";

// import { useAdapter } from '@type-cacheable/node-cache-adapter';

const logger = createLogger("FileStore");
// const cacheClient = new NodeCache();
// useAdapter(cacheClient);

interface FileStorageOpts {
  root: string;
}

export function fileNameToTitle(name: string): string {
  const ext = path.extname(name);
  return path.basename(name, ext);
}

// @ts-ignore
const CACHE_KEYS = {
  QUERY_ALL: "QUERY_ALL"
};

class FileStorage implements DEngineStore {
  opts: FileStorageOpts;

  public idToPath: { [key: string]: string };

  public rootId: string;

  constructor(opts: FileStorageOpts) {
    this.opts = opts;
    this.idToPath = {};
    this.rootId = "";
  }

  _getFile(id: string): DNodeRawProps<DNodeData> {
    const { root } = this.opts;
    const fpath = this.idToPath[id];
    assert(!_.isUndefined(fpath), `id ${id} should be in fpath`);
    const uri = path.join(root, `${fpath}.md`);
    return mdFile2NodeProps(uri);
  }

  // @Cacheable({
  //     cacheKey: CACHE_KEYS.QUERY_ALL,
  //     hashKey: "query",
  //     // @ts-ignore
  //     client: cacheClient,
  //     ttlSeconds: 86400,
  // })
  async _getNoteAll(): Promise<NoteRawProps[]> {
    const allFiles = getAllFiles({
      root: this.opts.root,
      include: ["*.md"]
    }) as string[];
    const fp = new FileParser(this, { errorOnEmpty: false });
    const data = fp.parse(allFiles);
    const report = fp.report();
    logger.debug({ ctx: "_getQueryAll:exit", report });
    return data.map(n => n.toRawProps());
  }

  async _getSchemaAll(): Promise<SchemaRawProps[]> {
    const allFiles = getAllFiles({
      root: this.opts.root,
      include: ["*.schema.yml"]
    }) as string[];
    const fp = new FileParser(this, { errorOnEmpty: false });
    const data = fp.parseSchema(allFiles);
    return data;
  }

  _writeFile(node: IDNode) {
    if (node.type === "schema") {
      return schema2YMLFile(node as Schema, { root: this.opts.root });
    }
    return node2MdFile(node, { root: this.opts.root });
  }

  isRoot(id: string) {
    return id === "root";
  }

  isQueryAll(qs: string) {
    return qs === "**/*";
  }

  async getRoot() {
    logger.debug({ ctx: "getRoot", rootId: this.rootId });
    return this._getFile(this.rootId);
  }

  /**
   * Throws:
   *  - DendronError
   * @param id
   */
  // @CacheClear({ cacheKey: CACHE_KEYS.QUERY_ALL })
  async delete(id: string): Promise<void> {
    if (id === this.rootId) {
      throw new IllegalOperationError("can't delete root");
    }
    const fpath = this.idToPath[id];
    const uri = path.join(this.opts.root, `${fpath}.md`);
    deleteFile(uri);
    this.deleteFromIdToPath(id);
    return;
  }

  async get(
    _scope: Scope,
    id: string,
    _opts?: QueryOpts
  ): Promise<StoreGetResp> {
    let resp: DNodeRawProps<DNodeData>;
    logger.debug({ ctx: "get:presGetFile", id });
    if (this.isRoot(id)) {
      resp = await this.getRoot();
    } else {
      resp = this._getFile(id);
    }
    logger.debug({ ctx: "get:postGetFile", resp });
    return {
      data: resp
    };
  }

  async query(
    _scope: Scope,
    queryString: string,
    mode: QueryMode,
    _opts?: QueryOpts
  ): Promise<EngineQueryResp> {
    if (mode === "schema") {
      if (this.isQueryAll(queryString)) {
        const schemaProps = await this._getSchemaAll();
        const data = new NodeBuilder().buildSchemaFromProps(schemaProps);
        // TODO
        // this.refreshIdToPath(data)
        logger.debug({ ctx: "query:exit:pre" });
        return makeResponse<EngineQueryResp>({ data, error: null });
      }
      throw Error(`unsupported ${queryString}`);
    }
    // mode === note
    if (this.isQueryAll(queryString)) {
      const noteProps = await this._getNoteAll();
      const data = new NodeBuilder().buildNoteFromProps(noteProps);
      // const data = new RawParser().parse(nodesAll)
      this.refreshIdToPath(data);

      logger.debug({ ctx: "query:exit:pre" });
      return makeResponse<EngineQueryResp>({ data, error: null });
    }
    throw Error(`unsupported ${queryString}`);
  }

  deleteFromIdToPath(id: string) {
    delete this.idToPath[id];
  }

  refreshIdToPath(nodes: IDNode[]) {
    logger.debug({
      ctx: "refreshIdToPaths",
      nodes: nodes.map(n => n.toRawProps())
    });
    if (nodes[0].type === "schema") {
      // null-op
      return;
    }
    nodes.forEach(n => {
      this.idToPath[n.id] = n.path;
      if (n.title === "root") {
        this.rootId = n.id;
      }
    });
  }

  async write(_scope: Scope, node: IDNode) {
    await this._writeFile(node);
    // FIXME:OPT: only do for new nodes
    this.refreshIdToPath([node]);
    return;
  }
}

export default FileStorage;
