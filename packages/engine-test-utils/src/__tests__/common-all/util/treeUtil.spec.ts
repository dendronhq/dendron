import { DendronError, TreeUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";

// describe("WHEN regular tree", () => {
//   test("THEN return regular tree", async () => {
//     await runEngineTestV5(
//       async ({ engine }) => {
//         const treeData = TreeUtils.generateTreeData(engine.notes, [
//           engine.notes["foo"],
//         ]);
//         expect(treeData.roots).toMatchSnapshot();
//       },
//       {
//         expect,
//         preSetupHook: ENGINE_HOOKS.setupBasic,
//       }
//     );
//   });
// });

// describe("WHEN nav_exclude_children enabled", () => {
//   test("THEN return only root", async () => {
//     await runEngineTestV5(
//       async ({ engine }) => {
//         const domain = engine.notes["foo"];
//         domain.custom.nav_exclude_children = true;
//         const treeData = TreeUtils.generateTreeData(engine.notes, [domain]);
//         expect(treeData.roots).toMatchSnapshot();
//         expect(treeData.roots[0].children).toEqual([]);
//       },
//       {
//         expect,
//         preSetupHook: ENGINE_HOOKS.setupBasic,
//       }
//     );
//   });
// });

// describe("WHEN has_collection enabled", () => {
//   test("THEN return only root", async () => {
//     await runEngineTestV5(
//       async ({ engine }) => {
//         const domain = engine.notes["foo"];
//         domain.custom.nav_exclude_children = true;
//         const treeData = TreeUtils.generateTreeData(engine.notes, [domain]);
//         expect(treeData.roots).toMatchSnapshot();
//         expect(treeData.roots[0].children).toEqual([]);
//       },
//       {
//         expect,
//         preSetupHook: ENGINE_HOOKS.setupBasic,
//       }
//     );
//   });
// });

// describe("WHEN has_collection enabled AND nav_children_exclude set to false", () => {
//   test("THEN return only root", async () => {
//     await runEngineTestV5(
//       async ({ engine }) => {
//         const domain = engine.notes["foo"];
//         domain.custom.nav_exclude_children = true;
//         const treeData = TreeUtils.generateTreeData(engine.notes, [domain]);
//         expect(treeData.roots).toMatchSnapshot();
//         expect(treeData.roots[0].children).toEqual([]);
//       },
//       {
//         expect,
//         preSetupHook: ENGINE_HOOKS.setupBasic,
//       }
//     );
//   });
// });

describe("sortNotesAtLevel", () => {
  describe("GIVEN noteIds that do not exist in noteDict", () => {
    test("THEN gracefully process only available notes and return error payload", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const noteDict = engine.notes;
          const noteIds = _.toArray(noteDict).map((props) => props.id);
          noteIds.push("dummy");

          const resp = TreeUtils.sortNotesAtLevel({ noteIds, noteDict });
          expect(resp.data.includes("dummy")).toBeFalsy();
          expect(resp.error instanceof DendronError).toBeTruthy();
          expect(resp.error?.payload).toEqual('{"omitted":["dummy"]}');
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
          await engine.findNotes({
            fname: "root",
            vault: vaults[0],
          })
        )[0];
        const engineTree = TreeUtils.createTreeFromEngine(
          engine.notes,
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
