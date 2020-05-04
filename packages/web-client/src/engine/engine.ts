import { NodeStubDict, Scope, NodeType, NodeDict, DendronEngine, Node, NodeStub, NodeGetBatchResp, toStub, NodeQueryResp } from "../common/types"
// Any datastore that can store regex searchable paths can implement Storage
export type IdDict = { [path: string]: string };
export type NodeStore = { query: (scope: Scope, regex: RegExp) => Promise<IdDict> } &
            Pick<DendronEngine, "getBatch" | "writeBatch">;
export default class Engine {
  public storage: NodeStore;

  constructor(storage: NodeStore) {
    this.storage = storage
  }

  public async query(scope: Scope, queryString: string, nodeType: NodeType): Promise<NodeQueryResp> {
    let regexes = this.query_to_regexes(queryString);
    let filters = regexes.map(regex => regex[0]).filter(filter => filter.length != 0);
    let combined_regex = RegExp(
      "(?=.*" + filters.join(")(?=.*") + ")(?:(?:.*" + filters.join("$)|(?:.*") + "$))"
    ); // intersection of regexes
    let ids = await this.storage.query(scope, combined_regex);
    let nodes = await this.storage.getBatch(scope, Object.values(ids), nodeType);
    if (nodeType == "stub") { return { error: null, ...nodes}; }
    return { item: this.fromStubs(this.update_paths(ids, regexes), nodes.item), error: null, ...nodes }
  }

  // The basic strategy is to create groups of positionally-matched values,
  // each initiated by an explicitly matched value. This means that each explicit match
  // sets the position for subsequent positional matches.
  private query_to_regexes(query: string): [string, string][] {
    let terms = query.split('/');
    let filter_groups: [string, string][][] = [];
    let i = 1;
    if (!terms[0].includes("=")) filter_groups.push([]); // create first group
    for (let term of terms) {
      let [filter, replacement] = this.split_term(term);
      if (filter.indexOf("=") > 0) { // nonempty explicit match (/foo=bar/ and /foo=/)
        i = 1;
        if (filter.indexOf("=") == filter.length - 1) { // match the schema with any value
          filter_groups.push([[filter + "([^/]*)", replacement + "$" + i]]);
          i += 1;
        } else {
          filter_groups.push([[filter, replacement]]);
        }
      } else if(filter.length == 0) { // ->new_term
        filter_groups[filter_groups.length - 1].push(["", replacement]);
      } else { // positional match (/*/, /**/, and /bar/)
        let group = replacement.length == 0 ? "" : "$" + i;
        filter_groups[filter_groups.length - 1].push(filter.includes("*") ?
          [filter.includes("**") ? "(.*)" : "([^/]*)", group] : // /*/ and /**/
          ["([^/]*=)" + filter, group + replacement]
        );
        i += 1;
      }
    }
    if (!terms[0].includes("=")) filter_groups[0][0][0] = "^" + filter_groups[0][0][0]; // start at top
    return filter_groups.map(group => [
      group.map(g => g[0]).filter(g => g.length != 0).join('/'),
      group.map(g => g[1]).filter(g => g.length != 0).join('/')
    ]);
  }

  // puts the returned path into the requested order, and fills in all missing information
  private update_paths(paths: IdDict, regexes: [string, string][]): IdDict {
    let regexps: [RegExp, string][] = regexes.map(r => [RegExp(r[0]), r[1]]);
    let out: IdDict = {};
    for (let path in paths) {
      let key = regexps.map(r => (path.match(r[0]) || [""])[0].replace(r[0], r[1])).join('/');
      out[key] = paths[path];
    }
    return out;
  }

  private split_term(term: string): [string, string] {
    // matches foo->bar, foo=bar->baz, foo->bar=baz, and foo=bar->baz=buzz with capturing
    // TODO: add support for foo->baz=bar->buzz
    let match = /(?:([^/]*=[^/]*)->((?:[^/]*=[^/]*)|(?=\/|$))|([^/]*=)?([^/=]*)->([^/=]*)(=[^/]*)?)/g.exec(term);
    if (!match) { return [term, term]; }
    //3: pre-replacement text. 1/4: text to replace. 2/5 replacement. 6: post-replacement text
    return [
      (match[3] || "") + (match[1] || match[4] || "") + (match[6] || ""),
      (match[3] || "") + (match[2] || match[5] || "") + (match[6] || "")
    ]
  }
  public fromStubs (ids: IdDict, stubs: NodeStubDict | NodeDict): NodeDict {
    const paths = Object.keys(ids).sort();
    if (paths.length == 0) { return {}; }
    const out: NodeDict = {};
    const helper = (i: number, parent_path: string) => {
      while (i < paths.length && paths[i].startsWith(parent_path)) {
        out[ids[parent_path]].children.push(toStub(stubs[ids[paths[i]]]));
        out[ids[paths[i]]] = {
          ...stubs[ids[paths[i]]],
          parent: toStub(stubs[ids[parent_path]]),
          children: (stubs[ids[paths[i]]] as Node).children || [],
        };
        i++;
        if (i < paths.length && paths[i].startsWith(paths[i - 1])) { out[ids[paths[i - 1]]].children = []; } // clear implicit children if there are explicit ones
        helper(i, paths[i - 1]);
      }
    };
    out[ids[paths[0]]] = { ...stubs[ids[paths[0]]], parent: (stubs[ids[paths[0]]] as Node).parent || null, children: [] };
    helper(1, paths[0]);
    return out;
  }
}