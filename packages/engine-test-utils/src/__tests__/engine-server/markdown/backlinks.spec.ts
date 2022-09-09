import { ConfigUtils } from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { AssertUtils, NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { getParsingDependencyDicts, MDUtilsV5 } from "@dendronhq/unified";
import { runEngineTestV5, TestConfigUtils } from "../../..";

describe("backlinks", () => {
  describe("frontmatter tags", () => {
    test("single", async () => {
      await runEngineTestV5(
        async ({ wsRoot, vaults, engine }) => {
          const config = DConfig.readConfigSync(wsRoot);
          const vault = vaults[0];
          const noteToRender = (
            await engine.findNotes({ fname: "tags.test", vault })
          )[0];
          const noteCacheForRenderDict = await getParsingDependencyDicts(
            noteToRender,
            engine,
            config,
            vaults
          );
          const resp = await MDUtilsV5.procRehypeFull({
            noteToRender,
            noteCacheForRenderDict,
            vault,
            fname: "tags.test",
            config,
            vaults,
          }).process("");
          // should be one backlink
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents as string,
              match: [`<a href="one.html">One (vault1)</a>`],
            })
          ).toBeTruthy();
        },
        {
          expect,
          preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            const vault = vaults[0];
            await NoteTestUtilsV4.createNote({
              fname: "one",
              vault,
              wsRoot,
              props: {
                tags: "test",
              },
            });
            await NoteTestUtilsV4.createNote({
              fname: "tags.test",
              vault,
              wsRoot,
            });
            TestConfigUtils.withConfig(
              (config) => {
                const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
                ConfigUtils.setVaults(
                  v4DefaultConfig,
                  ConfigUtils.getVaults(config)
                );
                return v4DefaultConfig;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });

    test("multiple", async () => {
      await runEngineTestV5(
        async ({ wsRoot, vaults, engine }) => {
          const config = DConfig.readConfigSync(wsRoot);
          const vault = vaults[0];
          const noteToRender = (
            await engine.findNotes({ fname: "tags.test", vault })
          )[0];
          const noteCacheForRenderDict = await getParsingDependencyDicts(
            noteToRender,
            engine,
            config,
            vaults
          );
          const resp = await MDUtilsV5.procRehypeFull({
            noteToRender,
            noteCacheForRenderDict,
            vault,
            fname: "tags.test",
            config,
            vaults,
          }).process("");
          // should be one backlink
          expect(resp).toMatchSnapshot();
          expect(
            await AssertUtils.assertInString({
              body: resp.contents as string,
              match: [
                `<a href="one.html">One (vault1)</a>`,
                `<a href="two.html">Two (vault1)</a>`,
              ],
            })
          ).toBeTruthy();
        },
        {
          expect,
          preSetupHook: async (opts) => {
            const { wsRoot, vaults } = opts;
            const vault = vaults[0];
            await NoteTestUtilsV4.createNote({
              fname: "one",
              vault,
              wsRoot,
              props: {
                tags: ["test", "other"],
              },
            });

            await NoteTestUtilsV4.createNote({
              fname: "two",
              vault,
              wsRoot,
              props: {
                tags: "test",
              },
            });
            await NoteTestUtilsV4.createNote({
              fname: "tags.test",
              vault,
              wsRoot,
            });
            TestConfigUtils.withConfig(
              (config) => {
                const v4DefaultConfig = ConfigUtils.genDefaultV4Config();
                ConfigUtils.setVaults(
                  v4DefaultConfig,
                  ConfigUtils.getVaults(config)
                );
                return v4DefaultConfig;
              },
              { wsRoot: opts.wsRoot }
            );
          },
        }
      );
    });
  });
  //
  test("hashtag", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const config = DConfig.readConfigSync(wsRoot);
        const vault = vaults[0];
        const noteToRender = (
          await engine.findNotes({ fname: "tags.test", vault })
        )[0];
        const noteCacheForRenderDict = await getParsingDependencyDicts(
          noteToRender,
          engine,
          config,
          vaults
        );
        const resp = await MDUtilsV5.procRehypeFull({
          noteToRender,
          noteCacheForRenderDict,
          vault,
          fname: "tags.test",
          config,
          vaults,
        }).process("");
        // should be one backlink
        expect(resp).toMatchSnapshot();
        expect(
          await AssertUtils.assertInString({
            body: resp.contents as string,
            match: [`<a href="one">One (vault1)</a>`],
          })
        ).toBeTruthy();
      },
      {
        expect,
        preSetupHook: async (opts) => {
          const { wsRoot, vaults } = opts;
          const vault = vaults[0];
          await NoteTestUtilsV4.createNote({
            fname: "one",
            vault,
            wsRoot,
            body: "#test",
          });
          await NoteTestUtilsV4.createNote({
            fname: "tags.test",
            vault,
            wsRoot,
          });
        },
      }
    );
  });
});
