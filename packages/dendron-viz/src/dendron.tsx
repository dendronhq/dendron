/* eslint-disable no-await-in-loop */

import React from "react";
import ReactDOMServer from "react-dom/server";
import { processDir } from "./processDendronNotes";
import { createTree } from "./Tree";
import { InputArgs, VisualizationInput } from "./types";

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

export async function getVisualizationMarkup(args: VisualizationInput) {
  const component = await getVisualizationContent(args);
  return ReactDOMServer.renderToStaticMarkup(component);
}
