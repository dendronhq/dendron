import {
  DEngine,
  DNode,
  DNodeDict,
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

function createFuse(initList: DNode[], opts: FuseOptions) {
  const options = {
    shouldSort: true,
    threshold: opts.exactMatch ? 0.0 : 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ["title"],
  };
  const fuse = new Fuse(initList, options); // "list" is the item array
  return fuse;
}

interface DEngineStore {
  fetchInitial: () => DNodeDict;
}

class MockDataStore {
  public data: DNodeDict;
  constructor() {
    const firstChildNote = new Note({
      id: "fe4a234a-618d-4037-a70f-6892dadafac2",
      title: "first child",
      desc: "first child desc",
      type: "note",
      schemaId: "-1",
      parent: null,
      children: [],
      body: "first child body",
    });
    const rootNote = new Note({
      id: "a5f919f8-e46d-4709-9449-7aa1ea980f98",
      title: "root",
      desc: "root",
      type: "note",
      schemaId: "-1",
      parent: null,
      children: [firstChildNote],
    });

    const initialNodes: DNodeDict = {
      [rootNote.id]: rootNote,
      [firstChildNote.id]: firstChildNote,
    };
    this.data = initialNodes;
  }

  fetchInitial() {
    return this.data;
  }
}

export class ProtoEngine implements DEngine {
  public fuse: Fuse<DNode, any>;
  public nodes: DNodeDict;

  static getEngine() {
    if (!PROTO_ENGINE) {
      PROTO_ENGINE = new ProtoEngine(new MockDataStore());
    }
    return PROTO_ENGINE;
  }

  constructor(store: DEngineStore) {
    this.nodes = store.fetchInitial();
    const fuseList = _.values(this.nodes);
    this.fuse = createFuse(fuseList, { exactMatch: false });
  }

  updateLocalCollection(collection: DNode[]) {
    this.fuse.setCollection(collection);
  }

  async get(_scope: Scope, id: string) {
    //FIXME: check if exist
    const node = this.nodes[id];
    return { item: node };
  }

  query(scope: Scope, queryString: string) {
    console.log({ scope, queryString });
    // TODO: fetch remote
    const results = this.fuse.search(queryString);
    const item = _.map(results, (resp) => resp.item);
    return makeResponse<NodeQueryResp>({
      item,
      error: null,
    });
  }
}

export function engine() {
  return ProtoEngine.getEngine();
}
