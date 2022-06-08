import { DendronError, TreeUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";

describe("WHEN regular tree", () => {
  test("THEN return regular tree", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const treeData = TreeUtils.generateTreeData(engine.notes, [
          engine.notes["foo"],
        ]);
        expect(treeData.roots).toMatchSnapshot();
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

describe("WHEN nav_exclude_children enabled", () => {
  test("THEN return only root", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const domain = engine.notes["foo"];
        domain.custom.nav_exclude_children = true;
        const treeData = TreeUtils.generateTreeData(engine.notes, [domain]);
        expect(treeData.roots).toMatchSnapshot();
        expect(treeData.roots[0].children).toEqual([]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

describe("WHEN has_collection enabled", () => {
  test("THEN return only root", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const domain = engine.notes["foo"];
        domain.custom.nav_exclude_children = true;
        const treeData = TreeUtils.generateTreeData(engine.notes, [domain]);
        expect(treeData.roots).toMatchSnapshot();
        expect(treeData.roots[0].children).toEqual([]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

describe("WHEN has_collection enabled AND nav_children_exclude set to false", () => {
  test("THEN return only root", async () => {
    await runEngineTestV5(
      async ({ engine }) => {
        const domain = engine.notes["foo"];
        domain.custom.nav_exclude_children = true;
        const treeData = TreeUtils.generateTreeData(engine.notes, [domain]);
        expect(treeData.roots).toMatchSnapshot();
        expect(treeData.roots[0].children).toEqual([]);
      },
      {
        expect,
        preSetupHook: ENGINE_HOOKS.setupBasic,
      }
    );
  });
});

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
