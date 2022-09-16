import {
  ConfigUtils,
  DendronCompositeError,
  DendronError,
  DEngineClient,
  DVault,
  FOLDERS,
  IDendronError,
  IntermediateDendronConfig,
  IProgress,
  IProgressStep,
  NoteProps,
  ResponseUtil,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createDisposableLogger,
  DConfig,
  getDurationMilliseconds,
} from "@dendronhq/common-server";
import {
  DendronASTDest,
  getParsingDependencyDicts,
  MDUtilsV5,
  RemarkUtils,
} from "@dendronhq/unified";
import { JSONSchemaType } from "ajv";
import { mapLimit } from "async";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { PodExportScope } from "../..";
import {
  ConfigFileUtils,
  ExportPodV2,
  MarkdownV2PodConfig,
  RunnableMarkdownV2PodConfig,
} from "../../..";

/**
 * Markdown Export Pod (V2 - for compatibility with Pod V2 workflow).
 */

export type MarkdownExportReturnType = RespV2<{
  exportedNotes?: string | NoteProps[];
}>;
export class MarkdownExportPodV2
  implements ExportPodV2<MarkdownExportReturnType>
{
  private _config: RunnableMarkdownV2PodConfig;
  private _engine: DEngineClient;
  private _dendronConfig: IntermediateDendronConfig;

  constructor({
    podConfig,
    engine,
    dendronConfig,
  }: {
    podConfig: RunnableMarkdownV2PodConfig;
    engine: DEngineClient;
    dendronConfig: IntermediateDendronConfig;
  }) {
    this._config = podConfig;
    this._engine = engine;
    this._dendronConfig = dendronConfig;
  }

  async exportNotes(
    notes: NoteProps[],
    progress?: IProgress<IProgressStep>
  ): Promise<MarkdownExportReturnType> {
    const { logger, dispose } = createDisposableLogger("MarkdownExportV2");
    const { destination, exportScope } = this._config;
    const ctx = "exportNotes";
    const config = { ...DConfig.readConfigSync(this._engine.wsRoot) };

    if (destination === "clipboard") {
      const exportedNotes = await this.renderNote({ note: notes[0], config });
      return ResponseUtil.createHappyResponse({
        data: {
          exportedNotes,
        },
      });
    }

    try {
      fs.ensureDirSync(path.dirname(destination));
    } catch (err) {
      return {
        data: {},
        error: err as DendronError,
      };
    }
    logger.debug({ msg: "pre:iterate_notes" });
    const errors: IDendronError[] = [];
    const total = notes.length;
    progress?.report({ message: `Exporting ${total} notes...` });
    let acc = 0;
    const minStep = Math.max(100, total / 20.0);

    // looks like one is ideal, doing this in parallel slows down this process
    // eg. with limit of 1, latency is 30ms, with limit of 2, latency is 600ms
    const result = await mapLimit(notes, 1, async (note: NoteProps) => {
      try {
        const startActivate = process.hrtime();
        const body = await this.renderNote({ note, config });
        const hpath = this.dot2Slash(note.fname) + ".md";
        const vname = VaultUtils.getName(note.vault);
        const fpath = path.join(destination, vname, hpath);
        logger.debug({ fpath, msg: "pre:write" });
        await fs.ensureDir(path.dirname(fpath));
        await fs.writeFile(fpath, body);
        if (progress) {
          acc += 1;
          if (acc / minStep === 0) {
            progress.report({ increment: acc / total });
          }
        }
        const duration = getDurationMilliseconds(startActivate);
        logger.info({ ctx, duration, id: fpath });
        return note;
      } catch (err) {
        errors.push(err as DendronError);
        return;
      }
      // 100
      // 10 = 1s
      // 100 = 10s
      // 1k = 100s
      // 10k = 1ks, 16min
    });
    // const result = await parallelLimit(
    //   notes.map(async (note) => {
    //     try {
    //       const body = await this.renderNote(note);
    //       const hpath = this.dot2Slash(note.fname) + ".md";
    //       const vname = VaultUtils.getName(note.vault);
    //       const fpath = path.join(destination, vname, hpath);
    //       logger.debug({ fpath, msg: "pre:write" });
    //       await fs.ensureDir(path.dirname(fpath));
    //       await fs.writeFile(fpath, body);
    //       if (progress) {
    //         progress.report({ increment: 1 });
    //       }
    //       return note;
    //     } catch (err) {
    //       errors.push(err as DendronError);
    //       return;
    //     }
    //   }),
    //   50
    // );

    // Export Assets for vault and workspace exportScope
    const vaultsArray: DVault[] = [];
    switch (exportScope) {
      case PodExportScope.Vault: {
        vaultsArray.push(notes[0].vault);
        break;
      }
      case PodExportScope.Workspace: {
        vaultsArray.push(...this._engine.vaults);
        break;
      }
      // no default
    }
    await Promise.all(
      vaultsArray.map(async (vault) => {
        const destPath = path.join(
          destination,
          VaultUtils.getRelPath(vault),
          FOLDERS.ASSETS
        );
        const srcPath = path.join(
          this._engine.wsRoot,
          VaultUtils.getRelPath(vault),
          FOLDERS.ASSETS
        );
        if (fs.pathExistsSync(srcPath)) {
          await fs.copy(srcPath, destPath);
        }
      })
    ).catch((err) => {
      errors.push(err as DendronError);
    });
    dispose();

    const exportedNotes = result.filter(
      (ent): ent is NoteProps => !_.isUndefined(ent)
    );
    if (errors.length > 0) {
      return {
        data: {
          exportedNotes,
        },
        error: new DendronCompositeError(errors),
      };
    } else {
      return ResponseUtil.createHappyResponse({
        data: {
          exportedNotes,
        },
      });
    }
  }

  /**
   * TODO: OPTIMIZE
   * Currently, this can take anywhere between 30ms to 1300ms to execute on one document.
   * Also does not work well in parallel. Need to do some profiling work
   */
  async renderNote({
    note,
    config,
  }: {
    note: NoteProps;
    config: IntermediateDendronConfig;
  }) {
    const {
      convertTagNotesToLinks = false,
      convertUserNotesToLinks = false,
      addFrontmatterTitle,
    } = this._config;
    const engine = this._engine;
    const workspaceConfig = ConfigUtils.getWorkspace(config);
    workspaceConfig.enableUserTags = convertUserNotesToLinks;
    workspaceConfig.enableHashTags = convertTagNotesToLinks;

    if (!_.isUndefined(addFrontmatterTitle)) {
      const previewConfig = ConfigUtils.getPreview(config);
      previewConfig.enableFMTitle = addFrontmatterTitle;
    }

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
        ...config,
        usePrettyRefs: false,
      },
      fname: note.fname,
      vault: note.vault,
      vaults: engine.vaults,
      wsRoot: engine.wsRoot,
    });
    if (this._config.wikiLinkToURL && !_.isUndefined(this._dendronConfig)) {
      remark = remark.use(
        RemarkUtils.convertWikiLinkToNoteUrl(
          note,
          [],
          this._engine,
          this._dendronConfig
        )
      );
    } else {
      remark = remark.use(RemarkUtils.convertLinksFromDotNotation(note, []));
    }
    const out = (await remark.process(note.body)).toString();
    return _.trim(out);
  }

  dot2Slash(fname: string) {
    const hierarchy = fname.split(".");
    return path.join(...hierarchy);
  }

  static config(): JSONSchemaType<MarkdownV2PodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: ["destination"],
      properties: {
        wikiLinkToURL: {
          description: "How to convert the wikilinks",
          type: "boolean",
          default: false,
          nullable: true,
        },
        destination: {
          description:
            "export destination. Specify either a file path or 'clipboard' to export to your clipboard",
          type: "string",
        },
        convertTagNotesToLinks: {
          type: "boolean",
          default: false,
          nullable: true,
        },
        convertUserNotesToLinks: {
          type: "boolean",
          default: false,
          nullable: true,
        },
        addFrontmatterTitle: {
          type: "boolean",
          nullable: true,
        },
      },
    }) as JSONSchemaType<MarkdownV2PodConfig>;
  }
}
