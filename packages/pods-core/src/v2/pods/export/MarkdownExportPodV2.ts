import {
  ConfigUtils,
  DendronCompositeError,
  DendronError,
  DEngineClient,
  DVault,
  IDendronError,
  IntermediateDendronConfig,
  NoteProps,
  ResponseUtil,
  RespV2,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  DendronASTDest,
  MDUtilsV5,
  RemarkUtils,
} from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import _ from "lodash";
import path from "path";
import fs from "fs-extra";
import {
  ConfigFileUtils,
  ExportPodV2,
  MarkdownV2PodConfig,
  RunnableMarkdownV2PodConfig,
} from "../../..";
import { PodExportScope } from "../..";
import { createDisposableLogger } from "@dendronhq/common-server";

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

  async exportNotes(input: NoteProps[]): Promise<MarkdownExportReturnType> {
    const { logger, dispose } = createDisposableLogger("MarkdownExportV2");
    const { destination, exportScope } = this._config;

    if (destination === "clipboard") {
      const exportedNotes = this.renderNote(input[0]);
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
    const result = await Promise.all(
      input.map(async (note) => {
        try {
          const body = this.renderNote(note);
          const hpath = this.dot2Slash(note.fname) + ".md";
          const vname = VaultUtils.getName(note.vault);
          const fpath = path.join(destination, vname, hpath);
          logger.debug({ fpath, msg: "pre:write" });
          await fs.ensureDir(path.dirname(fpath));
          await fs.writeFile(fpath, body);
          return note;
        } catch (err) {
          errors.push(err as DendronError);
          return;
        }
      })
    );

    // Export Assets for vault and workspace exportScope
    const vaultsArray: DVault[] = [];
    switch (exportScope) {
      case PodExportScope.Vault: {
        vaultsArray.push(input[0].vault);
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
          "assets"
        );
        const srcPath = path.join(
          this._engine.wsRoot,
          VaultUtils.getRelPath(vault),
          "assets"
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

  renderNote(input: NoteProps) {
    const {
      convertTagNotesToLinks = false,
      convertUserNotesToLinks = false,
      addFrontmatterTitle,
    } = this._config;
    const engine = this._engine;
    const overrideConfig = { ...this._engine.config };

    const workspaceConfig = ConfigUtils.getWorkspace(overrideConfig);
    workspaceConfig.enableUserTags = convertUserNotesToLinks;
    workspaceConfig.enableHashTags = convertTagNotesToLinks;

    if (!_.isUndefined(addFrontmatterTitle)) {
      const previewConfig = ConfigUtils.getPreview(overrideConfig);
      previewConfig.enableFMTitle = addFrontmatterTitle;
    }

    let remark = MDUtilsV5.procRemarkFull({
      dest: DendronASTDest.MD_REGULAR,
      config: {
        ...overrideConfig,
        usePrettyRefs: false,
      },
      engine,
      fname: input.fname,
      vault: input.vault,
    });
    if (this._config.wikiLinkToURL && !_.isUndefined(this._dendronConfig)) {
      remark = remark.use(
        RemarkUtils.convertWikiLinkToNoteUrl(
          input,
          [],
          this._engine,
          this._dendronConfig
        )
      );
    } else {
      remark = remark.use(RemarkUtils.convertLinksFromDotNotation(input, []));
    }
    const out = remark.processSync(input.body).toString();
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
