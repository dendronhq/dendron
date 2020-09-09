import {
  DNodeRaw,
  genUUID,
  NoteData,
  NoteRawProps,
  Note,
  DNodeUtils,
} from "@dendronhq/common-all";
import { cleanFileName, readMD } from "@dendronhq/common-server";
import fs from "fs-extra";
import klaw, { Item } from "klaw";
import _ from "lodash";
import path from "path";
import through2 from "through2";
import { URI } from "vscode-uri";
import {
  ImportConfig,
  ImportPodBaseV2,
  ImportPodOpts,
  PodConfigEntry,
} from "../base";

type DItem = Item & {
  data?: any;
  body?: string;
  entries: DItem[];
};

type HierarichalDict = { [k: string]: NoteRawProps[] };

const toMarkdownLink = (assetPath: string, opts?: { name?: string }) => {
  const name = opts?.name ? opts.name : path.parse(assetPath).name;
  return `- [${name}](${assetPath})`;
};

export class FileImportPod extends ImportPodBaseV2 {
  static id: string = "dendron.file.pod";
  static description: string = "import to file";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string",
      },
    ];
  };

  async plant(opts: ImportPodOpts<ImportConfig>): Promise<void> {
    return new Promise(async (resolve) => {
      const cleanConfig = this.cleanConfig(opts.config);
      await this.prepare(opts);
      await this.execute(cleanConfig);
      resolve();
    });
  }

  async _collectItems(root: string): Promise<DItem[]> {
    const items: DItem[] = []; // files, directories, symlinks, etc
    const mask = root.endsWith("/") ? root.length : root.length + 1;
    const excludeFilter = through2.obj(function (item: Item, _enc, next) {
      // check if hidden file
      if (!_.some(item.path.split("/"), (ent) => ent.startsWith("."))) {
        this.push(item);
      }
      next();
    });
    return await new Promise((resolve, _reject) => {
      klaw(root)
        .pipe(excludeFilter)
        // eslint-disable-next-line prefer-arrow-callback
        .on("data", function (item: Item) {
          const out: DItem = { ...item, entries: [] };
          if (item.path.endsWith(".md")) {
            const { data, content } = readMD(item.path);
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
  }

  async _prepareItems(items: DItem[]) {
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
    return { engineFileDict, assetFileDict };
  }

  _files2HierarichalDict(files: DItem[], root: string): HierarichalDict {
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
      const noteProps = DNodeRaw.createProps<NoteData>({
        fname,
        stub,
      });
      if (item?.body) {
        noteProps.body = item.body;
      }
      if (item?.data) {
        noteProps.data = item.data;
      }

      // deal with non-md files
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
          fs.copyFileSync(path.join(root, _item.path), assetPathFull);
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

  async execute(opts: { src: URI }) {
    const ctx = "FilePod";
    const { src } = opts;
    const root = src.fsPath;
    this.L.info({ ctx, root, src, msg: "enter" });
    const items = await this._collectItems(root);
    const { engineFileDict } = await this._prepareItems(items);
    this.L.info({ ctx, root, src, msg: "prepareItems:post" });

    const hDict = this._files2HierarichalDict(_.values(engineFileDict), root);
    const notes = this.hDict2Notes(hDict);
    this.L.info({
      ctx,
      root,
      src,
      dest: this.engine.props.root,
      msg: "hdict2Notes:post",
      notes: notes.length,
    });
    const out = await Promise.all(
      notes.map((n) => {
        return this.engine.write(n, {
          stub: n.stub,
          newNode: true,
          noAddParent: true,
        });
      })
    );
    return out;
  }
}
