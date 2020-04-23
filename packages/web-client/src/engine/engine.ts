import { Node, NodeDict } from "../common/types"
// Any datastore that can store regex searchable paths can implement Storage
export interface Storage<TData> {
  query: (regex: RegExp) => NodeDict<TData>;
  write: (rows: NodeDict<TData>) => boolean;
}

// A formatter takes a bunch of nodes and converts them to some other representation
export interface Formatter<TData, T> {
  format: (rows: NodeDict<TData>) => T
}

export default class Engine<TData> {
  private storage: Storage<TData>;

  constructor(storage: Storage<TData>) {
    this.storage = storage
  }

  public query(query: string): NodeDict<TData> {
    let regexes = this.query_to_regexes(query);
    let combined_regex = RegExp(
      "(?=.*" + regexes.join(")(?=.*") + ")(?:(?:.*" + regexes.join("$)|(?:.*") + "$))"
    ); // intersection of regexes
    console.log(combined_regex);
    return this.update_path(this.storage.query(combined_regex), regexes);
  }

  // The basic strategy is to create groups of positionally-matched values,
  // each initiated by an explicitly matched value. This means that each explicit match
  // sets the position for subsequent positional matches.
  private query_to_regexes(query: string): string[] {
    let filters = query.split('/');
    let filter_groups: string[][] = [];
    if (!filters[0].includes("=")) filter_groups.push([]); // create first group
    for (let filter of filters) {
      if (filter.includes("=")) { // explicit match (/foo=bar/ and /foo=/)
        filter_groups.push([]);
        filter_groups[filter_groups.length - 1].push(
          filter + (filter.indexOf("=") == filter.length - 1 ? "[^/]*" : "")
        );
      } else { // positional match (/*/, /**/, and /bar/)
        filter_groups[filter_groups.length - 1].push(
          filter.includes("*") ? (filter.includes("**") ? ".*" : "[^/]*") : ("[^/]*\\=" + filter)
        );
      }
    }
    if (!filters[0].includes("=")) filter_groups[0][0] = "^" + filter_groups[0][0]; // start at top
    return filter_groups.map(group => group.join('/'));
  }

  // puts the returned path into the requested order, and fills in all missing information
  private update_path(results: NodeDict<TData>, regexes: string[]): NodeDict<TData> {
    let out: NodeDict<TData> = {};
    for (let logicalId in results) {
      out[regexes.map(r => logicalId.match(r)).join('/')] = results[logicalId];
    }
    return out;
  }
}