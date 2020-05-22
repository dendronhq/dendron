import {
  DEngine,
  DEngineStore,
  DNodeDict,
  FetchNodeOpts,
  IDNode,
  NodeGetResp,
  NodeQueryResp,
  Scope,
} from "../common/types";

import Fuse from "fuse.js";
import { Note } from "../common/node";
import _ from "lodash";

function makeResponse<T>(resp: T) {
  return Promise.resolve({
    ...resp,
  });
}
let PROTO_ENGINE: null | ProtoEngine = null;

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
  const fuse = new Fuse(initList, options); // "list" is the item array
  return fuse;
}

class MockDataStore implements DEngineStore {
  public data: DNodeDict;
  constructor() {
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
    this.data = initialNodes;
  }

  fetchInitial() {
    return this.data;
  }

  async get(scope: Scope, id: string): Promise<NodeGetResp> {
    // TODO
    return new Promise((resolve) => {
      setTimeout(() => {
        const note = new Note({
          id,
          title: "sample",
          desc: "sample",
          type: "note",
          schemaId: "-1",
          body: `content for ${id}`,
        });
        resolve({ item: note });
      }, 1200);
    });
  }
}

export class ProtoEngine implements DEngine {
  public fuse: Fuse<IDNode, any>;
  public nodes: DNodeDict;
  public fullNodes: Set<string>;
  public queries: Set<string>;
  public store: DEngineStore;

  static getEngine() {
    if (!PROTO_ENGINE) {
      PROTO_ENGINE = new ProtoEngine(new MockDataStore());
    }
    return PROTO_ENGINE;
  }

  constructor(store: DEngineStore) {
    this.nodes = store.fetchInitial();
    this.store = store;
    const fuseList = _.values(this.nodes);
    this.fuse = createFuse(fuseList, { exactMatch: false });
    this.fullNodes = new Set();
    this.queries = new Set();
  }

  _nodeInCache(node: IDNode, opts?: FetchNodeOpts) {
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
  refreshNodes(nodes: IDNode[], opts?: FetchNodeOpts) {
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
  }

  updateLocalCollection(collection: IDNode[]) {
    this.fuse.setCollection(collection);
  }

  async get(_scope: Scope, id: string, opts?: FetchNodeOpts) {
    //FIXME: check if exist
    const node = this.nodes[id];
    if (opts?.fullNode && !this.fullNodes.has(id)) {
      const fnResp = await this.store.get(_scope, id);
      return fnResp;
    } else {
      return { item: node };
    }
  }

  // TODO
  async getByUrl(_url: string) {
    // TODO: do more then id
    const id = "";
    const node = this.nodes[id];
    return { item: node };
  }

  async query(scope: Scope, queryString: string, opts?: FetchNodeOpts) {
    console.log({ scope, queryString });
    opts = _.defaults(opts || {}, {
      fullNode: false,
    });
    // FIXME: assuem we have everything
    // if (!this._queryInCache(queryString)) {
    //   await this.store.query(scope, queryString, opts);
    // }
    // TODO: fetch remote
    const results = this.fuse.search(queryString);
    const items = _.map(results, (resp) => resp.item);
    if (opts.fullNode) {
      const fetchedFullNodes = await Promise.all(
        _.map<IDNode, Promise<IDNode | null>>(items, async (ent) => {
          if (!this.fullNodes.has(ent.id)) {
            // FIXME: ratelimit
            const fn = await this.store.get(scope, ent.id);
            return fn.item;
          } else {
            return null;
          }
        })
      );
      this.refreshNodes(
        _.filter(fetchedFullNodes, (ent) => !_.isNull(ent)) as IDNode[],
        { fullNode: true }
      );
    }
    return makeResponse<NodeQueryResp>({
      item: _.map(items, (item) => this.nodes[item.id]),
      error: null,
    });
  }
}

export function engine() {
  return ProtoEngine.getEngine();
}
