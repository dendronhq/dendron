
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const {exec} = require("./exec");

/* Branch Naming Convention */
// TODO

/* Check Forbidden Tokens */
const FILES_REGEX = {ts: /\.ts$/, spec: /\.spec\.ts$/};
/** Map of forbidden tokens and their match regex */
const forbiddenTokens = {
  // don't commit .only statements
  ".only": { rgx: /(describe|it|test)\.only/, fileRgx: FILES_REGEX.spec},
};

let status = 0;

const gitCommand = `git diff --staged --name-only`;
const stagedFiles = exec(gitCommand).stdout.split('\n');
for (let [term, value] of Object.entries(forbiddenTokens)) {
  const {rgx, fileRgx, message} = value;
  /* Filter relevant files using the files regex */
  const relevantFiles = stagedFiles.filter((file) => fileRgx.test(file.trim()));
  const failedFiles = relevantFiles.reduce((acc, fileName) => {
    const filePath = path.resolve(process.cwd(), fileName.replace('client/', ''));
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
      if (rgx.test(content)) {
        status = 1;
        acc.push(fileName);
      }
    }
    return acc;
  }, []);
  
  /* Log all the failed files for this token with the matching message */
  if (failedFiles.length > 0) {
    const msg = message || `The following files contains '${term}' in them:`;
    console.log(chalk.bgRed.black.bold(msg));
    console.log(chalk.bgRed.black(failedFiles.join('\n')));
  }
}

process.exit(status);