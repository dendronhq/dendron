import { exec } from '@actions/exec'
import * as core from '@actions/core'
import * as artifact from '@actions/artifact'
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from "fs"

import { processDir } from "./process-dir.js"
import { Tree } from "./Tree.tsx"

const main = async () => {
  core.info('[INFO] Usage https://github.com/githubocto/repo-visualizer#readme')

  core.startGroup('Configuration')
  const username = 'repo-visualizer'
  await exec('git', ['config', 'user.name', username])
  await exec('git', [
    'config',
    'user.email',
    `${username}@users.noreply.github.com`,
  ])

  core.endGroup()


  // const rootPath = core.getInput("root_path") || "../../workspaces/org-workspace-export"; 
  const rootPath = core.getInput("root_path") || "../../workspaces/org-workspace-export/org-private"; 
  const maxDepth = core.getInput("max_depth") || 9
  const customFileColors = JSON.parse(core.getInput("file_colors") ||  '{}');
  const colorEncoding = core.getInput("color_encoding") || "number-of-changes"
  const commitMessage = core.getInput("commit_message") || "Repo visualizer: update diagram"
  const excludedPathsString = core.getInput("excluded_paths") || "node_modules,bower_components,dist,out,build,eject,.next,.netlify,.yarn,.git,.vscode,package-lock.json,yarn.lock"
  const excludedPaths = excludedPathsString.split(",").map(str => str.trim())

  // Split on semicolons instead of commas since ',' are allowed in globs, but ';' are not + are not permitted in file/folder names.
  const excludedGlobsString = core.getInput('excluded_globs') || '';
  const excludedGlobs = excludedGlobsString.split(";");

  const branch = core.getInput("branch")
  
  const data = await processDir(rootPath, excludedPaths, excludedGlobs);

  const componentCodeString = ReactDOMServer.renderToStaticMarkup(
    <Tree data={data} maxDepth={+maxDepth} colorEncoding={colorEncoding} customFileColors={customFileColors}/>
  );

  const outputFile = core.getInput("output_file") || "./diagram.svg"

  core.setOutput('svg', componentCodeString)

  await fs.writeFileSync(outputFile, componentCodeString)

  let doesBranchExist = true

  if (branch) {
    await exec('git', ['fetch'])

    try {
      await exec('git', ['rev-parse', '--verify', branch])
      await exec('git', ['checkout', branch])
    } catch {
      doesBranchExist = false
      core.info(`Branch ${branch} does not yet exist, creating ${branch}.`)
      await exec('git', ['checkout', '-b', branch])
    }
  }

  await exec('git', ['add', outputFile])
  const diff = await execWithOutput('git', ['status', '--porcelain', outputFile])
  core.info(`diff: ${diff}`)
  if (!diff) {
    core.info('[INFO] No changes to the repo detected, exiting')
    return
  }

  const shouldPush = core.getBooleanInput('should_push')
  if (shouldPush) {
    core.startGroup('Commit and push diagram')
    await exec('git', ['commit', '-m', commitMessage])

    if (doesBranchExist) {
      await exec('git', ['push'])
    } else {
      await exec('git', ['push', '--set-upstream', 'origin', branch])
    }

    if (branch) {
      await exec('git', 'checkout', '-')
    }
    core.endGroup()
  }

  const shouldUpload = core.getInput('artifact_name') !== ''
  if (shouldUpload) {
    core.startGroup('Upload diagram to artifacts')
    const client = artifact.create()
    const result = await client.uploadArtifact(core.getInput('artifact_name'), [outputFile], '.')
    if (result.failedItems.length > 0) {
      throw 'Artifact was not uploaded successfully.'
    }
    core.endGroup()
  }

  console.log("All set!")
}

main().catch((e) => {
  core.setFailed(e)
})

function execWithOutput(command, args) {
  return new Promise((resolve, reject) => {
    try {
      exec(command, args, {
        listeners: {
          stdout: function (res) {
            core.info(res.toString())
            resolve(res.toString())
          },
          stderr: function (res) {
            core.info(res.toString())
            reject(res.toString())
          }
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
