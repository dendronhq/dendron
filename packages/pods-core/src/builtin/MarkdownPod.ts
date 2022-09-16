import {
  DNodeUtils,
  DVault,
  FOLDERS,
  genUUIDInsecure,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  cleanFileName,
  DConfig,
  readMD,
  vault2Path,
} from "@dendronhq/common-server";
import {
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  getParsingDependencyDicts,
  Image,
  Link,
  MDUtilsV5,
  RemarkUtils,
  selectAll,
  WikiLinkNoteV4,
} from "@dendronhq/unified";
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
  importFrontmatter?: boolean;
  frontmatterMapping?: { [key: string]: any };
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
        importFrontmatter: {
          description:
            "Import note metadata. In case of any conflicts, the conflicting fields are prefixed with _import",
          type: "boolean",
          default: true,
          nullable: true,
        },
        frontmatterMapping: {
          description:
            "An optional set of variable mappings, with the key being the variable name in the import source and the value being the resulting variable name in Dendron. See https://wiki.dendron.so/notes/f23a6290-2dec-45dc-b616-c218ee53db6b.html for examples.",
          type: "object",
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
  async buildFileDirAssetDicts(items: DItem[]) {
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

  /** Collects all notes and copies assets in the given files/folders, and creates asset summary notes.
   *
   * @returns The created notes and a map of asset paths to imported paths.
   */
  private async collectNotesCopyAssets(opts: {
    files: DItem[];
    src: string;
    vault: DVault;
    wsRoot: string;
    config: MarkdownImportPodConfig;
  }) {
    const { files, src, vault, wsRoot, config } = opts;
    const out: HierarichalDict = {};
    const assetMap = new Map<string, string>();
    // collect the assets in concurrently
    await Promise.all(
      files.map(async (item) => {
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
          await fs.ensureDir(assetDir);
          const mdLinks: string[] = [];
          await Promise.all(
            item.entries.map(async (subItem) => {
              const { ext, name } = path.parse(subItem.path);
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
              const key = MarkdownImportPod.cleanAssetPath(subItem.path);
              assetMap.set(key, `/${assetPathRel}`);

              await fs.copyFile(path.join(src, subItem.path), assetPathFull);
              mdLinks.push(
                toMarkdownLink(`/${assetPathRel}`, { name: `${name}${ext}` })
              );
            })
          );
          noteProps.body = `## Imported Assets\n${mdLinks.join("\n")}`;
        }

        out[lvl].push(noteProps);
      })
    );
    return { hDict: out, assetMap };
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

  /** Cleans up a link following Dendron best practices, converting slashes to dots and spaces to dashes. */
  private static cleanLinkValue(link: WikiLinkNoteV4): string {
    return link.value.toLowerCase().replace(/[\\/]/g, ".").replace(/\s/g, "-");
  }

  static async updateLinks({
    note,
    siblingNotes,
    tree,
    proc,
  }: {
    note: NoteProps;
    siblingNotes: NoteProps[];
    tree: DendronASTNode;
    proc: ReturnType<typeof MDUtilsV5["procRemarkFull"]>;
  }) {
    const linkPrefix = note.fname.substring(0, note.fname.lastIndexOf(".") + 1);
    const lines = note.body.split("\n");

    const links: WikiLinkNoteV4[] = selectAll(
      DendronASTTypes.WIKI_LINK,
      tree
    ) as WikiLinkNoteV4[];

    links.forEach((link) => {
      const prevValue = link.value;
      const linkValue = this.cleanLinkValue(link);
      const newValue = linkPrefix.concat(linkValue);
      link.value =
        siblingNotes.filter(
          (note) => note.fname.toLowerCase() === newValue.toLowerCase()
        ).length > 0
          ? newValue
          : linkValue;
      // If link has the default alias, update that too to avoid writing a stale alias
      if (prevValue === link.data.alias) {
        link.data.alias = link.value;
      }

      const { start, end } = link.position!;
      const line = lines[start.line - 1];

      lines[start.line - 1] = [
        line.slice(undefined, start.column - 1),
        proc.stringify(link),
        line.slice(end.column - 1, undefined),
      ].join("");
    });
    note.body = lines.join("\n");
  }

  static cleanAssetPath(path: string): string {
    return path.toLowerCase().replace(/[\\|/.]/g, "");
  }

  /** Gets all links to assets. */
  static async updateAssetLinks({
    note,
    tree,
    assetMap,
    proc,
  }: {
    note: NoteProps;
    tree: DendronASTNode;
    assetMap: Map<string, string>;
    proc: ReturnType<typeof MDUtilsV5["procRemarkFull"]>;
  }) {
    const assetReferences = [
      ...selectAll(DendronASTTypes.IMAGE, tree),
      ...selectAll(DendronASTTypes.LINK, tree),
    ] as unknown as (Image | Link)[];
    const lines = note.body.split("\n");

    await Promise.all(
      assetReferences.map(async (asset) => {
        const key = this.cleanAssetPath(asset.url);
        let url: string | undefined;

        // Try finding what the new URL should be
        const assetUrl = assetMap.get(key);
        if (assetUrl) {
          url = assetUrl;
        } else {
          // for relative links
          const prefix = _.replace(
            note.fname.substring(0, note.fname.lastIndexOf(".")),
            /[\\|/.]/g,
            ""
          );
          const value = assetMap.get(prefix.concat(key));
          // @ts-ignore
          if (value) url = value;
        }

        // If we did manage to find it, then update this link
        if (url !== undefined && url !== "") {
          asset.url = url;
          const { start, end } = asset.position!;
          const line = lines[start.line - 1];
          lines[start.line - 1] = [
            line.slice(undefined, start.column - 1),
            proc.stringify(asset),
            line.slice(end.column - 1, undefined),
          ].join("");
        }
      })
    );

    note.body = lines.join("\n");
  }

  /**
   * Method to import frontmatter of note. Imports all FM in note.custom,
   * In case of conflict in keys of dendron and imported note, checks frontmatterMapping provided in the
   * config. If not provided, concatenates '_imported' in imported FM keys.
   */
  handleFrontmatter(opts: {
    frontmatterMapping?: { [key: string]: any };
    note: NoteProps;
  }) {
    const { note, frontmatterMapping } = opts;

    // map through all imported note's metadata
    Object.keys(note.data).map((val) => {
      if (_.has(note, val)) {
        //check for mapping in frontmatterMapping
        if (frontmatterMapping && _.has(frontmatterMapping, val)) {
          note.data = {
            ...note.data,
            [frontmatterMapping[val]]: note.data[val],
          };
        } else {
          // append _imported in imported metadata keys
          note.data = {
            ...note.data,
            [`${val}_imported`]: note.data[val],
          };
        }
        delete note.data[val];
      }
    });
    note.custom = _.merge(note.custom, note.data);
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
    const { engineFileDict } = await this.buildFileDirAssetDicts(items);
    const { hDict, assetMap } = await this.collectNotesCopyAssets({
      files: _.values(engineFileDict),
      src: src.fsPath,
      vault,
      wsRoot,
      config,
    });
    const notes = this.hDict2Notes(hDict, config);
    const { importFrontmatter = true, frontmatterMapping } =
      config as MarkdownImportPodConfig;
    const notesClean = await Promise.all(
      notes
        .filter((note) => !note.stub)
        .map(async (note) => {
          //notes in same level with note
          const noteDirlevel = note.fname.split(".").length;
          const siblingNotes = hDict[noteDirlevel];
          const proc = MDUtilsV5.procRemarkFull({
            noteToRender: note,
            fname: note.fname,
            vault: note.vault,
            vaults: engine.vaults,
            dest: DendronASTDest.MD_DENDRON,
            config: DConfig.readConfigSync(engine.wsRoot),
            wsRoot: engine.wsRoot,
          });

          const tree = proc.parse(note.body) as DendronASTNode;
          await MarkdownImportPod.updateLinks({
            note,
            tree,
            siblingNotes,
            proc,
          });
          await MarkdownImportPod.updateAssetLinks({
            note,
            tree,
            assetMap,
            proc,
          });
          if (config.frontmatter) {
            note.custom = _.merge(note.custom, config.frontmatter);
          }
          if (config.fnameAsId) {
            note.id = note.fname;
          }
          if (importFrontmatter) {
            this.handleFrontmatter({ note, frontmatterMapping });
          }
          return note;
        })
    );
    await engine.bulkWriteNotes({ notes: notesClean, skipMetadata: true });
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

    const noteCacheForRenderDict = await getParsingDependencyDicts(
      note,
      engine,
      config,
      engine.vaults
    );

    let remark = MDUtilsV5.procRemarkFull({
      noteToRender: note,
      noteCacheForRenderDict,
      dest: DendronASTDest.MD_REGULAR,
      config: {
        ...DConfig.readConfigSync(engine.wsRoot),
        usePrettyRefs: false,
      },
      fname: note.fname,
      vault: note.vault,
      vaults: engine.vaults,
      wsRoot: engine.wsRoot,
    });
    if (wikiLinkToURL && !_.isUndefined(dendronConfig)) {
      remark = remark.use(
        RemarkUtils.convertWikiLinkToNoteUrl(note, [], engine, dendronConfig)
      );
    } else {
      remark = remark.use(RemarkUtils.convertLinksFromDotNotation(note, []));
    }
    const out = (await remark.process(note.body)).toString();
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
        const destPath = path.join(
          dest.fsPath,
          VaultUtils.getRelPath(vault),
          FOLDERS.ASSETS
        );
        const srcPath = path.join(
          wsRoot,
          VaultUtils.getRelPath(vault),
          FOLDERS.ASSETS
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
