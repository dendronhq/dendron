import fs from "fs-extra";
import { URI } from "vscode-uri";
import {
  ExportPod,
  ExportPodOpts,
  PodBaseV2,
  PodOptsV2,
  ExportConfig,
} from "../base";
import _ from "lodash";

class JSONPod extends PodBaseV2 {
  public opts: PodOptsV2;

  constructor(opts: PodOptsV2) {
    super(opts);
    this.opts = opts;
  }
}

export type PodConfigEntry = {
  key: string;
  description: string;
  type: "string" | "number";
  default?: any;
};

export class JSONExportPod extends JSONPod implements ExportPod<ExportConfig> {
  static id: string = "dendron.json";
  static description: string = "export to json";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "dest",
        description: "where will output be stored",
        type: "string",
      },
    ];
  };

  async plant(opts: ExportPodOpts<ExportConfig>): Promise<void> {
    return new Promise(async (resolve) => {
      await this.initEngine();
      const cleanConfig = this.cleanConfig(opts.config);
      const payload = this.prepareForExport(opts);
      const destPath = cleanConfig.dest.fsPath;
      fs.writeJSONSync(destPath, payload, { encoding: "utf8" });
      resolve();
    });
  }
}
