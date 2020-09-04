import fs from "fs-extra";
import { URI } from "vscode-uri";
import { ExportPod, ExportPodOpts, PodBase } from "../base";

type PodOpts = {
  roots: string[];
};

class JSONPod extends PodBase {
  public opts: PodOpts;

  constructor(opts: PodOpts) {
    super(opts);
    this.opts = opts;
  }
}

type ExportConfig = {
  dest: URI;
};

class JSONExportPod extends JSONPod implements ExportPod<ExportConfig> {
  async plant(opts: ExportPodOpts<ExportConfig>): Promise<void> {
    return new Promise(async (resolve) => {
      await this.initEngine();
      const payload = this.prepareForExport(opts);
      const destPath = opts.config.dest.fsPath;
      fs.writeJSONSync(destPath, payload, { encoding: "utf8" });
      resolve();
    });
  }
}

export { JSONExportPod as ExportPod };
