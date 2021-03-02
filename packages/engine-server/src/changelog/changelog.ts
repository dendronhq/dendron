import { DEngineClientV2 } from "@dendronhq/common-all";
import execa from "execa";

// gets list of notes that were changed. using git.
export async function generateChangelog(engine: DEngineClientV2) {
  // TODO: works only on one vault, make it work for multiple
  let vault = engine.vaultsv3[0].fsPath;
  getChanges(vault).then(function (changes) {
    console.log(changes, "changes");
  });
}

// get files changed/added for a given vault
async function getChanges(vault: any) {
  let filesChanged: string[] = [];
  let filesAdded: string[] = [];
  let changelogDate: string = "";
  try {
    const { stdout } = await execa("git", ["status", vault]);
    let status = stdout.split("\n");
    status.map((result) => {
      if (result.startsWith(" M")) {
        filesChanged.push(result.replace(` M ${vault}/`, ""));
      } else if (result.startsWith("??")) {
        filesAdded.push(result.replace(`?? ${vault}/`, ""));
      }
    });
  } catch (error) {
    console.log(error);
  }

  // get the date of the last commit
  try {
    const { stdout } = await execa("git", ["log", "-1", "--format=%cd"]);
    let date = stdout.split(/\s+/).slice(1, 5);
    let day = date[0];
    let month = date[1];
    let year = date[3];
    changelogDate = `${day} ${month} ${year}`;
  } catch (error) {
    console.log(error);
  }
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
