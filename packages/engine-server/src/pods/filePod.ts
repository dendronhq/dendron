/* eslint-disable func-names */
import {
  DNodeRaw,
  DNodeUtils,
  genUUID,
  Note,
  NoteData,
  NoteRawProps
} from "@dendronhq/common-all";
import { cleanFileName } from "@dendronhq/common-server";
import fs from "fs-extra";
import matter from "gray-matter";
import klaw, { Item } from "klaw";
import _ from "lodash";
import path from "path";
import through2 from "through2";
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

const toMarkdownLink = (assetPath: string, opts?: { name?: string }) => {
  const name = opts?.name ? opts.name : path.parse(assetPath).name;
  return `- [${name}](${assetPath})`;
};

export class FilePod extends BasePod {
  /**
   * Return list of note props keyed by level of hierarchy
   * @param files
   */
  files2HierarichalDict(files: DItem[]): HierarichalDict {
    const out: HierarichalDict = {};
    _.forEach(files, (item) => {
      const fname = cleanFileName(item.path, {
        isDir: item.stats.isDirectory(),
      });
      const lvl = fname.split(".").length;
      if (!_.has(out, lvl)) {
        out[lvl] = [];
      }
      const stub = item.stats.isDirectory() && _.isEmpty(item.entries);
      const noteProps = DNodeRaw.createProps<NoteData>(
        {
          fname,
          stub,
        }
      );
      if (item?.body) {
        noteProps.body = item.body;
      }
      if (item?.data) {
        noteProps.data = item.data;
      }
      if (!_.isEmpty(item.entries)) {
        // move entries over
        // TODO: don't hardcode assets
        const assetDirName = "assets";
        const assetDir = path.join(this.engine.props.root, assetDirName);
        fs.ensureDirSync(assetDir);
        const mdLinks: string[] = [];
        item.entries.map((_item) => {
          const uuid = genUUID();
          const { ext, name } = path.parse(_item.path);
          // const { ext, name } = path.parse(cleanFileName(_item.path));
          const assetBaseNew = `${cleanFileName(name)}-${uuid}${ext}`;
          const assetPathFull = path.join(assetDir, assetBaseNew);
          const assetPathRel = path.join(assetDirName, assetBaseNew);
          // TODO: make sure to append uuid
          fs.copyFileSync(
            path.join(this.root.fsPath, _item.path),
            assetPathFull
          );
          mdLinks.push(toMarkdownLink(assetPathRel, { name: `${name}${ext}` }));
        });

        // TODO
        noteProps.body = `# Imported Assets\n${mdLinks.join("\n")}`;
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

  async import() {
    const items: DItem[] = []; // files, directories, symlinks, etc
    const uri = this.root;
    const root = uri.fsPath;
    const mask = uri.fsPath.endsWith("/") ? root.length : root.length + 1;

    const excludeFilter = through2.obj(function (item: Item, _enc, next) {
      // check if hidden file
      if (!_.some(item.path.split("/"), (ent) => ent.startsWith("."))) {
        this.push(item);
      }
      next();
    });
    // collect all files
    // TODO: catch errors
    await new Promise((resolve, _reject) => {
      klaw(root)
        .pipe(excludeFilter)
        // eslint-disable-next-line prefer-arrow-callback
        .on("data", function (item: Item) {
          const out: DItem = { ...item, entries: [] };
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
    _.each(items, (v, _k) => {
      if (_.some([v.path.endsWith(".md"), v.stats.isDirectory()])) {
        engineFileDict[v.path] = v;
      } else {
        assetFileDict[v.path] = v;
      }
    });

    // add assets
    _.values(assetFileDict).forEach((ent) => {
      const dirname = path.dirname(ent.path);
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
