import { DNodeUtilsV2 } from "@dendronhq/common-all";
import fs from "fs-extra";
import { DendronEngineClient } from "../engineClient";

export function getDurationMilliseconds(start: [number, number]) {
  const [secs, nanosecs] = process.hrtime(start);
  return secs * 1000 + Math.floor(nanosecs / 1000000);
}

async function main() {
  let start = process.hrtime();
  const engine = DendronEngineClient.create({
    port: "3005",
    ws: "/Users/kevinlin/Dropbox/Apps/Noah",
    vaults: ["/Users/kevinlin/Dropbox/Apps/Noah/notes"],
  });
  let engineCreate = getDurationMilliseconds(start);
  const wsRoot = engine.wsRoot;

  start = process.hrtime();
  await engine.init();
  let engineInit = getDurationMilliseconds(start);

  start = process.hrtime();
  await engine.queryNotes({ qs: "*" });
  let engineStarQuery = getDurationMilliseconds(start);

  start = process.hrtime();
  let resp = await engine.queryNotes({ qs: "pr" });
  let engineDomainQuery = getDurationMilliseconds(start);
  let nodes = resp.data;

  start = process.hrtime();
  resp = await engine.queryNotes({ qs: "cli.git" });
  let engineDomainWithChildQuery = getDurationMilliseconds(start);
  nodes = resp.data;
  const numProps = nodes.length;

  start = process.hrtime();
  await Promise.all(
    nodes.map(async (ent) =>
      DNodeUtilsV2.enhancePropForQuickInput({
        wsRoot,
        props: ent,
        schemas: engine.schemas,
        vaults: engine.vaultsv3,
      })
    )
  );
  let enhancePropsWithPromise = getDurationMilliseconds(start);

  start = process.hrtime();
  await Promise.all(
    nodes.slice(0, 100).map(async (ent) =>
      DNodeUtilsV2.enhancePropForQuickInput({
        wsRoot,
        props: ent,
        schemas: engine.schemas,
        vaults: engine.vaultsv3,
      })
    )
  );
  let enhancePropsWithPromise100 = getDurationMilliseconds(start);

  start = process.hrtime();
  await Promise.all(
    nodes.slice(0, 50).map(async (ent) =>
      DNodeUtilsV2.enhancePropForQuickInput({
        wsRoot,
        props: ent,
        schemas: engine.schemas,
        vaults: engine.vaultsv3,
      })
    )
  );
  let enhancePropsWithPromise50 = getDurationMilliseconds(start);

  start = process.hrtime();
  nodes.slice(0, 50).map((ent) =>
    DNodeUtilsV2.enhancePropForQuickInput({
      wsRoot,
      props: ent,
      schemas: engine.schemas,
      vaults: engine.vaultsv3,
    })
  );
  let enhancePropsNoPromise50 = getDurationMilliseconds(start);

  const out = {
    engineCreate,
    engineInit,
    engineStarQuery,
    engineDomainQuery,
    engineDomainWithChildQuery,
    numProps,
    enhancePropsWithPromise,
    enhancePropsWithPromise100,
    enhancePropsWithPromise50,
    enhancePropsNoPromise50,
  };
  console.log(out);
  fs.writeJSONSync("/tmp/data.json", out, { spaces: 4 });
  return;
}

main();
