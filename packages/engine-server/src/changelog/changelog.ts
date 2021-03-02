import { DEngineClientV2 } from "@dendronhq/common-all";
import { exec } from "child_process";

// gets list of notes that were changed. using git.
export async function generateChangelog(engine: DEngineClientV2) {
  // TODO: works only on one vault, make it work for multiple
  let vault = engine.vaultsv3[0].fsPath;
  let changes = getChanges(vault);
  console.log(changes, "changes");
}

// get files changed/added for a given vault
function getChanges(vault: any) {
  let filesChanged: string[] = [];
  let filesAdded: string[] = [];
  let changelogDate: string = "";

  exec(`git status ${vault}`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    let results = stdout.split("\n");
    results.map((result) => {
      if (result.startsWith(" M")) {
        filesChanged.push(result.replace(` M ${vault}/`, ""));
      } else if (result.startsWith("??")) {
        filesAdded.push(result.replace(`?? ${vault}/`, ""));
      }
    });
  });

  // get the date of the last commit
  exec(`git log -1 --format=%cd`, (error, stdout, stderr) => {
    let date = stdout.split(/\s+/).slice(1, 5);
    let day = date[0];
    let month = date[1];
    let year = date[3];
    changelogDate = `${day} ${month} ${year}`;
  });

  return {
    filesAdded: filesAdded,
    filesChanged: filesChanged,
    changelogDate: changelogDate,
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
