/* eslint-disable no-await-in-loop */

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
  /* Ensure that the provided directory exists. If not present, this creates the directory */
  if (args.out) await fs.ensureDir(args.out);

  /* Create visualization for each vault */
  const visualizations = await getVisualizationContent(args);

  if (!args.engine) throw new Error("Engine is not initialized");

  args.engine.vaults.forEach(async (vault) => {
    const vaultName = VaultUtils.getName(vault);

    const outputFile = path.join(
      args.out || args.wsRoot,
      `diagram-${vaultName}.svg`
    );

    const Visualization = await getVisualizationContent({ ...args, vault });
    const html = ReactDOMServer.renderToStaticMarkup(Visualization);
    await fs.writeFile(outputFile, html);
  });

  /* For visualization of each vault, create a svg file */
  Object.entries(visualizations).forEach(async ([vault, html]) => {
    const outputFile = path.join(
      args.out || args.wsRoot,
      `diagram-${vault}.svg`
    );

    await fs.writeFile(outputFile, html);
  });
}

//TODO: Take vault name as an argument
export async function getVisualizationContent(args: VisualizationInput) {
  const { vault, notes } = args;
  const { /*rootPath*/ maxDepth, colorEncoding, customFileColors } =
    collectInput(args);

  const Tree = await createTree();

  const data = await processDir({
    rootPath: "root",
    notes,
    vault,
  });

  return (
    <Tree
      data={data}
      maxDepth={+maxDepth}
      colorEncoding={colorEncoding as any}
      customFileColors={customFileColors}
    />
  );
}
