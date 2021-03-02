import { DEngineClientV2 } from "@dendronhq/common-all";
import execa from "execa";

// gets list of notes that were changed. using git.
export async function generateChangelog(engine: DEngineClientV2) {
  // TODO: works only on one vault, make it work for multiple
  let vault = engine.vaultsv3[0].fsPath;
  // console.log(engine.wsRoot, "root")
  getChanges(engine.wsRoot, vault).then(function (changes) {
    console.log(changes, "changes");
  });
}

// {
//   commitDate: 'Mar 2 2021',
//   commitHash: "'2602c8d5'"
//   changes: [{
//       action: "added",
//       fname: "new.md",
//       diff: "..."
//   },
//   ...
//   ]
// }

// get files changed/added for a repo for the last commit
async function getChanges(path: string, vault: string) {
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

  changes.map((change) => {
    try {
      const { stdout } = await execa("git", [
        "show",
        commitHash,
        `-- ${change.fname}`,
      ]);
      console.log(stdout, "DIFF");
    } catch (error) {
      console.log(error);
    }
  });

  // get date of last commit
  try {
    const { stdout } = await execa("git", ["log", "-1", "--format=%cd"], {
      cwd: path,
    });
    console.log(stdout, "OUTT");
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
    // filesAdded: filesAdded,
    // filesChanged: filesChanged,
  };
}

// console.log(wsRoot, "ROOT");
// return [{
//   commit: "hhhh",
//   data: "12/04"
// }]

// const wsRoot = process.env.WS_ROOT

// return ["test", "wow"]
// TODO: consider error case

// console.log("hi")
// let vaults = getPublicVaults();
// console.log(vaults)
// const wsRoot = "/Users/nikivi/src/learning/dendron";
// console.log(wsRoot)
// if (wsRoot) {
//   const config = DConfig.getOrCreate(wsRoot);
//   console.log(config);
// const ws = getWS();
// const engine = await getEngine()
// let {notes} = await SiteUtils.filterByConfig({
//   engine,
//   config: config
// })
// }
// }
//   const engine = await getEngine();
//   let { notes } = await SiteUtils.filterByConfig({
//     engine,
//     config: config,
//   });
//   console.log(notes)
//   // const changes = getChanges(vaults[0]);
//   return
// } else {
//   return
// }
