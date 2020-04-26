import { Node, NodeStubDict } from "../common/types"
// Any datastore that can store regex searchable paths can implement Storage
export interface NodeStore<TData> {
  query: (regex: RegExp) => NodeStubDict<TData>;
  write: (rows: NodeStubDict<TData>) => boolean;
}

export default class Engine<TData> {
  private storage: NodeStore<TData>;

  constructor(storage: NodeStore<TData>) {
    this.storage = storage
  }

  public query(query: string): NodeStubDict<TData> {
    let regexes = this.query_to_regexes(query);
    console.log(regexes);
    let filters = regexes.map(regex => regex[0]).filter(filter => filter.length != 0);
    console.log(filters);
    let combined_regex = RegExp(
      "(?=.*" + filters.join(")(?=.*") + ")(?:(?:.*" + filters.join("$)|(?:.*") + "$))"
    ); // intersection of regexes
    console.log(combined_regex);
    return this.update_path(this.storage.query(combined_regex), regexes);
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
      console.log([filter, replacement]);
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
  private update_path(results: NodeStubDict<TData>, regexes: [string, string][]): NodeStubDict<TData> {
    let regexps: [RegExp, string][] = regexes.map(r => [RegExp(r[0]), r[1]]);
    let out: NodeStubDict<TData> = {};
    for (let logicalId in results) {
      let key = regexps.map(r => (logicalId.match(r[0]) || [""])[0].replace(r[0], r[1])).join('/');
      out[key] = { ...results[logicalId], logicalId: key };
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
}