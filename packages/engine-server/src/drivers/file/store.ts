// @ts-ignore
import {
  assert,
  Checkpoint,
  DEngineStore,
  DEngineStoreOpts,
  DEngineStoreWriteOpts,
  DNodeData,
  DNodeRawProps,
  EngineQueryResp,
  IDNode,
  IllegalOperationError,
  makeResponse,
  NodeBuilder,
  Note,
  NoteRawProps,
  QueryMode,
  QueryOpts,
  Schema,
  SchemaRawProps,
  StoreDeleteOpts,
  StoreGetResp,
  StoreQueryOpts,
} from "@dendronhq/common-all";
import {
  createLogger,
  deleteFile,
  DLogger,
  getAllFiles,
  mdFile2NodeProps,
  node2MdFile,
  schema2YMLFile,
} from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { FileParser } from "./parser";

interface FileStorageOpts extends DEngineStoreOpts {
  root: string;
  logger?: DLogger;
}

export function fileNameToTitle(name: string): string {
  const ext = path.extname(name);
  return path.basename(name, ext);
}

// @ts-ignore
const CACHE_KEYS = {
  QUERY_ALL: "QUERY_ALL",
};

export abstract class FileStorageBase {
  opts: FileStorageOpts;
  public idToPath: { [key: string]: string };

  public rootId: string;

  public logger: DLogger;

  constructor(opts: FileStorageOpts) {
    this.opts = opts;
    this.idToPath = {};
    this.rootId = "";
    this.logger = opts.logger || createLogger("FileStore");
    this.logger.info("initialized");
  }

  abstract doGetFile(id: string): DNodeRawProps<DNodeData>;

  isRoot(id: string) {
    return id === "root";
  }

  async getRoot() {
    this.logger.debug({ ctx: "getRoot", rootId: this.rootId });
    return this.doGetFile(this.rootId);
  }

  async get(id: string, _opts?: QueryOpts): Promise<StoreGetResp> {
    let resp: DNodeRawProps<DNodeData>;
    this.logger.debug({ ctx: "get:presGetFile", id });
    if (this.isRoot(id)) {
      resp = await this.getRoot();
    } else {
      resp = this.doGetFile(id);
    }
    this.logger.debug({ ctx: "get:postGetFile" });
    return {
      data: resp,
    };
  }
}

export class FileStorage extends FileStorageBase implements DEngineStore {
  files2Notes(fpaths: string[]): NoteRawProps[] {
    const fp = new FileParser(this, { errorOnEmpty: false });
    const data = fp.parse(fpaths);
    const errors = fp.errors;
    const badParseErrors = errors.filter((e) => e.status === "BAD_PARSE");
    if (!_.isEmpty(badParseErrors)) {
      throw Error(`bad yaml: ${badParseErrors}`);
    }
    return data.map((n) => n.toRawProps());
  }

  doGetFile(id: string): DNodeRawProps<DNodeData> {
    const { root } = this.opts;
    const fpath = this.idToPath[id];
    assert(!_.isUndefined(fpath), `id ${id} should be in fpath`);
    const uri = path.join(root, `${fpath}.md`);
    return mdFile2NodeProps(uri);
  }

  async _getNoteAll(): Promise<NoteRawProps[]> {
    const allFiles = getAllFiles({
      root: this.opts.root,
      include: ["*.md"],
    }) as string[];
    return this.files2Notes(allFiles);
  }

  async _getSchemaAll(): Promise<SchemaRawProps[]> {
    const allFiles = getAllFiles({
      root: this.opts.root,
      include: ["*.schema.yml"],
    }) as string[];
    const fp = new FileParser(this, { errorOnEmpty: false });
    const data = fp.parseSchema(allFiles);
    return data;
  }

  _writeFile(node: IDNode) {
    if (node.type === "schema") {
      return schema2YMLFile(node as Schema, { root: this.opts.root });
    }
    return node2MdFile(node as Note, { root: this.opts.root });
  }

  isQueryAll(qs: string) {
    return qs === "**/*";
  }

  /**
   * Throws:
   *  - DendronError
   * @param id
   */
  // @CacheClear({ cacheKey: CACHE_KEYS.QUERY_ALL })
  async delete(id: string, opts?: StoreDeleteOpts): Promise<void> {
    if (id === this.rootId) {
      throw new IllegalOperationError({ msg: "can't delete root" });
    }
    const fpath = opts?.fpath ? opts.fpath : this.idToPath[id] + ".md";
    const uri = path.join(this.opts.root, fpath);
    deleteFile(uri);
    this.deleteFromIdToPath(id);
    return;
  }

  async getChangedSinceCheckpoint(
    _checkpoint: Checkpoint
  ): Promise<DNodeRawProps[]> {
    return [];
  }

  async getLastSavedCheckpoint(): Promise<Checkpoint> {
    return null;
  }

  async getLastCheckpoint(): Promise<Checkpoint> {
    return null;
  }

  async query(
    queryString: string,
    mode: QueryMode,
    _opts?: StoreQueryOpts
  ): Promise<EngineQueryResp> {
    if (mode === "schema") {
      if (this.isQueryAll(queryString)) {
        const schemaProps = await this._getSchemaAll();
        const data = new NodeBuilder().buildSchemaFromProps(schemaProps);
        // TODO
        // this.refreshIdToPath(data)
        this.logger.debug({ ctx: "query:exit:pre" });
        return makeResponse<EngineQueryResp>({ data, error: null });
      }
      throw Error(`unsupported ${queryString}`);
    }
    // mode === note
    let data: Note[];
    const schemas = _opts?.schemas || {};
    let noteProps: NoteRawProps[] = [];

    if (this.isQueryAll(queryString)) {
      if (this.opts.cache && (await this.getLastCheckpoint()) !== null) {
        const checkpoint = await this.getLastSavedCheckpoint();
        noteProps = (await this.opts.cache.getAll(
          "note",
          checkpoint
        )) as NoteRawProps[];
        const lastCheck = await this.getLastCheckpoint();
        if (lastCheck !== checkpoint) {
          const entriesChanged = (await this.getChangedSinceCheckpoint(
            lastCheck
          )) as NoteRawProps[];
          noteProps = entriesChanged.concat(noteProps);
        }
      } else {
        noteProps = await this._getNoteAll();
      }
      data = new NodeBuilder().buildNoteFromProps(noteProps, {
        schemas: _.values(schemas),
      });
      this.refreshIdToPath(data);

      this.logger.debug({ ctx: "query:exit:pre" });
      return makeResponse<EngineQueryResp>({ data, error: null });
    }
    throw Error(`unsupported ${queryString}`);
  }

  deleteFromIdToPath(id: string) {
    delete this.idToPath[id];
  }

  refreshIdToPath(nodes: IDNode[]) {
    if (nodes[0].type === "schema") {
      // null-op
      return;
    }
    nodes.forEach((n) => {
      this.idToPath[n.id] = n.path;
      if (n.title === "root") {
        this.rootId = n.id;
      }
    });
  }

  async write(node: IDNode, opts?: DEngineStoreWriteOpts) {
    opts = _.defaults(opts, {
      stub: false,
      recursive: false,
      writeStub: false,
    });
    if (opts.writeStub || (!opts.stub && !node.stub)) {
      await this._writeFile(node);
    }
    if (opts.writeStub || (!opts.stub && opts.recursive)) {
      await Promise.all(node.children.map((c) => this.write(c, opts)));
    }
    // FIXME:OPT: only do for new nodes
    this.updateNodes([node]);
    return;
  }

  /**
   * Add to storage cache
   * @param nodes
   */
  async updateNodes(nodes: IDNode[]) {
    this.refreshIdToPath(nodes);
  }
}

export default FileStorage;
