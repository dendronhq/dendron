import {
  DEngine,
  DEngineMode,
  DEngineStore,
  DNodeData,
  DNodeDict,
  DNodeRawProps,
  DNodeUtils,
  EngineQueryResp,
  IDNode,
  INoteOpts,
  NodeBuilder,
  NodeWriteOpts,
  Note,
  NoteDict,
  QueryMode,
  QueryOpts,
  Schema,
  SchemaDict,
  SchemaRawProps,
  assert,
  assertExists,
  getStage,
  makeResponse,
  NoteUtils,
  DNode
} from "@dendronhq/common-all";

import { BodyParser } from "./drivers/raw/BodyParser";
import FileStorage from "./drivers/file/store";
import Fuse from "fuse.js";
import _ from "lodash";
import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";

let PROTO_ENGINE: ProtoEngine;
const logger = createLogger("DEngine");

function isAllQuery(qs: string): boolean {
  return qs === "**/*";
}

export interface FuseOptions {
  exactMatch?: boolean;
  preset: QueryMode;
  // isCaseSensitive?: boolean
  // distance?: number
  // findAllMatches?: boolean
  // includeMatches?: boolean
  // includeScore?: boolean
  // location?: number
  // minMatchCharLength?: number
  // shouldSort?: boolean
  // threshold?: number
  // useExtendedSearch?: boolean
}

function createFuse<T>(initList: T[], opts: FuseOptions) {
  const options = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["title", "logicalPath", "basename"]
  };
  if (opts.preset === "schema") {
    options.keys = ["title", "id"];
  }
  // initList = _.map(initList, (n) => ({ ...n, treePath: n.path }));
  const fuse = new Fuse(initList, options);
  return fuse;
}

type ProtoEngineOpts = {
  root?: string;
  cacheDir?: string;
  forceNew?: boolean;
  store: DEngineStore;
  mode?: DEngineMode;
};

type ProtoEngineGetOpts = Partial<ProtoEngineOpts>;

type ProtoEngineProps = Required<ProtoEngineOpts>;

export class ProtoEngine implements DEngine {
  public fuse: Fuse<Note, any>;
  public schemaFuse: Fuse<Schema, any>;

  public notes: NoteDict;
  public schemas: SchemaDict;

  public fullNodes: Set<string>;

  public opts: ProtoEngineProps;

  public queries: Set<string>;

  public store: DEngineStore;

  static getEngine(opts?: ProtoEngineGetOpts): DEngine {
    // TODO
    const root = opts?.root || "/Users/kevinlin/Dropbox/Apps/Noah/notesv2";
    const optsClean: ProtoEngineOpts = _.defaults(opts || {}, {
      forceNew: false,
      store: new FileStorage({ root }),
      root,
      // TODO
      cacheDir: "/tmp/dendronCache"
    });
    if (!PROTO_ENGINE || optsClean.forceNew) {
      const stage = getStage();
      if (_.isUndefined(optsClean.root)) {
        throw Error(`root must be defined`);
      }
      // TODO
      PROTO_ENGINE = new ProtoEngine(optsClean.store, optsClean);
      logger.info({ ctx: "getEngine:exit", optsClean, stage });
      return PROTO_ENGINE;
    }
    return PROTO_ENGINE;
  }

  constructor(store: DEngineStore, opts: ProtoEngineOpts) {
    // eslint-disable-next-line spaced-comment
    //this.nodes = store.fetchInitial();
    this.notes = {};
    this.opts = _.defaults(opts, {
      cacheDir: "/tmp/dendronCache",
      root: "/Users/kevinlin/Dropbox/Apps/Dendron",
      forceNew: false,
      mode: "exact",
    });
    this.store = store;
    this.fuse = createFuse<Note>([], {
      exactMatch: this.opts.mode === "exact",
      preset: "note"
    });
    this.fullNodes = new Set();
    this.queries = new Set();

    // setup schemas
    this.schemas = {};
    this.schemaFuse = createFuse<Schema>([], {
      exactMatch: this.opts.mode === "exact",
      preset: "schema"
    });

    [opts.root].forEach(fpath => {
      if (!fs.existsSync(fpath as string)) {
        throw Error(`${fpath} doesn't exist`);
      }
    });
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
    return;
  }

  deleteFromNodes(id: string) {
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
          logger.debug({
            ctx: "refreshNodes:existingNode",
            node: node.toRawProps()
          });
          _.merge(this.notes[id], node);
        }
        // if a full node, make sure to add
        if (opts?.fullNode) {
          this.fullNodes.add(id);
        }
      });
      // FIXME: debug
      const newNodes = _.map(nodes, n => ({ title: n.title, id: n.id }));
      const allNodes = _.map(this.notes, n => ({
        title: n.title,
        id: n.id
      }));
      logger.debug({
        ctx: "refreshNodes",
        newNodes,
        allNodes
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

  async delete(id: string): Promise<void> {
    await this.store.delete(id);
    this.deleteFromNodes(id);
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
    logger.debug({ ctx: "get", id, opts });

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
      logger.debug({ ctx: "get:fetchFromStore:pre", id });
      const fnResp = await this.store.get(id, {
        ...opts,
        webClient: true
      });
      logger.debug({ ctx: "get:fetchFromStore:post", id, opts, fnResp });
      const fullNode = await this.resolveIds(fnResp.data, this.notes);
      logger.debug({ ctx: "get:resolve:post", fnResp });
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
  ) {
    opts = _.defaults(opts || {}, {
      fullNode: false,
      createIfNew: false,
      initialQuery: false,
      stub: false
    });
    let data: EngineQueryResp;

    // handle all query case
    if (isAllQuery(queryString)) {
      logger.debug({ ctx: "query:queryAll:pre", mode });
      data = await this.store.query("**/*", mode, opts);
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
        items = _.map(results, resp => resp.item);
      }
      logger.debug({ ctx: "query:exit:schema", items });
      return makeResponse<EngineQueryResp>({
        data: _.map(items, item => nodes[item.id]),
        error: null
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
          items = _.map(results, resp => resp.item);
        }

        // found a result but it doesn't match
        if (
          opts.queryOne &&
          items[0]?.path !== queryString &&
          opts.createIfNew
        ) {
          logger.debug({
            ctx: "query:write:pre",
            queryString,
            item: items[0]
          });
          const nodeBlank = new Note({ fname: queryString, stub: opts.stub });
          await this.write(nodeBlank, {
            newNode: true,
            stub: opts.stub
          });
          const { data: nodeFull } = await this.get(nodeBlank.id, mode);
          this.refreshNodes([nodeFull], { fullNode: true });
          return makeResponse<EngineQueryResp>({
            data: [nodeFull],
            error: null
          });
        }
      }

      // found result but want full node
      if (opts.fullNode) {
        const fetchedFullNodes = await Promise.all(
          _.map<IDNode, Promise<IDNode | null>>(items, async ent => {
            if (!this.fullNodes.has(ent.id)) {
              logger.debug({
                ctx: "query:fuse.search:post",
                status: "fetch full node from store"
              });
              // FIXME: ratelimit
              const fn = await this.get(ent.id, mode);
              return fn.data;
            }
            logger.debug({
              ctx: "query:fuse.search:post",
              status: "fetch full node from cache"
            });
            return null;
          })
        );
        this.refreshNodes(
          _.filter(fetchedFullNodes, ent => !_.isNull(ent)) as IDNode[],
          { fullNode: true }
        );
        logger.debug({
          ctx: "query:fetchedFullNodes:exit",
          fetchedFullNodes
        });
      }
      logger.debug({ ctx: "query:exit:note", items });
      return makeResponse<EngineQueryResp>({
        data: _.map(items, item => this.notes[item.id]),
        error: null
      });
    }
  }

  async write(node: IDNode, opts?: NodeWriteOpts): Promise<void> {
    opts = _.defaults(opts, { newNode: false, body: "", stub: false, parentsAsStubs: false });
    const refreshList: DNode[] = [node];
    if (node.type === "schema") {
      assertExists(opts.body, "body must exist");
      // convert body
      const props: SchemaRawProps[] = new BodyParser().parseSchema(
        opts.body as string,
        {
          node,
          fname: node.fname
        }
      );
      const schemas = new NodeBuilder().buildSchemaFromProps(props);
      const schemaNew = _.find(schemas, { id: node.id });
      if (_.isUndefined(schemaNew)) {
        throw Error(`no schema found for ${node} on write`);
      }
      node = schemaNew;
      // reset body
      node.body = "";
      await this.store.write(node, { stub: opts.stub });
      if (opts.newNode) {
        const parentPath = "root";
        const parentNode = _.find(this.schemas, n => n.title === parentPath);
        if (!parentNode) {
          throw Error("no parent found");
        }
        (parentNode as Schema).addChild(node as Schema);
      }
    } else {
      const note = node as Note;
      await this.store.write(note, { stub: opts.stub });
      if (opts.newNode) {
        let parentPath = DNodeUtils.dirName(note.fname);
        if (_.isEmpty(parentPath)) {
          parentPath = "root";
        }
        let parentNode = _.find(this.notes, n => n.path === parentPath);
        if (!parentNode) {
          if (opts.parentsAsStubs) {
            const closestParent = DNodeUtils.findClosestParent(note.logicalPath, this.notes);
            const stubNodes = NoteUtils.createStubNotes(
              closestParent as Note,
              node as Note
            );
            stubNodes.forEach(ent2 => {
              refreshList.push(ent2);
            });
            parentNode = stubNodes.slice(-1)[0];
          } else {
            throw Error("no parent found");
          }
        }
        parentNode.addChild(note);
      }
    }
    // TODO
    return this.refreshNodes(refreshList, { fullNode: opts.newNode });
  }
}

// TODO: DEPRECATE
export function engine(opts?: ProtoEngineGetOpts) {
  return ProtoEngine.getEngine(opts);
}

export function getOrCreateEngine(opts?: ProtoEngineGetOpts) {
  return ProtoEngine.getEngine(opts);
}

export async function getAndInitializeEngine(rootDir: string) {
  const _engine = getOrCreateEngine({ root: rootDir, forceNew: true });
  // TODO: error check
  await _engine.init();
  return _engine;
}
