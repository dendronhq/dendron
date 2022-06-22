/* eslint-disable no-await-in-loop */

import { VaultUtils } from "@dendronhq/common-all";
import fs from "fs-extra";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { processDir } from "./processDendronNotes";
import { createTree } from "./Tree";
import { GenerateSVGInput, InputArgs, VisualizationInput } from "./types";
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

export async function generateSVG(args: GenerateSVGInput) {
  const { out, engine, wsRoot } = args;

  /* Ensure that the provided directory exists. If not present, this creates the directory */
  if (out) await fs.ensureDir(out);

  if (!engine) throw new Error("Engine is not initialized");

  engine.vaults.forEach(async (vault) => {
    /* Get vault name */
    const vaultName = VaultUtils.getName(vault);
    /* Get the path to the output file */
    const outputFile = path.join(out || wsRoot, `diagram-${vaultName}.svg`);
    /* Create React component for visualization */
    const Visualization = await getVisualizationContent({
      ...args,
      vault,
      notes: engine.notes,
    });
    /* From React component, get svg as a string */
    const html = ReactDOMServer.renderToStaticMarkup(Visualization);
    /* Write svg to the output file */
    await fs.writeFile(outputFile, html);
  });
}

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
