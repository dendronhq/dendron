import {
  BasePodExecuteOpts,
  DNodeUtilsV2,
  DVault,
  genUUID,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { cleanFileName, readMD, vault2Path } from "@dendronhq/common-server";
import {
  DendronASTDest,
  MDUtilsV4,
  ParserUtilsV2,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import klaw, { Item } from "klaw";
import _ from "lodash";
import path from "path";
import through2 from "through2";
import {
  ImportPod,
  ImportPodCleanConfig,
  ImportPodCleanOpts,
  ImportPodPlantOpts,
  ImportPodRawConfig,
  PublishPod,
  PublishPodCleanConfig,
} from "../basev2";

const ID = "dendron.markdown";

export type MarkdownImportPodRawConfig = ImportPodRawConfig & {
  concatenate: boolean;
  destName?: string;
};
export type MarkdownImportPodCleanConfig = ImportPodCleanConfig & {
  concatenate: boolean;
  destName?: string;
};

export type MarkdownImportPodPlantOpts = ImportPodPlantOpts<
  MarkdownImportPodCleanConfig
>;

export type MarkdownImportPodResp = any[];

type DItem = Item & {
  data?: any;
  body?: string;
  entries: DItem[];
};

type HierarichalDict = { [k: string]: NotePropsV2[] };

const toMarkdownLink = (assetPath: string, opts?: { name?: string }) => {
  const name = opts?.name ? opts.name : path.parse(assetPath).name;
  return `- [${name}](${assetPath})`;
};

export class MarkdownImportPod extends ImportPod<
  MarkdownImportPodRawConfig,
  MarkdownImportPodCleanConfig
> {
  static id: string = ID;
  static description: string = "import markdown";

  async _collectItems(root: string): Promise<DItem[]> {
    const items: DItem[] = []; // files, directories, symlinks, etc
    const mask = root.endsWith(path.sep) ? root.length : root.length + 1;
    const excludeFilter = through2.obj(function (item: Item, _enc, next) {
      // check if hidden file
      if (!_.some(item.path.split(path.sep), (ent) => ent.startsWith("."))) {
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
      let dirname = path.dirname(ent.path);
      // root directories
      if (dirname === ".") {
        dirname = "";
      }
      engineFileDict[dirname].entries.push(ent);
    });
    return { engineFileDict, assetFileDict };
  }

  _files2HierarichalDict(opts: {
    files: DItem[];
    src: string;
    vault: DVault;
    wsRoot: string;
  }): HierarichalDict {
    const { files, src, vault, wsRoot } = opts;
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
      const noteProps = NoteUtilsV2.create({ fname, stub, vault });
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
        const vpath = vault2Path({ vault, wsRoot });
        const assetDir = path.join(vpath, assetDirName);
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
          fs.copyFileSync(path.join(src, _item.path), assetPathFull);
          mdLinks.push(toMarkdownLink(assetPathRel, { name: `${name}${ext}` }));
        });

        // TODO
        noteProps.body = `# Imported Assets\n${mdLinks.join("\n")}`;
      }

      out[lvl].push(noteProps);
    });
    return out;
  }

  hDict2Notes(hdict: HierarichalDict): NotePropsV2[] {
    const noteDict: { [k: string]: NotePropsV2 } = {};
    // TODO: currently don't handle stuff attached to root
    hdict[1]
      .filter((n) => !_.isEmpty(n.fname))
      .forEach((props) => {
        const n = NoteUtilsV2.create({ ...props });
        noteDict[n.fname] = n;
      });

    let lvl = 2;
    let currRawNodes = hdict[lvl];
    while (!_.isEmpty(currRawNodes)) {
      currRawNodes.forEach((props) => {
        const parentPath = DNodeUtilsV2.dirName(props.fname);
        if (_.has(noteDict, parentPath)) {
          const n = NoteUtilsV2.create({ ...props });
          DNodeUtilsV2.addChild(noteDict[parentPath], n);
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

  async clean(opts: ImportPodCleanOpts<MarkdownImportPodRawConfig>) {
    return opts.config;
  }

  async plant(
    opts: MarkdownImportPodPlantOpts
  ): Promise<MarkdownImportPodResp> {
    const ctx = "FilePod";
    const { wsRoot, engine } = opts;
    const { src } = opts.config;
    this.L.info({ ctx, wsRoot, src, msg: "enter" });
    // get all items
    const items = await this._collectItems(src.fsPath);
    const { engineFileDict } = await this._prepareItems(items);
    const mainVault = engine.vaultsv3[0];
    const hDict = this._files2HierarichalDict({
      files: _.values(engineFileDict),
      src: src.fsPath,
      vault: mainVault,
      wsRoot,
    });
    const notes = this.hDict2Notes(hDict);
    const out = await Promise.all(
      notes
        .filter((n) => !n.stub)
        .map(async (n) => {
          const cBody = await ParserUtilsV2.getRemark({
            dendronLinksOpts: { convertObsidianLinks: true },
          }).process(n.body);
          n.body = cBody.toString();
          return engine.writeNote(n, {
            newNode: true,
            noAddParent: true,
          });
        })
    );
    return out;
  }
}

export class MarkdownPublishPod extends PublishPod {
  static id: string = ID;
  static description: string = "publish markdown";

  async plant(opts: BasePodExecuteOpts<PublishPodCleanConfig>): Promise<any> {
    const { config, engine } = opts;
    const { fname, vault } = config;
    const note = NoteUtilsV2.getNoteByFnameV4({
      fname,
      notes: engine.notes,
      vault,
    })!;
    const remark = MDUtilsV4.procFull({
      dest: DendronASTDest.MD_DENDRON,
      engine,
      fname: note.fname,
      vault,
    });
    const out = remark.processSync(note.body).toString();
    return _.trim(out);
  }
}
