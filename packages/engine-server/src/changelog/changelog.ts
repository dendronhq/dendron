/**
 *  @returns list of notes that were changed (via git status)
 */
export async function generateChangelog(wsRoot: string) {
  // const engine = MDUtilsV4.getEngineFromProc(proc).engine;
  console.log(wsRoot, "root");

  // return [{
  //   commit: "hhhh",
  //   data: "12/04"
  // }]
}

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

// read dendron.yml to check for public vaults and return a list of public vaults
// const getPublicVaults = () => {
//   let vaults = [] as Object[]
//   try {
//     let fileContents = fs.readFileSync("dendron.yml", "utf8");
//     let data = yaml.safeLoad(fileContents);
//     data.vaults.map((vault: any) => {
//       vaults.push(vault.fsPath);
//     });
//     return vaults;
//   } catch (e) {
//     return e
//   }
// };

// get files changed/added for a given vault
// const getChanges = (vault: any) => {
//   let filesChanged = [];
//   let filesAdded = [];
//   exec(`git status ${vault}`, (error, stdout, stderr) => {
//     if (error) {
//       console.log(`error: ${error.message}`);
//       return;
//     }
//     if (stderr) {
//       console.log(`stderr: ${stderr}`);
//       return;
//     }
//     let results = stdout.split("\n");
//     results.map((result) => {
//       if (result.startsWith(" M")) {
//         filesChanged.push(result.replace(` M ${vault}/`, ""));
//       } else if (result.startsWith("??")) {
//         filesAdded.push(result.replace(`?? ${vault}/`, ""));
//       }
//     });
//     console.log({ filesChanged });
//     console.log({ filesAdded });
//   });
// };
