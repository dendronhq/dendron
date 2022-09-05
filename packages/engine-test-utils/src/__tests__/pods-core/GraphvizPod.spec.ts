import { tmpDir } from "@dendronhq/common-server";
import { FileTestUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { GraphvizExportConfig, GraphvizExportPod } from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { runEngineTestV5, WorkspaceOpts } from "../../engine";
import { checkNotInString, checkString } from "../../utils";

const setupBasic = async (opts: WorkspaceOpts) => {
  const { wsRoot, vaults } = opts;
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "parent",
    body: [`[[foo.linked]]`].join("\n"),
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "parent.linked",
    body: [`[[foo]]`].join("\n"),
  });
  await NoteTestUtilsV4.createNote({
    wsRoot,
    vault: vaults[0],
    fname: "unlinked",
    body: [`[[parent]]`].join("\n"),
  });
};

/*
At the moment, there are some issues with snapshots and these tests
In lieu of a snapshot, here is the structure of a basic graph:

graph {
  note_NOTEIDHERE [label="Note One"];                     // create node with label
  note_ANOTHERNOTEID [label="Note Two"];                  // create node with label
  note_NOTEIDHERE -- note_ANOTHERNOTEID;                  // hierarchical connection
  note_NOTEIDHERE -- note_ANOTHERNOTEID [style=dotted];   // link connection
}

A hierarchical graph will have only hierarchical connections, and a link graph
will have only link connections.
*/

describe("graphviz export pod", () => {
  let exportDest: string;

  beforeAll(() => {
    exportDest = tmpDir().name;
  });

  test("basic", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GraphvizExportPod();

        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
            includeBody: true,
            includeStubs: true,
            showGraphByHierarchy: true,
            showGraphByEdges: false,
          },
        });

        // check that graphviz file is created
        let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(exportDest, [
          "graphviz.dot",
        ]);
        expect(expectedFiles).toEqual(actualFiles);

        // check contents of graphviz file
        const dotFile = fs.readFileSync(path.join(exportDest, "graphviz.dot"), {
          encoding: "utf8",
        });

        // Check for:
        // 1. start of file -> "graph {"
        // 2. existence of a note -> "note_"
        // 3. a labeled note -> "[label=\""
        // 4. a connection -> "--"
        // 5. end of graph -> "}"
        await checkString(dotFile, "graph {", "note_", '[label="', "--", "}");
      },
      { expect, preSetupHook: setupBasic }
    );
  });

  test("include hierarchical connections only", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GraphvizExportPod();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
            includeBody: true,
            includeStubs: true,
            showGraphByHierarchy: true,
            showGraphByEdges: false,
          } as GraphvizExportConfig,
        });

        // check contents of graphviz file
        const dotFile = fs.readFileSync(path.join(exportDest, "graphviz.dot"), {
          encoding: "utf8",
        });

        // check for hierarchical-specific elements
        await checkString(dotFile, "--");
        await checkNotInString(dotFile, "dotted");
      },
      { expect, preSetupHook: setupBasic }
    );
  });

  test("include link connections only", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GraphvizExportPod();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
            includeBody: true,
            includeStubs: true,
            showGraphByHierarchy: false,
            showGraphByEdges: true,
          } as GraphvizExportConfig,
        });

        // check contents of graphviz file
        const dotFile = fs.readFileSync(path.join(exportDest, "graphviz.dot"), {
          encoding: "utf8",
        });

        // check for link-specific elements
        await checkString(dotFile, "--", "dotted");
      },
      { expect, preSetupHook: setupBasic }
    );
  });

  test("include both hierarchical and link connections", async () => {
    await runEngineTestV5(
      async ({ engine, vaults, wsRoot }) => {
        const pod = new GraphvizExportPod();
        await pod.execute({
          engine,
          vaults,
          wsRoot,
          config: {
            dest: exportDest,
            includeBody: true,
            includeStubs: true,
            showGraphByHierarchy: true,
            showGraphByEdges: true,
          } as GraphvizExportConfig,
        });

        // check contents of graphviz file
        const dotFile = fs.readFileSync(path.join(exportDest, "graphviz.dot"), {
          encoding: "utf8",
        });

        // check for both hierarchical and link elements
        await checkString(dotFile, "--", "dotted");
      },
      { expect, preSetupHook: setupBasic }
    );
  });
});
