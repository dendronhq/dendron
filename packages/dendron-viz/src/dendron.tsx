#!/usr/bin/env node

import { VaultUtils } from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { processDir } from "./process-dendron-notes";
import { createTree } from "./Tree";

function collectInput(args: InputArgs) {
  const rootPath = args.wsRoot;
  const maxDepth = 9;
  //TODO: Take path to customFileColors as a cli argument
  const customFileColors = {};
  const colorEncoding = "type";

  return {
    rootPath,
    maxDepth,
    colorEncoding,
    customFileColors,
  };
}

export async function generateSVG(args: InputArgs) {
  console.log("start");
  const { rootPath, maxDepth, colorEncoding, customFileColors } =
    collectInput(args);

  const Tree = await createTree();

  const engine = DendronEngineV2.create({ wsRoot: rootPath });
  await engine.init();
  await Promise.all(
    engine.vaults.map(async (vault) => {
      const data = await processDir({ rootPath: "root", engine, vault });
      console.log("vault:", data);
      const componentCodeString = ReactDOMServer.renderToStaticMarkup(
        <Tree
          data={data}
          maxDepth={+maxDepth}
          colorEncoding={colorEncoding as any}
          customFileColors={customFileColors}
        />
      );
      const vaultName = VaultUtils.getName(vault);
      const outputFile = args.out || `./diagram-${vaultName}.svg`;

      await fs.writeFileSync(outputFile, componentCodeString);
    })
  );
  console.log("done");
  // console.log(JSON.stringify(resp, null, 2));
}

export type InputArgs = {
  wsRoot: string;
  out?: string;
};
