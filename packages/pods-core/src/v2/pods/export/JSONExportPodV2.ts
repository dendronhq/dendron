import {
  DendronError,
  NoteProps,
  ResponseUtil,
  RespV2,
} from "@dendronhq/common-all";
import { JSONSchemaType } from "ajv";
import _ from "lodash";
import path from "path";
import fs from "fs-extra";
import { ConfigFileUtils, ExportPodV2 } from "../../..";
import { JSONV2PodConfig, RunnableJSONV2PodConfig } from "../..";

/**
 * JSON Export Pod (V2 - for compatibility with Pod V2 workflow).
 */

export type JSONExportReturnType = RespV2<{
  exportedNotes?: string | NoteProps[];
}>;
export class JSONExportPodV2 implements ExportPodV2<JSONExportReturnType> {
  private _config: RunnableJSONV2PodConfig;

  constructor({ podConfig }: { podConfig: RunnableJSONV2PodConfig }) {
    this._config = podConfig;
  }

  async exportNote(input: NoteProps): Promise<JSONExportReturnType> {
    if (this._config.destination === "clipboard") {
      const out = JSON.stringify(input, null, 4);
      return ResponseUtil.createHappyResponse({
        data: {
          exportedNotes: out,
        },
      });
    }
    return this.exportNotes([input]);
  }

  async exportNotes(input: NoteProps[]): Promise<JSONExportReturnType> {
    const { destination } = this._config;
    try {
      fs.ensureDirSync(path.dirname(destination));
      fs.writeJSONSync(destination, input, { encoding: "utf8" });
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
