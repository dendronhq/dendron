import {
  DNodeUtils,
  DVault,
  genUUIDInsecure,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { cleanFileName, readMD, vault2Path } from "@dendronhq/common-server";
import {
  DendronASTDest,
  MDUtilsV4,
  MDUtilsV5,
  ProcMode,
  RemarkUtils,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import klaw, { Item } from "klaw";
import _ from "lodash";
import path from "path";
import through2 from "through2";
import {
  ExportPod,
  ExportPodPlantOpts,
  ExportPodConfig,
  ImportPod,
  ImportPodConfig,
  ImportPodPlantOpts,
  PublishPod,
  PublishPodPlantOpts,
  PublishPodConfig,
} from "../basev3";
import { JSONSchemaType } from "ajv";
import { PodUtils } from "../utils";

const ID = "dendron.markdown";

export type MarkdownImportPodPlantOpts = ImportPodPlantOpts;

type MarkdownImportPodConfig = ImportPodConfig & {
  noAddUUID?: boolean;
  indexName?: string;
};

export type MarkdownImportPodResp = {
  importedNotes: NoteProps[];
  errors: Item[];
};

type DItem = Item & {
  data?: any;
  body?: string;
  entries: DItem[];
};

type HierarichalDict = { [k: string]: NoteProps[] };

const toMarkdownLink = (assetPath: string, opts?: { name?: string }) => {
  const name = opts?.name ? opts.name : path.parse(assetPath).name;
  return `- [${name}](${assetPath})`;
};

export class MarkdownImportPod extends ImportPod<MarkdownImportPodConfig> {
  static id: string = ID;
  static description: string = "import markdown";

  get config(): JSONSchemaType<MarkdownImportPodConfig> {
    return PodUtils.createImportConfig({
      required: [],
      properties: {
        noAddUUID: {
          description: "Don't add uuid to assets",
          type: "boolean",
          nullable: true,
        },
        indexName: {
          type: "string",
          description:
            "If you have an index file per directory, merge that file with the directory note",
          nullable: true,
        },
      },
    }) as JSONSchemaType<MarkdownImportPodConfig>;
  }

  /**
   * Reads all files
   * @param root
   * @returns dictionary of {@link DItem[]}
   */
  async _collectItems(
    root: string
  ): Promise<{ items: DItem[]; errors: DItem[] }> {
    const ctx = "MarkdownPod._collectItems";
    const items: DItem[] = []; // files, directories, symlinks, etc
    const errors: DItem[] = []; // import items that resulted in errors
    const mask = root.endsWith(path.sep) ? root.length : root.length + 1;
    const excludeFilter = through2.obj(function (item: Item, _enc, _next) {
      // check if hidden file
      if (!_.some(item.path.split(path.sep), (ent) => ent.startsWith("."))) {
        this.push(item);
      }
      _next();
    });
    return new Promise((resolve, _reject) => {
      klaw(root)
        .pipe(excludeFilter)
        // eslint-disable-next-line prefer-arrow-callback
        .on("data", (item: Item) => {
          const out: DItem = { ...item, entries: [] };
          let isError = false;
          if (item.path.endsWith(".md")) {
            try {
              const { data, content } = readMD(item.path);
              out.data = data;
              out.body = content;
            } catch (err) {
              this.L.error({ ctx, error: err });
              isError = true;
            }
          }
          if (!isError) {
            out.path = out.path.slice(mask);
            items.push(out);
          } else {
            errors.push(out);
          }
        })
        .on("end", () => {
          this.L.info({ msg: "done collecting items" });
          resolve({ items, errors });
        });
    });
  }

  /**
   * Classify {@link DItem} into notes and assets. Turns directories into notes
   * @param items
   * @returns
   */
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
    config: MarkdownImportPodConfig;
  }) {
    const { files, src, vault, wsRoot, config } = opts;
    const out: HierarichalDict = {};
    const assetHashMap = new Map<string, string>();
    _.forEach(files, (item) => {
      const fname = cleanFileName(item.path, {
        isDir: item.stats.isDirectory(),
      });
      const lvl = fname.split(".").length;
      if (!_.has(out, lvl)) {
        out[lvl] = [];
      }
      const isDir = item.stats.isDirectory();
      const stub = item.stats.isDirectory() && _.isEmpty(item.entries);
      const noteProps = NoteUtils.create({
        fname,
        stub,
        vault,
        custom: { isDir },
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
        const vpath = vault2Path({ vault, wsRoot });
        const assetDir = path.join(vpath, assetDirName);
        fs.ensureDirSync(assetDir);
        const mdLinks: string[] = [];
        item.entries.map((_item) => {
          const { ext, name } = path.parse(_item.path);
          let assetBaseNew: string;
          if (config.noAddUUID) {
            assetBaseNew = `${cleanFileName(name)}${ext}`;
          } else {
            const uuid = genUUIDInsecure();
            assetBaseNew = `${cleanFileName(name)}-${uuid}${ext}`;
          }
          const assetPathFull = path.join(assetDir, assetBaseNew);
          const assetPathRel = path
            .join(assetDirName, assetBaseNew)
            .replace(/[\\]/g, "/");
          const key = _.replace(_item.path as string, /[\\|/|.]/g, "");
          assetHashMap.set(key, `/${assetPathRel}`);

          fs.copyFileSync(path.join(src, _item.path), assetPathFull);
          mdLinks.push(
            toMarkdownLink(`/${assetPathRel}`, { name: `${name}${ext}` })
          );
        });
        noteProps.body = `## Imported Assets\n${mdLinks.join("\n")}`;
      }

      out[lvl].push(noteProps);
    });
    return { hDict: out, assetHashMap };
  }

  hDict2Notes(
    hdict: HierarichalDict,
    config: MarkdownImportPodConfig
  ): NoteProps[] {
    const noteDict: { [k: string]: NoteProps } = {};
    // TODO: currently don't handle stuff attached to root
    hdict[1]
      .filter((n) => !_.isEmpty(n.fname))
      .forEach((props) => {
        const n = NoteUtils.create({ ...props });
        noteDict[n.fname] = n;
      });

    let lvl = 2;
    let currRawNodes = hdict[lvl];
    while (!_.isEmpty(currRawNodes)) {
      currRawNodes.forEach((props) => {
        const parentPath = DNodeUtils.dirName(props.fname);
        if (
          noteDict[parentPath].custom.isDir &&
          DNodeUtils.basename(props.fname.toLowerCase(), true) ===
            config.indexName?.toLowerCase()
        ) {
          const n = noteDict[parentPath];
          n.body = [props.body, "***", n.body].join("\n");
          n.custom = props.custom;
        } else if (_.has(noteDict, parentPath)) {
          const n = NoteUtils.create({ ...props });
          DNodeUtils.addChild(noteDict[parentPath], n);
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

  async plant(
    opts: MarkdownImportPodPlantOpts
  ): Promise<MarkdownImportPodResp> {
    const ctx = "MarkdownPod";
    const { wsRoot, engine, src, vault, config } = opts;
    this.L.info({ ctx, wsRoot, src: src.fsPath, msg: "enter" });
    // get all items
    const { items, errors } = await this._collectItems(src.fsPath);
    this.L.info({ ctx, wsRoot, numItems: _.size(items), msg: "collectItems" });
    const { engineFileDict } = await this._prepareItems(items);
    const { hDict, assetHashMap } = this._files2HierarichalDict({
      files: _.values(engineFileDict),
      src: src.fsPath,
      vault,
      wsRoot,
      config,
    });
    const notes = this.hDict2Notes(hDict, config);
    const notesClean = await Promise.all(
      notes
        .filter((n) => !n.stub)
        .map(async (n) => {
          const cBody = await MDUtilsV5.procRemarkFull(
            {
              fname: n.fname,
              engine,
              dest: DendronASTDest.MD_DENDRON,
              vault: n.vault,
            },
            { mode: ProcMode.IMPORT }
          )
            .use(RemarkUtils.convertLinksToDotNotation(n, []))
            .use(RemarkUtils.convertAssetReferences(n, assetHashMap, []))
            .process(n.body);
          n.body = cBody.toString();
          if (config.frontmatter) {
            n.custom = _.merge(n.custom, config.frontmatter);
          }
          if (config.fnameAsId) {
            n.id = n.fname;
          }
          return n;
        })
    );
    await engine.bulkAddNotes({ notes: notesClean });
    this.L.info({
      ctx,
      wsRoot,
      src: src.fsPath,
      msg: `${_.size(notesClean)} notes imported`,
    });
    return { importedNotes: notesClean, errors };
  }
}

type MarkdownPublishPodConfig = PublishPodConfig & {
  wikiLinkToURL?: boolean;
};

export class MarkdownPublishPod extends PublishPod<MarkdownPublishPodConfig> {
  static id: string = ID;
  static description: string = "publish markdown";

  get config(): JSONSchemaType<MarkdownPublishPodConfig> {
    return PodUtils.createPublishConfig({
      required: [],
      properties: {
        wikiLinkToURL: {
          type: "boolean",
          description: "convert all the wikilinks to URL",
          default: "false",
          nullable: true,
        },
      },
    }) as JSONSchemaType<MarkdownPublishPodConfig>;
  }

  async plant(opts: PublishPodPlantOpts) {
    const { engine, note, config, dendronConfig } = opts;
    const { wikiLinkToURL = false } = config;
    let remark = MDUtilsV4.procFull({
      dest: DendronASTDest.MD_REGULAR,
      config: {
        ...engine.config,
        usePrettyRefs: false,
      },
      engine,
      fname: note.fname,
      vault: note.vault,
      shouldApplyPublishRules: false,
    });
    if (wikiLinkToURL && !_.isUndefined(dendronConfig)) {
      remark = remark.use(
        RemarkUtils.convertWikiLinkToNoteUrl(note, [], engine, dendronConfig)
      );
    } else {
      remark = remark.use(RemarkUtils.convertLinksFromDotNotation(note, []));
    }
    const out = remark.processSync(note.body).toString();
    return _.trim(out);
  }
}

/**
 *
 */
export class MarkdownExportPod extends ExportPod {
  static id: string = ID;
  static description: string = "export notes as markdown";

  get config(): JSONSchemaType<ExportPodConfig> {
    return PodUtils.createExportConfig({
      required: [],
      properties: {},
    }) as JSONSchemaType<ExportPodConfig>;
  }

  async plant(opts: ExportPodPlantOpts) {
    const ctx = "MarkdownExportPod:plant";
    const { dest, notes, vaults, wsRoot } = opts;
    // verify dest exist
    const podDstPath = dest.fsPath;
    fs.ensureDirSync(path.dirname(podDstPath));
    const mdPublishPod = new MarkdownPublishPod();

    this.L.info({ ctx, msg: "pre:iterate_notes" });
    await Promise.all(
      notes.map(async (note) => {
        const body = await mdPublishPod.plant({ ...opts, note });
        const hpath = dot2Slash(note.fname) + ".md";
        const vname = VaultUtils.getName(note.vault);
        const fpath = path.join(podDstPath, vname, hpath);
        // fpath = _.isEmpty(note.children)
        //   ? fpath + ".md"
        //   : path.join(fpath, "index.md");
        this.L.info({ ctx, fpath, msg: "pre:write" });
        await fs.ensureDir(path.dirname(fpath));
        return fs.writeFile(fpath, body);
      })
    );

    // Export Assets
    await Promise.all(
      vaults.map(async (vault) => {
        //TODO: Avoid hardcoding of assets directory, or else extract to global const
        const destPath = path.join(
          dest.fsPath,
          VaultUtils.getRelPath(vault),
          "assets"
        );
        const srcPath = path.join(
          wsRoot,
          VaultUtils.getRelPath(vault),
          "assets"
        );
        if (fs.pathExistsSync(srcPath)) {
          await fs.copy(srcPath, destPath);
        }
      })
    );
    return { notes };
  }
}

function dot2Slash(fname: string) {
  const hierarchy = fname.split(".");
  return path.join(...hierarchy);
}
