import { DropboxStorage } from "./dropbox";

async function main() {
  const dx = new DropboxStorage();
  const resp = await dx.get({ username: "kevins8" }, "N7-u2BiFCYcAAAAAAEi0Ew");
  console.log(resp);
}

main();
