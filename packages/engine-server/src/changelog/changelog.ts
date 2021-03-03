import { DEngineClientV2 } from "@dendronhq/common-all";
import execa from "execa";

// TODO: works only on one vault, make it work for multiple
// gets list of notes that were changed. using git.
export async function generateChangelog(engine: DEngineClientV2) {
  // let vault = engine.vaultsv3[0].fsPath;
  let gitRepoPath = engine.wsRoot.substring(0, engine.wsRoot.lastIndexOf("/"));
  getChanges(gitRepoPath).then(function (changes) {
    console.log(changes, "changes");
  });
}

// get files changed/added for a repo for the last commit
async function getChanges(path: string) {
  // let filesChanged: string[] = [];
  // let filesAdded: string[] = [];
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
        filesChanged.push(filePath);
        changes.push({
          action: "modified",
          fname: filePath,
        });
      } else if (result.startsWith("A")) {
        let filePath = result.split(" ")[0].substring(2);
        filesChanged.push(filePath);
        changes.push({
          action: "added",
          fname: filePath,
        });
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
        change.diff = stdout;
        return stdout;
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
