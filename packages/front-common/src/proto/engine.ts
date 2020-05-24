import {
  DEngine,
  DEngineStore,
  DNodeDict,
  IDNode,
  NodeGetResp,
  NodeQueryResp,
  QueryOpts,
  Scope,
} from "../common/types";
import { DropboxStorage, Note, makeResponse } from "@dendron/common-all";

import Fuse from "fuse.js";
import { Logger } from "@aws-amplify/core";
import _ from "lodash";

const logger = new Logger("DEngine");

let PROTO_ENGINE: ProtoEngine;
function createMockData() {
  const secondChildNote = new Note({
    id: "manifesto",
    title: "manifesto",
    desc: "first child desc",
    type: "note",
    schemaId: "-1",
    // body: "Dendron Manifesto",
  });
  const firstChildNote = new Note({
    id: "dendron",
    title: "dendron",
    desc: "first child desc",
    type: "note",
    schemaId: "-1",
    // body: "Dendron Project",
  });
  const rootNote = new Note({
    id: "root",
    title: "root",
    desc: "root",
    type: "note",
    schemaId: "-1",
    // body: "The root node",
  });
  rootNote.addChild(firstChildNote);
  firstChildNote.addChild(secondChildNote);

  const initialNodes: DNodeDict = {
    [rootNote.id]: rootNote,
    [firstChildNote.id]: firstChildNote,
    [secondChildNote.id]: secondChildNote,
  };
  return initialNodes;
}
const INITIAL_DATA = createMockData();

export interface FuseOptions {
  exactMatch?: boolean;
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

function createFuse(initList: IDNode[], opts: FuseOptions) {
  const options = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["title", "path"],
  };
  // initList = _.map(initList, (n) => ({ ...n, treePath: n.path }));
  // console.log({ initList, bond: true });
  const fuse = new Fuse(initList, options);
  return fuse;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
export class MockDataStore implements DEngineStore {
  public data: DNodeDict;
  constructor() {
    this.data = INITIAL_DATA;
  }

  fetchInitial() {
    return this.data;
  }

  async get(_scope: Scope, id: string): Promise<NodeGetResp> {
    // TODO
    return new Promise((resolve) => {
      setTimeout(() => {
        const note = _.get(
          INITIAL_DATA,
          id,
          new Note({
            id,
            title: "sample",
            desc: "sample",
            type: "note",
            schemaId: "-1",
          })
        );
        note.body = `content for ${id}`;
        resolve({ data: note });
      }, 1200);
    });
  }
}

// @ts-ignore - TODO: implement interface
export class ProtoEngine implements DEngine {
  public fuse: Fuse<IDNode, any>;
  public nodes: DNodeDict;
  public fullNodes: Set<string>;
  public queries: Set<string>;
  public store: DEngineStore;

  static getEngine(): DEngine {
    if (!PROTO_ENGINE) {
      // PROTO_ENGINE = new ProtoEngine(new MockDataStore());
      PROTO_ENGINE = new ProtoEngine(new DropboxStorage());
      return PROTO_ENGINE;
    }
    return PROTO_ENGINE;
  }

  constructor(store: DEngineStore) {
    //this.nodes = store.fetchInitial();
    this.nodes = {};
    this.store = store;
    const fuseList = _.values(this.nodes);
    this.fuse = createFuse(fuseList, { exactMatch: false });
    this.fullNodes = new Set();
    this.queries = new Set();
  }

  _nodeInCache(node: IDNode, opts?: QueryOpts) {
    const hasStub = _.has(this.nodes, node.id);
    const fufillsFull = opts?.fullNode ? true : this.fullNodes.has(node.id);
    return hasStub && fufillsFull;
  }

  // FIXME: query doesn't check for full nodes
  _queryInCache(qs: string) {
    const hasQuery = _.has(this.queries, qs);
    return hasQuery;
  }

  /**
   * Updates local cache
   * @param nodes
   * @param opts
   */
  refreshNodes(nodes: IDNode[], opts?: QueryOpts) {
    nodes.forEach((node: IDNode) => {
      const { id } = node;
      // add if not exist
      if (!_.has(this.nodes, id)) {
        this.nodes[id] = node;
      } else {
        _.merge(this.nodes[id], node);
        if (opts?.fullNode) {
          this.fullNodes.add(id);
        }
      }
    });
    this.updateLocalCollection(_.values(this.nodes));
  }

  updateLocalCollection(collection: IDNode[]) {
    this.fuse.setCollection(collection);
  }

  async get(_scope: Scope, id: string, opts?: QueryOpts) {
    //FIXME: check if exist
    const node = this.nodes[id];
    opts = _.defaults(opts || {}, { fullNode: true });
    if (opts?.fullNode && !this.fullNodes.has(id)) {
      const fnResp = await this.store.get(_scope, id, {
        ...opts,
        webClient: true,
      });
      logger.debug({ ctx: "get:store.get:post", id, opts, fnResp });
      this.refreshNodes([fnResp.data], opts);
      return fnResp;
    } else {
      return { data: node };
    }
  }

  async query(scope: Scope, queryString: string, opts?: QueryOpts) {
    console.log({ scope, queryString, opts });
    opts = _.defaults(opts || {}, {
      fullNode: false,
    });
    // TODO: hack
    if (queryString === "**/*") {
      const data = await this.store.query(scope, "**/*", opts);
      this.refreshNodes(data.data);
      return data;
    }
    // FIXME: assuem we have everything
    // if (!this._queryInCache(queryString)) {
    //   await this.store.query(scope, queryString, opts);
    // }
    // TODO: fetch remote
    const results = this.fuse.search(queryString);
    logger.debug({ ctx: "query:fuse.search:post", results, queryString });
    let items: IDNode[];
    if (opts.queryOne) {
      items = [results[0].item];
    } else {
      items = _.map(results, (resp) => resp.item);
    }

    if (opts.fullNode) {
      const fetchedFullNodes = await Promise.all(
        _.map<IDNode, Promise<IDNode | null>>(items, async (ent) => {
          if (!this.fullNodes.has(ent.id)) {
            logger.debug({
              ctx: "query:fuse.search:post",
              status: "fetch full node from store",
            });
            // FIXME: ratelimit
            const fn = await this.get(scope, ent.id);
            return fn.data;
          } else {
            logger.debug({
              ctx: "query:fuse.search:post",
              status: "fetch full node from cache",
            });
            return null;
          }
        })
      );
      this.refreshNodes(
        _.filter(fetchedFullNodes, (ent) => !_.isNull(ent)) as IDNode[],
        { fullNode: true }
      );
      logger.debug({ ctx: "query:fetchedFullNodes:exit", fetchedFullNodes });
    }
    logger.debug({ ctx: "query:exit", items });
    return makeResponse<NodeQueryResp>({
      data: _.map(items, (item) => this.nodes[item.id]),
      error: null,
    });
  }
}

export function engine() {
  return ProtoEngine.getEngine();
}
