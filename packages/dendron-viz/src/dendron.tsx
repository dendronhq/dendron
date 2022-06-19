#!/usr/bin/env node
/* eslint-disable no-await-in-loop */

import { VaultUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { processDir } from "./processDendronNotes";
import { createTree } from "./Tree";
import { InputArgs, Visualizations, VisualizationInput } from "./types";
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
  /* Ensure that the provided directory exists. If not present, this creates the directory */
  if (args.out) await fs.ensureDir(args.out);

  /* Create visualization for each vault */
  const visualizations = await getVisualizationContent(args);

  /* For visualization of each vault, create a svg file */
  Object.entries(visualizations).forEach(async ([vault, html]) => {
    const outputFile = path.join(
      args.out || args.wsRoot,
      `diagram-${vault}.svg`
    );

    await fs.writeFile(outputFile, html);
  });
}

export async function getVisualizationContent(
  args: VisualizationInput
): Promise<Visualizations> {
  const { /*rootPath*/ maxDepth, colorEncoding, customFileColors } =
    collectInput(args);

  const engine = args.engine;

  const Tree = await createTree();

  const visualizations: Visualizations = {};

  for (const vault of engine.vaults) {
    /* Get stats of each note in the current vault */
    const data = await processDir({ rootPath: "root", engine, vault });

    const vaultName = VaultUtils.getName(vault);

    const html = ReactDOMServer.renderToStaticMarkup(
      <Tree
        data={data}
        maxDepth={+maxDepth}
        colorEncoding={colorEncoding as any}
        customFileColors={customFileColors}
      />
    );

    visualizations[vaultName] = html;
  }

  return visualizations;
}
