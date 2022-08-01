#!/usr/bin/env node

import { VaultUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { processDir } from "./processDendronNotes";
import { createTree } from "./Tree";
import { InputArgs, VisualizationInput } from "./types";
import path from "path";

function collectInput(args: InputArgs) {
  const rootPath = args.wsRoot;
  const maxDepth = 9;
  //TODO: Take path to customFileColors as a cli argument (as an added functionality)
  const customFileColors = {};
  const colorEncoding = "type";

  return {
    rootPath,
    maxDepth,
    colorEncoding,
    customFileColors,
  };
}

export async function generateSVG(args: VisualizationInput) {
  const { /*rootPath*/ maxDepth, colorEncoding, customFileColors } =
    collectInput(args);

  const engine = args.engine;

  const Tree = await createTree();
  await Promise.all(
    engine.vaults.map(async (vault) => {
      /* Get stats of each note in the current vault */
      const data = await processDir({ rootPath: "root", engine, vault });

      const componentCodeString = ReactDOMServer.renderToStaticMarkup(
        <Tree
          data={data}
          maxDepth={+maxDepth}
          colorEncoding={colorEncoding as any}
          customFileColors={customFileColors}
        />
      );
      const vaultName = VaultUtils.getName(vault);
      if (args.out) {
        await fs.ensureDir(args.out);
      }
      const outputFile = path.join(
        args.out || args.wsRoot,
        `diagram-${vaultName}.svg`
      );

      await fs.writeFile(outputFile, componentCodeString);
    })
  );
}
