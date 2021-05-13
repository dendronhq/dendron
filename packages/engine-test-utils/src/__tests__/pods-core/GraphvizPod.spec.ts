import { tmpDir } from "@dendronhq/common-server";
import { ENGINE_HOOKS, FileTestUtils } from "@dendronhq/common-test-utils";
import { GraphvizExportPod } from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5 } from "../../engine";
import { checkString } from "../../utils";

describe("graphviz export pod", () => {
  let exportDest: string;

  beforeAll(() => {
    exportDest = tmpDir().name;
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GraphvizExportPod();
        engine.config.useFMTitle = true;
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
            includeBody: true,
            includeStubs: true,
          },
        });

        // check that graphviz file is created
        let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(exportDest, [
          "graphviz.dot",
        ]);
        expect(expectedFiles).toEqual(actualFiles);

        // check contents of graphviz file
        const foo = fs.readFileSync(path.join(exportDest, "graphviz.dot"), {
          encoding: "utf8",
        });

        // TODO: IDs of files switch between test runs, which causes the snapshot
        // to fail when it shouldn't
        // expect(foo).toMatchSnapshot("graphviz contents");

        // Check for:
        // 1. start of file -> "graph {"
        // 2. existence of a note -> "note_"
        // 3. a labeled note -> "[label=\""
        // 4. a connection -> "--"
        // 5. end of graph -> "}"
        await checkString(foo, "graph {", "note_", '[label="', "--", "}");
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
