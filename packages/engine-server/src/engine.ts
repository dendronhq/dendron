import {
  assert,
  assertExists,
  DendronError,
  DEngine,
  DEngineMode,
  DEngineOpts,
  DEngineStore,
  DNode,
  DNodeData,
  DNodeDict,
  DNodeRawProps,
  DNodeUtils,
  EngineDeleteOpts,
  EngineGetResp,
  EngineQueryResp,
  IDNode,
  INoteOpts,
  makeResponse,
  NodeBuilder,
  NodeWriteOpts,
  Note,
  NoteDict,
  NoteUtils,
  QueryMode,
  QueryOneOpts,
  QueryOpts,
  Schema,
  SchemaDict,
  SchemaRawProps,
  UpdateNodesOpts,
} from "@dendronhq/common-all";
import { createLogger, DLogger, Logger } from "@dendronhq/common-server";
import fs from "fs-extra";
import Fuse from "fuse.js";
import _ from "lodash";
import FileStorage from "./drivers/file/store";
import { BodyParser } from "./drivers/raw/BodyParser";

let _DENDRON_ENGINE: DendronEngine;

function isAllQuery(qs: string): boolean {
  return qs === "**/*";
}

function createFuse<T>(
  initList: T[],
  opts: Fuse.IFuseOptions<any> & {
    exactMatch: boolean;
    preset: "schema" | "note";
  }
) {
  const options = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["title", "logicalPath", "basename"],
  };
  if (opts.preset === "schema") {
    options.keys = ["title", "id"];
  }
  const fuse = new Fuse(initList, options);
  return fuse;
}

type DendronEngineOpts = {
  root: string;
  cacheDir?: string;
  forceNew?: boolean;
  store?: DEngineStore;
  mode?: DEngineMode;
  logger?: DLogger;
};

type DendronEngineProps = Required<DendronEngineOpts>;

export class DendronEngine implements DEngine {
  public fuse: Fuse<Note, any>;
  public schemaFuse: Fuse<Schema, any>;

  public notes: NoteDict;
  public schemas: SchemaDict;

  public fullNodes: Set<string>;

  public initialized: boolean;

  public props: DendronEngineProps;

  public queries: Set<string>;

  public store: DEngineStore;

  public logger: Logger;

  static getOrCreateEngine(opts?: DendronEngineOpts): DEngine {
    const ctx = "getOrCreateEngine";
    if (opts) {
      const root = opts.root;
      const optsClean: DendronEngineProps = _.defaults(opts || {}, {
        forceNew: false,
        store: new FileStorage({ root, logger: opts?.logger }),
        root,
        // TODO: remove
        cacheDir: "/tmp/dendronCache",
        mode: "fuzzy",
        logger: createLogger("DEngine"),
      });
      if (!_DENDRON_ENGINE || optsClean.forceNew) {
        if (_.isUndefined(optsClean.root)) {
          throw Error(`root must be defined`);
        }
        optsClean.logger.info({ ctx, msg: "create new engine" });
        // TODO
        _DENDRON_ENGINE = new DendronEngine(optsClean.store, optsClean);
      }
    }
    if (!_DENDRON_ENGINE) {
      throw Error("dendron engine not initialized");
    }
    return _DENDRON_ENGINE;
  }

  constructor(store: DEngineStore, props: DendronEngineProps) {
    // eslint-disable-next-line spaced-comment
    //this.nodes = store.fetchInitial();
    this.notes = {};
    this.initialized = false;
    this.props = props;
    this.store = store;
    this.fuse = createFuse<Note>([], {
      exactMatch: this.props.mode === "exact",
      preset: "note",
    });
    this.fullNodes = new Set();
    this.queries = new Set();
    // @ts-ignore
    this.logger = props.logger;

    // setup schemas
    this.schemas = {};
    this.schemaFuse = createFuse<Schema>([], {
      exactMatch: this.props.mode === "exact",
      preset: "schema",
    });

    [props.root].forEach((fpath) => {
      if (!fs.existsSync(fpath as string)) {
        throw Error(`${fpath} doesn't exist`);
      }
    });
  }

  _createRoot(mode: QueryMode): IDNode {
    if (mode === "schema") {
      const schema = Schema.createRoot();
      return schema;
    } else {
      const note = Note.createRoot();
      return note;
    }
  }

  async init() {
    await this.query("**/*", "schema", {
      fullNode: false,
      initialQuery: true,
    });
    await this.query("**/*", "note", {
      fullNode: false,
      initialQuery: true,
    });
    this.initialized = true;
    return;
  }

  deleteFromNodes(id: string) {
    this.fuse.remove((doc: DNode) => {
      // FIXME: can be undefined, dunno why
      if (!doc) {
        return false;
      }
      return doc.id === id;
    });
    delete this.notes[id];
    this.fullNodes.delete(id);
  }

  /**
   * Updates local cache
   * - if node is new, add it to cache
   * - if not new, update existing node properties
   * - extra:
   *   - if full node, add id
   * @param nodes
   * @param opts
   */
  refreshNodes(nodes: IDNode[], opts?: QueryOpts) {
    if (_.isEmpty(nodes)) {
      return;
    }
    const mode = nodes[0].type;
    if (mode === "schema") {
      const schemas = nodes as Schema[];
      schemas.forEach((node: Schema) => {
        this.schemas[node.id] = node;
      });
      this.updateLocalCollection(_.values(this.schemas), "schema");
      return;
    } else {
      nodes.forEach((node: IDNode) => {
        const { id } = node;

        if (!_.has(this.notes, id)) {
          // add if not exist
          // TODO: nodes has both raw and full nodes
          // @ts-ignore
          this.notes[id] = node;
        } else {
          // exists, merge it
          this.logger.debug({
            ctx: "refreshNodes:existingNode",
            node: node.toRawProps(),
          });
          _.merge(this.notes[id], node);
        }
        // if a full node, make sure to add
        if (opts?.fullNode) {
          this.fullNodes.add(id);
        }
      });
      // FIXME: debug
      const newNodes = _.map(nodes, (n) => ({ title: n.title, id: n.id }));
      const allNodes = _.map(this.notes, (n) => ({
        title: n.title,
        id: n.id,
      }));
      this.logger.debug({
        ctx: "refreshNodes",
        newNodes,
        allNodes,
      });
      this.updateLocalCollection(_.values(this.notes), "note");
      return;
    }
  }

  /**
   * Turn parent|children ids to full nodes
   */
  async resolveIds(
    node: DNodeRawProps<DNodeData>,
    dict: DNodeDict
  ): Promise<Note> {
    const nodeResolved: INoteOpts = dict[node.id] as INoteOpts;
    assert(
      !_.isUndefined(nodeResolved),
      `node ${JSON.stringify(node)} not in dict\nkeys: ${_.keys(dict)}`
    );
    nodeResolved.body = node.body;
    return new Note({ ...nodeResolved });
  }

  updateLocalCollection(collection: IDNode[], mode: QueryMode) {
    if (mode === "schema") {
      return this.schemaFuse.setCollection(collection as Schema[]);
    } else {
      return this.fuse.setCollection(collection as Note[]);
    }
  }

  async delete(idOrFname: string, opts?: EngineDeleteOpts): Promise<void> {
    const ctx = "delete";
    const cleanOpts = _.defaults(opts, { metaOnly: false });
    // TODO: take care of schema
    let noteToDelete = this.notes[idOrFname];
    if (_.isUndefined(noteToDelete)) {
      const fname = DNodeUtils.basename(idOrFname, false);
      // NOTE: get around ts issues
      const tmp = _.find(this.notes, { fname });
      if (_.isUndefined(tmp)) {
        const msg = `node ${idOrFname} not found`;
        this.logger.error({ ctx, msg });
        throw Error(msg);
      }
      noteToDelete = tmp;
    }
    const { id } = noteToDelete;
    if (!cleanOpts.metaOnly) {
      await this.store.delete(id);
    }
    this.deleteFromNodes(id);
    if (!_.isEmpty(noteToDelete.children)) {
      const noteAsStub = Note.createStub(noteToDelete.fname, {
        id,
        children: noteToDelete.children,
      });
      this.refreshNodes([noteAsStub], { stub: true });
    }
    return;
  }

  /**
   * Defaults
   * @param id
   * @param opts
   *  - fullNode: {default:true}
   */
  async get(id: string, mode: QueryMode, opts?: QueryOpts) {
    opts = _.defaults(opts || {}, { fullNode: true, createIfNew: true });
    let nodeDict;
    this.logger.debug({ ctx: "get", id, opts });

    if (mode === "schema") {
      nodeDict = this.schemas;
      const node = nodeDict[id];
      return { data: node };
    }
    //FIXME: check if exist
    // we are assuming all nodes are fetched
    const node = this.notes[id];

    // a full node has a body and is fully resolved
    if (opts?.fullNode && !this.fullNodes.has(id)) {
      this.logger.debug({ ctx: "get:fetchFromStore:pre", id });
      const fnResp = await this.store.get(id, {
        ...opts,
        webClient: true,
      });
      this.logger.debug({ ctx: "get:fetchFromStore:post", id, opts, fnResp });
      const fullNode = await this.resolveIds(fnResp.data, this.notes);
      this.logger.debug({ ctx: "get:resolve:post", fnResp });
      // TODO:
      this.refreshNodes([fullNode], opts);
      return { data: fullNode };
    }
    return { data: node };
  }

  async query(
    queryString: string,
    mode: QueryMode,
    opts?: QueryOpts
  ): Promise<EngineQueryResp<DNodeData>> {
    opts = _.defaults(opts || {}, {
      fullNode: false,
      createIfNew: false,
      initialQuery: false,
      stub: false,
    });
    const ctx = "query";
    let data: EngineQueryResp;

    // handle all query case
    if (isAllQuery(queryString)) {
      this.logger.debug({ ctx: "query:queryAll:pre", mode });
      try {
        data = await this.store.query("**/*", mode, {
          ...opts,
          schemas: this.schemas,
        });
      } catch (err) {
        if (err instanceof DendronError) {
          this.logger.info({ ctx, msg: "no root found", mode });
          const root = this._createRoot(mode);
          await this.store.write(root);
          this.logger.info({ ctx, msg: "post:store.write", mode });
          return this.query(queryString, mode, opts);
        } else {
          const { message, stack } = err;
          this.logger.error({ ctx, err: JSON.stringify({ message, stack }) });
          throw err;
        }
      }
      if (opts.initialQuery) {
        this.refreshNodes(data.data);
      }
      // @ts-ignore
      return data as EngineQueryResp;
    }

    // handle schema query
    if (mode === "schema") {
      const results = this.schemaFuse.search(queryString);
      let items: Schema[];
      const nodes = this.schemas;
      if (opts.queryOne) {
        items = [results[0]?.item];
      } else {
        items = _.map(results, (resp) => resp.item);
      }
      this.logger.debug({ ctx: "query:exit:schema", items });
      return makeResponse<EngineQueryResp>({
        data: _.map(items, (item) => nodes[item.id]),
        error: null,
      });
    } else {
      let items: IDNode[];
      // shortcut for root query
      if (queryString === "") {
        items = [this.notes.root];
      } else {
        // handle note query
        const results = this.fuse.search(queryString);
        if (opts.queryOne) {
          items = [results[0]?.item];
        } else {
          items = _.map(results, (resp) => resp.item);
        }

        // found a result but it doesn't match
        if (
          opts.queryOne &&
          items[0]?.path !== queryString &&
          opts.createIfNew
        ) {
          this.logger.debug({
            ctx: "query:write:pre",
            queryString,
            item: items[0],
          });
          const nodeBlank = new Note({ fname: queryString, stub: opts.stub });
          await this.write(nodeBlank, {
            newNode: true,
            stub: opts.stub,
          });
          const { data: nodeFull } = await this.get(nodeBlank.id, mode);
          this.refreshNodes([nodeFull], { fullNode: true });
          return makeResponse<EngineQueryResp>({
            data: [nodeFull],
            error: null,
          });
        }
      }

      // found result but want full node
      if (opts.fullNode) {
        const fetchedFullNodes = await Promise.all(
          _.map<IDNode, Promise<IDNode | null>>(items, async (ent) => {
            if (!this.fullNodes.has(ent.id)) {
              this.logger.debug({
                ctx: "query:fuse.search:post",
                status: "fetch full node from store",
              });
              // FIXME: ratelimit
              const fn = await this.get(ent.id, mode);
              return fn.data;
            }
            this.logger.debug({
              ctx: "query:fuse.search:post",
              status: "fetch full node from cache",
            });
            return null;
          })
        );
        this.refreshNodes(
          _.filter(fetchedFullNodes, (ent) => !_.isNull(ent)) as IDNode[],
          { fullNode: true }
        );
        this.logger.debug({
          ctx: "query:fetchedFullNodes:exit",
          fetchedFullNodes,
        });
      }
      this.logger.debug({ ctx: "query:exit:note", items });
      return makeResponse<EngineQueryResp>({
        data: _.map(items, (item) => this.notes[item.id]),
        error: null,
      });
    }
  }

  async queryOne(
    queryString: string,
    mode: QueryMode,
    opts?: QueryOneOpts
  ): Promise<EngineGetResp<DNodeData>> {
    const resp = await this.query(queryString, mode, {
      ...opts,
      queryOne: true,
    });
    return makeResponse<EngineGetResp>({ data: resp.data[0], error: null });
  }

  async write(node: IDNode, opts?: NodeWriteOpts): Promise<void> {
    const props = _.defaults(opts, {
      newNode: false,
      body: "",
      stub: false,
      parentsAsStubs: false,
      recursive: false,
      noAddParent: false,
    });
    if (node.type === "schema") {
      const refreshList: DNode[] = [node];
      assertExists(node?.body, "body must exist");
      // convert body
      const schemaRawProps: SchemaRawProps[] = new BodyParser().parseSchema(
        props.body,
        {
          node,
          fname: node.fname,
        }
      );
      const schemas = new NodeBuilder().buildSchemaFromProps(schemaRawProps);
      const schemaNew = _.find(schemas, { id: node.id });
      if (_.isUndefined(schemaNew)) {
        throw Error(`no schema found for ${node} on write`);
      }
      node = schemaNew;
      // reset body
      node.body = "";
      await this.store.write(node, { stub: props.stub });
      if (props.newNode) {
        const parentPath = "root";
        const parentNode = _.find(this.schemas, (n) => n.title === parentPath);
        if (!parentNode) {
          throw Error("no parent found");
        }
        (parentNode as Schema).addChild(node as Schema);
      }
      return this.refreshNodes(refreshList, { fullNode: props.newNode });
    } else {
      const note = node as Note;
      await this.store.write(note, {
        stub: props.stub,
        recursive: props.recursive,
      });
      return this.updateNodes(
        [note],
        _.pick(props, ["parentsAsStubs", "newNode", "noAddParent"])
      );
    }
  }

  updateProps(opts: DEngineOpts) {
    if (opts.mode) {
      this.props.mode = opts.mode;
      // @ts-ignore
      const config = Fuse.config;
    }
  }

  async updateNodes(nodes: IDNode[], opts: UpdateNodesOpts): Promise<void> {
    const ntype = nodes[0].type;
    if (ntype === "schema") {
      throw Error("not supported");
    } else {
      await Promise.all(
        _.map(nodes, (node) => {
          return this._updateNote(node as Note, opts);
        })
      );
      return;
    }
  }

  // OPTIMIZE: do in bulk
  /**
   *
   * @param note
   * @param opts
   */
  async _updateNote(note: Note, opts: UpdateNodesOpts) {
    const refreshList: Note[] = [note];
    if (!opts.noAddParent) {
      let parentPath = DNodeUtils.dirName(note.fname);
      if (_.isEmpty(parentPath)) {
        parentPath = "root";
      }
      let parentNode = _.find(this.notes, (n) => n.path === parentPath);
      if (!parentNode) {
        if (opts.parentsAsStubs) {
          const closestParent = DNodeUtils.findClosestParent(
            note.logicalPath,
            this.notes
          );
          const stubNodes = NoteUtils.createStubNotes(
            closestParent as Note,
            note
          );
          stubNodes.forEach((ent2) => {
            refreshList.push(ent2);
          });
          // last element is parent
          parentNode = stubNodes.slice(-1)[0];
        } else {
          throw Error("no parent found");
        }
      }
      parentNode.addChild(note);
    }
    return this.refreshNodes(refreshList, { fullNode: opts.newNode });
  }
}
