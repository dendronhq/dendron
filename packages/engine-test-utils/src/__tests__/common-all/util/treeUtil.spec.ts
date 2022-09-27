import { NoteDictsUtils, TreeUtils } from "@dendronhq/common-all";
import type { Sidebar } from "@dendronhq/common-all";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";

describe("GIVEN sidebar", () => {
  const sidebar: Sidebar = [
    {
      type: "category",
      label: "Foo",
      items: [
        {
          type: "note",
          id: "foo.ch1",
          label: "Ch1",
        },
      ],
      link: {
        type: "note",
        id: "foo",
      },
    },
  ];
  describe("WHEN regular tree", () => {
    test("THEN return regular tree", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const engineNotes = await engine.findNotes({ excludeStub: false });
          const treeData = TreeUtils.generateTreeData(
            NoteDictsUtils.createNotePropsByIdDict(engineNotes),
            sidebar
          );
          expect(treeData.roots).toMatchSnapshot();
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});

describe("GIVEN basic workspace", () => {
  test("WHEN creating a TreeNode from engine notes, then expect TreeNode to match snapshots", async () => {
    await runEngineTestV5(
      async ({ vaults, engine }) => {
        const rootNote = (
          await engine.findNotesMeta({
            fname: "root",
            vault: vaults[0],
          })
        )[0];
        const engineNotes = await engine.findNotes({ excludeStub: false });
        const engineTree = TreeUtils.createTreeFromEngine(
          NoteDictsUtils.createNotePropsByIdDict(engineNotes),
          rootNote.id
        );
        expect(engineTree).toMatchSnapshot();

        const fNames = ["root", "bar", "foo", "foo.ch1"];
        const fileTree = TreeUtils.createTreeFromFileNames(fNames, "root");
        expect(fileTree).toMatchSnapshot();

        // Expect tree nodes to be equal
        const resp = TreeUtils.validateTreeNodes(fileTree, engineTree);
        expect(resp.error).toBeUndefined();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

describe("GIVEN two TreeNodes", () => {
  test("Then test validation logic", (done) => {
    const grandChildOne = { fname: "grandChildOne", children: [] };
    const childOne = { fname: "childOne", children: [] };
    const childTwo = { fname: "childTwo", children: [grandChildOne] };
    const treeOne = { fname: "root", children: [childOne, childTwo] };
    const treeTwo = { fname: "root", children: [childOne, childTwo] };

    // Expect tree nodes to be equal
    let resp = TreeUtils.validateTreeNodes(treeOne, treeTwo);
    expect(resp.error).toBeUndefined();

    // Expect tree nodes to not be equal at root
    const treeThree = { fname: "rootTwo", children: [childOne, childTwo] };
    resp = TreeUtils.validateTreeNodes(treeOne, treeThree);
    expect(resp.error).toBeTruthy();
    expect(resp.error?.message).toContain("Fname differs");

    // Expect tree nodes to not be equal at root's children
    const treeFour = { fname: "root", children: [childOne, childOne] };
    resp = TreeUtils.validateTreeNodes(treeOne, treeFour);
    expect(resp.error).toBeTruthy();
    expect(resp.error?.message).toContain("Mismatch at root's children");

    // Expect tree nodes to not be equal at root's children
    const childThree = { fname: "childTwo", children: [] };
    const treeFive = { fname: "root", children: [childOne, childThree] };
    resp = TreeUtils.validateTreeNodes(treeOne, treeFive);
    expect(resp.error).toBeTruthy();
    expect(resp.error?.message).toContain("Mismatch at root's children");

    // Expect tree nodes to not be equal at root's grandchildren
    const grandChildTwo = { fname: "grandChildTwo", children: [] };
    const childFour = { fname: "childTwo", children: [grandChildTwo] };
    const treeSix = { fname: "root", children: [childOne, childFour] };
    resp = TreeUtils.validateTreeNodes(treeOne, treeSix);
    expect(resp.error).toBeTruthy();
    expect(resp.error?.message).toContain("Mismatch at childTwo's children");

    done();
  });
});
