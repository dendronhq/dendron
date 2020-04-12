import express, { Application } from "express";
import DB from "./db";

export default class Server {
  private app: Application
  private db: DB

  constructor() {
    this.app = express()
    this.db = new DB();

    this.app.get('/*', async (req, res) => res.json(this.query(req.path.slice(1))));
  }

  public query(query: string): any {
    let regexes = this.query_to_regexes(query);
    let combined_regex = RegExp(
      "(?=.*" + regexes.join(")(?=.*") + ")(?:(?:.*" + regexes.join("$)|(?:.*") + "$))"
    ); // intersection of regexes
    console.log(combined_regex);
    return this.to_tree(this.update_path(this.db.query(combined_regex), regexes));
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
  private update_path(results: string[][], regexes: string[]): string[][] {
    return results.map(result => [regexes.map(r => result[0].match(r)).join('/'), result[1]]);
  }

  private to_tree(results: string[][], strip_schema = true) {
    let insert_value = (tree: any, key: string[], value: string, key_position: number) => {
      console.log(tree, key, value, key_position);
      if (key_position >= key.length) { tree[""] = value; return; }
      let local_key = strip_schema ? key[key_position].split("=").pop() || "" : key[key_position];
      console.log(tree);
      if (!tree.hasOwnProperty(local_key)) { tree[local_key] = {} }
      console.log(tree);
      insert_value(tree[local_key], key, value, key_position + 1);
      console.log(tree);
    }
    let out = {};
    for (let result of results) {
      console.log("here");
      console.log(out);
      insert_value(out, result[0].split("/"), result[1], 0);
      console.log(out);
    }
    return out;
  }

  public listen() {
    this.app.listen(parseInt(process.env.PORT || "3000"));
  }
}