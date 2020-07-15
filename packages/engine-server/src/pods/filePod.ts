import {
  DNodeRaw,
  NoteData,
  NoteRawProps,
  DNodeUtils,
  Note,
} from "@dendronhq/common-all";
import matter from "gray-matter";
import klaw, { Item } from "klaw";
import _ from "lodash";
import { posix } from "path";
import { URI } from "vscode-uri";
import { BasePod } from "./base";

type DItem = Item & {
  data?: any;
  body?: string;
  entries: DItem[];
};

/**
 * Key is path, value is raw props
 */
type HierarichalDict = { [k: string]: NoteRawProps[] };

function cleanName(name: string, opts?: { isDir?: boolean }): string {
  const cleanOpts = _.defaults(opts, { isDir: false });
  // strip extension
  name = name.replace(/\//g, ".").toLocaleLowerCase();
  name = name.replace(/' '/g, "_");
  if (!cleanOpts.isDir) {
    return posix.parse(name).name;
  }
  return name;
}

export class FilePod extends BasePod {
  files2HierarichalDict(files: DItem[]): HierarichalDict {
    const out: HierarichalDict = {};
    _.forEach(files, (item) => {
      const fname = cleanName(item.path, { isDir: item.stats.isDirectory() });
      const lvl = fname.split(".").length;
      if (!_.has(out, lvl)) {
        out[lvl] = [];
      }
      const stub = item.stats.isDirectory() && _.isEmpty(item.entries);
      const noteProps = DNodeRaw.createProps<NoteData>(
        {
          fname,
          stub,
        },
        { returnExtra: true }
      );
      if (item?.body) {
        noteProps.body = item.body;
      }
      if (item?.data) {
        noteProps.data = item.data;
      }
      if (!_.isEmpty(item.entries)) {
        // TODO
        noteProps.body = item.entries
          .map((ent) => {
            return ent.path;
          })
          .join("\n");
      }

      out[lvl].push(noteProps);
    });
    return out;
  }

  hDict2Notes(hdict: HierarichalDict): Note[] {
    const noteDict: { [k: string]: Note } = {};
    // TODO: currently don't handle stuff attached to root
    hdict[1]
      .filter((n) => !_.isEmpty(n.fname))
      .forEach((props) => {
        const n = new Note({ ...props, parent: null, children: [] });
        noteDict[n.fname] = n;
      });

    let lvl = 2;
    let currRawNodes = hdict[lvl];
    while (!_.isEmpty(currRawNodes)) {
      currRawNodes.forEach((props) => {
        const parentPath = DNodeUtils.dirName(props.fname);
        if (_.has(noteDict, parentPath)) {
          const n = new Note({
            ...props,
            parent: null,
            children: [],
          });
          noteDict[parentPath].addChild(n);
          noteDict[n.fname] = n;
        } else {
          throw Error("missing notes not supported yet");
        }
      });
      lvl += 1;
      currRawNodes = hdict[lvl];
    }
    return _.values(noteDict);
  }

  async import(uri: URI) {
    const items: DItem[] = []; // files, directories, symlinks, etc
    // TODO: filter stuff

    const root = uri.fsPath;
    const mask = uri.fsPath.endsWith("/") ? root.length : root.length + 1;
    // collect all files
    await new Promise((resolve, reject) => {
      klaw(root)
        .on("data", function (item: Item) {
          let out: DItem = { ...item, entries: [] };
          if (item.path.endsWith(".md")) {
            const { data, content } = matter.read(item.path, {});
            out.data = data;
            out.body = content;
          }
          out.path = out.path.slice(mask);
          items.push(out);
        })
        .on("end", () => {
          resolve(items);
        });
    });

    const engineFileDict: { [k: string]: DItem } = {};
    const assetFileDict: { [k: string]: DItem } = {};

    // create map of files
    _.each(items, (v, k) => {
      if (_.some([v.path.endsWith(".md"), v.stats.isDirectory()])) {
        engineFileDict[v.path] = v;
      } else {
        assetFileDict[v.path] = v;
      }
    });

    // add assets
    _.values(assetFileDict).forEach((ent) => {
      const dirname = posix.dirname(ent.path);
      engineFileDict[dirname].entries.push(ent);
    });

    // convert to dot files
    const hDict = this.files2HierarichalDict(_.values(engineFileDict));
    const notes = this.hDict2Notes(hDict);
    // OPTIMIZE: parallilize
    //await this.engine.updateNodes(notes, {parentsAsStubs: false, newNode: true})
    await Promise.all(
      notes.map((n) => {
        return this.engine.write(n, {
          stub: n.stub,
          newNode: true,
          noAddParent: true,
        });
      })
    );
    // add domain nodes
    this.engine.updateNodes(_.filter(notes, { parent: null }), {
      newNode: false,
      parentsAsStubs: false,
    });
    return;
  }
}
