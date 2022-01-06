import {
  ConfigUtils,
  DEngineClient,
  IntermediateDendronConfig,
  NoteProps,
} from "@dendronhq/common-all";
import {
  DendronASTDest,
  MDUtilsV4,
  MDUtilsV5,
  RemarkUtils,
} from "@dendronhq/engine-server";
import { JSONSchemaType } from "ajv";
import _ from "lodash";
import {
  ConfigFileUtils,
  ExportPodV2,
  MarkdownV2PodConfig,
  RunnableMarkdownV2PodConfig,
} from "../../..";

/**
 * Markdown Export Pod (V2 - for compatibility with Pod V2 workflow). Supports
 * both exportText() and exportNote()
 */
export class MarkdownExportPodV2 implements ExportPodV2<string> {
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

  async exportText(_input: string): Promise<string> {
    const proc = MDUtilsV5.procRemarkParseNoData(
      {},
      { dest: DendronASTDest.MD_REGULAR }
    );

    // TODO: markdown process utils don't currently take raw text; requires NoteProps for all the util methods.
    // if (this._config.wikiLinkToURL && !_.isUndefined(this._dendronConfig)) {
    //   proc = proc.use(
    //     RemarkUtils.convertWikiLinkToNoteUrl(
    //       _input,
    //       [],
    //       this._engine,
    //       this._dendronConfig
    //     )
    //   );
    // } else {
    //   proc = proc.use(RemarkUtils.convertLinksFromDotNotation(_input, []));
    // }

    const out = proc.processSync(_input).toString();

    return _.trim(out);
  }

  async exportNote(input: NoteProps): Promise<string> {
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

    let remark = MDUtilsV4.procFull({
      dest: DendronASTDest.MD_REGULAR,
      config: {
        ...overrideConfig,
        usePrettyRefs: false,
      },
      engine,
      fname: input.fname,
      vault: input.vault,
      shouldApplyPublishRules: false,
      blockAnchorsOpts: { hideBlockAnchors: true },
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
