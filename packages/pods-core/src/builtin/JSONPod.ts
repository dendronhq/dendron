import fs from "fs-extra";
import {
  ExportConfig,
  ExportPod,
  ExportPodBaseV2,
  ExportPodOpts,
  PodConfigEntry,
} from "../base";

export class JSONExportPod extends ExportPodBaseV2
  implements ExportPod<ExportConfig> {
  static id: string = "dendron.pod.json";
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
