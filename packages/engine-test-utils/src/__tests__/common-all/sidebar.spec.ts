import { getSidebar, DefaultSidebar } from "@dendronhq/common-all";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

describe("GIVEN sidebar config input", () => {
  describe("WHEN providing empty config", () => {
    test("THEN return empty sidebar", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const sidebarResp = getSidebar([], { notes: engine.notes });
          expect(sidebarResp.data).toHaveLength(0);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("WHEN providing DefaultSidebar", () => {
    test("THEN return default sidebar", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const sidebarResp = getSidebar(DefaultSidebar, {
            notes: engine.notes,
          });
          expect(sidebarResp.data).toMatchSnapshot();
          expect(sidebarResp.data).toHaveLength(2);
          expect(sidebarResp.data).toHaveProperty("[1].items[0].id", "foo.ch1");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});
