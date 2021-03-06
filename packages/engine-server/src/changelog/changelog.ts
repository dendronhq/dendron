import { DEngineClientV2, DVault } from "@dendronhq/common-all";
import * as Diff2Html from "diff2html";
import execa from "execa";
var fs = require("fs");
const fsExtra = require("fs-extra");

// gets list of notes that were changed + commit hash and save it to file in build/ dir.
export async function generateChangelog(engine: DEngineClientV2) {
  let changesPath = engine.wsRoot + "/build/changes.json";
  await getChanges(engine.wsRoot, engine.vaultsv3).then(function (changes) {
    if (!fs.existsSync(changesPath)) {
      fs.writeFileSync(
        changesPath,
        JSON.stringify({ commits: [changes] }, null, 2),
        {
          encoding: "utf-8",
        }
      );
    } else {
      // if file already exists, append the commit to commits. but check if commit is already logged first.
      const data = fsExtra.readFileSync(changesPath, "utf8");
      if (!data.includes(changes.commitHash)) {
        let json = JSON.parse(data);
        json.commits.push(changes);
        fs.writeFileSync(changesPath, JSON.stringify(json), {
          encoding: "utf-8",
        });
      }
    }
    return changes;
  });
}

// get files changed/added for a repo for the last commit
async function getChanges(path: string, vaults: DVault[]) {
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
    // use slice as there are quotes around the commit hash
    commitHash = stdout.slice(1, -1);
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
        let accepted = vaults.some((vaultPath) => {
          if (filePath.startsWith(vaultPath.fsPath)) {
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
        let accepted = vaults.some((vaultPath) => {
          if (filePath.startsWith(vaultPath.fsPath)) {
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
          ["show", commitHash, "--", change.fname],
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
