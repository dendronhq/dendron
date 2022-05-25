import { TreeUtils } from "@dendronhq/common-all";
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
