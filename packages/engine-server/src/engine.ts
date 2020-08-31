import {
  assert,
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
  NodeWriteOpts,
  Note,
  NoteDict,
  NoteUtils,
  QueryMode,
  QueryOneOpts,
  QueryOpts,
  Schema,
  SchemaDict,
  UpdateNodesOpts,
} from "@dendronhq/common-all";
import { createLogger, DLogger, Logger } from "@dendronhq/common-server";
import fs from "fs-extra";
import Fuse from "fuse.js";
import _ from "lodash";
import FileStorage from "./drivers/file/store";

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
  forceNew?: boolean;
  store?: DEngineStore;
  mode?: DEngineMode;
  logger?: DLogger;
};

type DendronEngineProps = Required<DendronEngineOpts>;

export class DendronEngine implements DEngine {
  public fuse: Fuse<Note>;
  public schemaFuse: Fuse<Schema>;

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

  deleteFromNodes(id: string, mode: QueryMode) {
    if (mode === "note") {
      this.fuse.remove((doc: DNode) => {
        // FIXME: can be undefined, dunno why
        if (!doc) {
          return false;
        }
        return doc.id === id;
      });
      delete this.notes[id];
      this.fullNodes.delete(id);
    } else {
      this.schemaFuse.remove((doc: DNode) => {
        if (!doc) {
          return false;
        }
        // FIXME: should be deleting all children as well
        return doc.id === id;
      });
      // FIXME: should be deleting all children as well
      delete this.schemas[id];
    }
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
  async refreshNodes(nodes: IDNode[], opts?: { fullNode?: boolean }) {
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
            node: node.toRawProps(true),
          });
          _.merge(this.notes[id], node);
        }
        // if a full node, make sure to add
        if (opts?.fullNode) {
          this.fullNodes.add(id);
        }
      });
      this.updateLocalCollection(_.values(this.notes), "note");
      await this.store.updateNodes(nodes);
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

  async delete(
    idOrFname: string,
    mode: QueryMode,
    opts?: EngineDeleteOpts
  ): Promise<void> {
    const ctx = "delete";
    const cleanOpts = _.defaults(opts, { metaOnly: false });
    let noteToDelete: DNode;

    if (mode === "note") {
      noteToDelete = this.notes[idOrFname];
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
    } else {
      // TODO: only support fname
      noteToDelete = this.schemas[idOrFname];
    }
    const { id } = noteToDelete;

    if (!cleanOpts.metaOnly) {
      const storeOpts =
        mode === "schema" ? { fpath: noteToDelete.fname + ".yml" } : {};
      await this.store.delete(id, storeOpts);
    }
    this.deleteFromNodes(id, mode);
    if (mode === "note") {
      // if have children, keep this note as a stub
      if (!_.isEmpty(noteToDelete.children)) {
        noteToDelete.stub = true;
        this.refreshNodes([noteToDelete]);
      } else {
        // no more children, delete from parent
        if (noteToDelete.parent) {
          noteToDelete.parent.children = _.reject(
            noteToDelete.parent.children,
            { id: noteToDelete.id }
          );
        }
      }
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
      const fullNode = await this.resolveIds(fnResp.data, this.notes);
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

        // check if we need to create a new node
        if (
          opts.queryOne &&
          opts.createIfNew &&
          // did not find a good match or found a match but it was a stub
          (items[0]?.path !== queryString || items[0]?.stub)
        ) {
          this.logger.debug({
            ctx: "query:write:pre",
            queryString,
          });
          let nodeBlank: Note;
          if (items[0]?.path === queryString && items[0]?.stub) {
            nodeBlank = items[0] as Note;
            nodeBlank.stub = false;
          } else {
            nodeBlank = new Note({ fname: queryString, stub: opts.stub });
          }
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
        });
      }
      this.logger.debug({ ctx: "query:exit:note" });
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
      writeStub: false,
    });
    await this.store.write(node, {
      stub: props.stub,
      recursive: props.recursive,
    });
    return this.updateNodes(
      [node],
      _.pick(props, ["parentsAsStubs", "newNode", "noAddParent"])
    );
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
      await Promise.all(
        _.map(nodes, (node) => {
          return this._updateSchema(node as Schema);
        })
      );
    } else {
      await Promise.all(
        _.map(nodes, (node) => {
          return this._updateNote(node as Note, opts);
        })
      );
      return;
    }
  }
  async _updateSchema(node: Schema) {
    const root = this.schemas.root;
    root.addChild(node);
    return this.refreshNodes([node]);
  }

  // OPTIMIZE: do in bulk
  /**
   * Indexes note into engine. This does a few things:
   *   - Add parent-child relationship to note.
   *   - If parent's don't exist, create parents as stubs.
   *   - Calls `refreshNodes` on notes
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
