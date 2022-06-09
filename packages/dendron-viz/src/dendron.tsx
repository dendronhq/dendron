#!/usr/bin/env node

import * as core from "@actions/core";
import { VaultUtils } from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import fs from "fs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { processDir } from "./process-dendron-notes";
import { createTree } from "./Tree";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

function collectInput(args: InputArgs) {
  const rootPath = args.wsRoot;
  const maxDepth = core.getInput("max_depth") || 9;
  const customFileColors = JSON.parse(core.getInput("file_colors") || "{}");
  const colorEncoding = core.getInput("color_encoding") || "type";
  const commitMessage =
    core.getInput("commit_message") || "Repo visualizer: update diagram";
  const excludedPathsString =
    core.getInput("excluded_paths") ||
    "node_modules,bower_components,dist,out,build,eject,.next,.netlify,.yarn,.git,.vscode,package-lock.json,yarn.lock";
  const excludedPaths = excludedPathsString.split(",").map((str) => str.trim());

  // Split on semicolons instead of commas since ',' are allowed in globs, but ';' are not + are not permitted in file/folder names.
  const excludedGlobsString = core.getInput("excluded_globs") || "";
  const excludedGlobs = excludedGlobsString.split(";");

  const branch = core.getInput("branch");
  return {
    rootPath,
    excludedPaths,
    excludedGlobs,
    maxDepth,
    colorEncoding,
    customFileColors,
  };
}

async function main(args: InputArgs) {
  console.log("start");
  const {
    rootPath,
    excludedPaths,
    excludedGlobs,
    maxDepth,
    colorEncoding,
    customFileColors,
  } = collectInput(args);

  const Tree = await createTree();

  const engine = DendronEngineV2.create({ wsRoot: rootPath });
  await engine.init();
  const resp = await Promise.all(
    engine.vaults.map(async (vault) => {
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
      const outputFile =
        core.getInput("output_file") || `./diagram-${vaultName}.svg`;

      core.setOutput("svg", componentCodeString);

      await fs.writeFileSync(outputFile, componentCodeString);
    })
  );
  console.log("done");
  console.log(JSON.stringify(resp, null, 2));
}

type InputArgs = {
  wsRoot: string;
};

const args: InputArgs = yargs(hideBin(process.argv))
  .option("wsRoot", {
    alias: "r",
    type: "string",
    description: "worskpace root",
    required: true,
  })
  .parse();

main(args);
