import {
  DendronError,
  NoteProps,
  ResponseUtil,
  RespV2,
  URI,
} from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import _ from "lodash";
import path from "path";
import fs from "fs-extra";
import { ConfigFileUtils, ExportPodV2, PodUtils } from "../../..";
import { JSONV2PodConfig, RunnableJSONV2PodConfig } from "../..";
import { resolvePath } from "@dendronhq/common-server";

/**
 * JSON Export Pod (V2 - for compatibility with Pod V2 workflow).
 */

export type JSONExportReturnType = RespV2<{
  exportedNotes?: string | NoteProps[];
}>;
export class JSONExportPodV2 implements ExportPodV2<JSONExportReturnType> {
  private _config: RunnableJSONV2PodConfig;
  private _wsRoot: string;

  constructor({
    podConfig,
    wsRoot,
  }: {
    podConfig: RunnableJSONV2PodConfig;
    wsRoot: string;
  }) {
    this._config = podConfig;
    this._wsRoot = wsRoot;
  }

  async exportNotes(input: NoteProps[]): Promise<JSONExportReturnType> {
    const { destination } = this._config;

    if (destination === "clipboard") {
      const out = JSON.stringify(input[0], null, 4);
      return ResponseUtil.createHappyResponse({
        data: {
          exportedNotes: out,
        },
      });
    }
    // resolve relative path
    const podDstPath = URI.file(resolvePath(destination, this._wsRoot)).fsPath;
    try {
      // should not create parent directory when parent is root
      if (!PodUtils.isParentRoot(podDstPath)) {
        fs.ensureDirSync(path.dirname(podDstPath));
      }
      fs.writeJSONSync(podDstPath, input, { encoding: "utf8" });
    } catch (err) {
      return {
        data: {
          exportedNotes: [],
        },
        error: err as DendronError,
      };
    }

    return ResponseUtil.createHappyResponse({
      data: {
        exportedNotes: input,
      },
    });
  }

  static config(): JSONSchemaType<JSONV2PodConfig> {
    return ConfigFileUtils.createExportConfig({
      required: ["destination"],
      properties: {
        destination: {
          description:
            "export destination. Specify either a file path or 'clipboard' to export to your clipboard",
          type: "string",
        },
      },
    }) as JSONSchemaType<JSONV2PodConfig>;
  }
}
