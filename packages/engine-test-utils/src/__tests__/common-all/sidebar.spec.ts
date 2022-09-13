import { getSidebar, DefaultSidebar } from "@dendronhq/common-all";
import { runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

/*
 * See [[dendron://dendron.dendron-site/dendron.topic.publish.sidebar#complex-sidebar-example]] for sidebar docs and example
 */

describe("GIVEN sidebar config input", () => {
  describe("WHEN providing empty config", () => {
    test("THEN return empty sidebar object", async () => {
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
    test("THEN return sidebar object", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const sidebarResp = getSidebar(DefaultSidebar, {
            notes: engine.notes,
          });
          expect(sidebarResp.data).toMatchSnapshot();
          // Expect DefaultSidebar to resolve into 2 sidebarItem entries
          expect(sidebarResp.data).toHaveLength(2);
          // Expect `foo.md` to have the child `foo.ch1.md`
          expect(sidebarResp.data).toHaveProperty("[1].items[0].id", "foo.ch1");
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("WHEN providing autogenerated sidebar item", () => {
    test("THEN return sidebar slice", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const sidebarResp = getSidebar(
            [{ type: "autogenerated", id: "foo" }],
            {
              notes: engine.notes,
            }
          );
          expect(sidebarResp.data).toMatchSnapshot();
          // Expect to resolve into sidebar slice with two children
          expect(sidebarResp.data).toHaveLength(2);
          // Expect to contain deep nested note
          expect(sidebarResp.data).toHaveProperty(
            "[0].items[0].items[0].id",
            "foo.ch1.gch1.ggch1"
          );
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupHierarchyForLookupTests,
        }
      );
    });
  });

  describe("WHEN providing custom sidebar", () => {
    test("THEN return sidebar object", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const sidebarResp = getSidebar(
            [
              {
                type: "note",
                label: "Foo label",
                id: "foo",
              },
              {
                type: "category",
                label: "Some category label",
                link: { type: "note", id: "bar" },
                items: [
                  {
                    type: "autogenerated",
                    id: "foo.ch1",
                  },
                  {
                    type: "note",
                    label: "Some deep note",
                    id: "goo.ends-with-ch1.no-ch1-by-itself",
                  },
                ],
              },
            ],
            { notes: engine.notes }
          );
          expect(sidebarResp.data).toMatchSnapshot();
          expect(sidebarResp.data).toHaveProperty(
            "[1].items[0].items[0].id",
            "foo.ch1.gch1.ggch1"
          );
          expect(sidebarResp.data).toHaveProperty(
            "[1].items[2].id",
            "goo.ends-with-ch1.no-ch1-by-itself"
          );
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupHierarchyForLookupTests,
        }
      );
    });
  });

  describe("WHEN nav_exclude_children is enabled", () => {
    test("THEN return sidebar object", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const domain = engine.notes["foo"];
          domain.custom.nav_exclude_children = true;
          const sidebarResp = getSidebar(
            [{ type: "autogenerated", id: "root" }],
            {
              notes: engine.notes,
            }
          );
          expect(sidebarResp.data).toMatchSnapshot();
          // Expect foo note to have no children
          const fooSidebarItem = sidebarResp.data?.[1];
          expect(fooSidebarItem).toHaveProperty("items", []);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });

  describe("WHEN has_collection is enabled", () => {
    test("THEN return sidebar object", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const domain = engine.notes["foo"];
          domain.custom.has_collection = true;
          const sidebarResp = getSidebar(
            [{ type: "autogenerated", id: "root" }],
            {
              notes: engine.notes,
            }
          );
          expect(sidebarResp.data).toMatchSnapshot();
          // Expect foo note to have no children
          const fooSidebarItem = sidebarResp.data?.[1];
          expect(fooSidebarItem).toHaveProperty("items", []);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });

    describe("AND nav_exclude_children is set to false", () => {
      test("THEN return sidebar object", async () => {
        await runEngineTestV5(
          async ({ engine }) => {
            const domain = engine.notes["foo"];
            domain.custom.has_collection = true;
            domain.custom.nav_exclude_children = false;
            const sidebarResp = getSidebar(
              [{ type: "autogenerated", id: "root" }],
              {
                notes: engine.notes,
              }
            );
            expect(sidebarResp.data).toMatchSnapshot();
            // Expect foo note to have no children
            const fooSidebarItem = sidebarResp.data?.[1];
            expect(fooSidebarItem).toHaveProperty("items", []);
          },
          {
            expect,
            preSetupHook: ENGINE_HOOKS.setupBasic,
          }
        );
      });
    });
  });

  describe("WHEN nav_exclude is enabled", () => {
    test("THEN return sidebar object", async () => {
      await runEngineTestV5(
        async ({ engine }) => {
          const domain = engine.notes["foo"];
          domain.custom.nav_exclude = true;
          const sidebarResp = getSidebar(
            [{ type: "autogenerated", id: "root" }],
            {
              notes: engine.notes,
            }
          );
          expect(sidebarResp.data).toMatchSnapshot();
          // Expect `foo.md` to be not part of the sidebar
          expect(sidebarResp.data).toHaveLength(1);
        },
        {
          expect,
          preSetupHook: ENGINE_HOOKS.setupBasic,
        }
      );
    });
  });
});
