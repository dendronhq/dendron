import { DEngineClientV2, DVault } from "@dendronhq/common-all";
import * as Diff2Html from "diff2html";
import execa from "execa";
var fs = require("fs");

// TODO: works only on one vault, make it work for multiple
// gets list of notes that were changed. using git.
export async function generateChangelog(engine: DEngineClientV2) {
  let gitRepoPath = engine.wsRoot.substring(0, engine.wsRoot.lastIndexOf("/"));

  getChanges(gitRepoPath, engine.vaultsv3, engine.wsRoot).then(function (
    changes
  ) {
    if (!fs.existsSync("/tmp/changes.json")) {
      fs.writeFileSync("/tmp/changes.json", JSON.stringify(changes, null, 2), {
        encoding: "utf-8",
      });
    } else {
      fs.readFile("/tmp/changes.json", function (err: Error, data: string) {
        if (err) throw err;
        if (!data.includes(changes.commitHash)) {
          // append to file as this commit hash doesn't yet exist in the changelog
          fs.appendFile(
            "/tmp/changes.json",
            JSON.stringify(changes, null, 2),
            function (err: Error) {
              if (err) throw err;
            }
          );
        }
      });
    }
    return changes;
  });
}

// TODO: make it array of commits to hold many, append

// get files changed/added for a repo for the last commit
async function getChanges(path: string, vaults: DVault[], wsRoot: string) {
  let publicVaultPaths: string[] = [];
  vaults.map((vault) => {
    publicVaultPaths.push(wsRoot.replace(path + "/", "") + "/" + vault.fsPath);
  });

  let commitDate: string = "";
  let commitHash: string = "";
  let changes: any[] = [];
  let filesChanged: string[] = [];

  // get last commit hash
  try {
    const { stdout } = await execa(
      "git",
      [`log`, `--pretty=format:'%h'`, `-n`, `1`],
      { cwd: path }
    );
    commitHash = stdout;
  } catch (error) {
    console.log(error);
  }

  // get files changed/added
  try {
    const { stdout } = await execa("git", ["show", "--name-status"], {
      cwd: path,
    });
    let status = stdout.split("\n");
    status.map((result) => {
      if (result.startsWith("M")) {
        let filePath = result.split(" ")[0].substring(2);
        let accepted = publicVaultPaths.some((vaultPath) => {
          if (filePath.startsWith(vaultPath)) {
            return true;
          } else {
            return false;
          }
        });
        if (accepted) {
          filesChanged.push(filePath);
          changes.push({
            action: "Modified",
            fname: filePath,
          });
        }
      } else if (result.startsWith("A")) {
        let filePath = result.split(" ")[0].substring(2);
        let accepted = publicVaultPaths.some((vaultPath) => {
          if (filePath.startsWith(vaultPath)) {
            return true;
          } else {
            return false;
          }
        });
        if (accepted) {
          filesChanged.push(filePath);
          changes.push({
            action: "Added",
            fname: filePath,
          });
        }
      }
    });
  } catch (error) {
    console.log(error);
  }

  await Promise.all(
    changes.map(async (change) => {
      try {
        const { stdout } = await execa(
          "git",
          ["show", commitHash.slice(1, -1), "--", change.fname],
          { cwd: path }
        );
        change.diff = Diff2Html.html(stdout);
        return Diff2Html.html(stdout);
      } catch (error) {
        console.log(error);
        return error;
      }
    })
  );

  // get date of last commit
  try {
    const { stdout } = await execa("git", ["log", "-1", "--format=%cd"], {
      cwd: path,
    });
    let date = stdout.split(/\s+/).slice(1, 5);
    let day = date[0];
    let month = date[1];
    let year = date[3];
    commitDate = `${day} ${month} ${year}`;
  } catch (error) {
    console.log(error);
  }

  return {
    commitDate: commitDate,
    commitHash: commitHash,
    changes: changes,
  };
}
