// import { DEngine } from "@dendronhq/common-all";
// import { DendronEngine } from "@dendronhq/engine-server";
// import * as csv from "fast-csv";
// import { ExportPod, ExportPodOpts, PodBase } from "../base";
// import { URI } from "vscode-uri";
// import _ from "lodash";
// import fs from "fs";

// type PodOpts = {
//   roots: string[];
// };

// class CSVPod extends PodBase {
//   public opts: PodOpts;
//   public engine?: DEngine;

//   constructor(opts: PodOpts) {
//     super();
//     this.opts = opts;
//     this.initialize();
//   }

//   initialize() {
//     this.engine = DendronEngine.getOrCreateEngine({ root: this.opts.roots[0] });
//   }
// }

// type ExportConfig = {
//   dest: URI;
// };

// class CSVExportPod extends CSVPod implements ExportPod<ExportConfig> {
//   async plant(opts: ExportPodOpts<ExportConfig>): Promise<void> {
//     return new Promise(async (resolve) => {
//       if (!this.engine) {
//         throw Error("engine not initialized");
//       }
//       await this.engine.init();
//       const nodes = this.engine[opts.mode];
//       const destPath = opts.config.dest.fsPath;
//       const csvStream = csv.format({ headers: true });
//       const stream = fs.createWriteStream(destPath, {encoding: "utf8"});
//       csvStream.pipe(stream).on("end", () => resolve());
//       _.map(nodes, (n) => {
//         return csvStream.write(n.toRawProps());
//       });
//       csvStream.end();
//     });
//   }
// }

// export { CSVExportPod as ExportPod };
