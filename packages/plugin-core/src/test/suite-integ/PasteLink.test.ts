import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import ogs from "open-graph-scraper";
import sinon from "sinon";
import { PasteLinkCommand } from "../../commands/PasteLink";
import { ExtensionProvider } from "../../ExtensionProvider";
import * as utils from "../../utils";
import { WSUtils } from "../../WSUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS, setupBeforeAfter } from "../testUtilsV3";

// Avoid https://minaluke.medium.com/how-to-stub-spy-a-default-exported-function-a2dc1b580a6b
// function fakeDefaultExport(moduleRelativePath: string, stubs: any) {
//   if (require.cache[require.resolve(moduleRelativePath)]) {
//     delete require.cache[require.resolve(moduleRelativePath)];
//   }
//   Object.keys(stubs).forEach(dependencyRelativePath => {
//     require.cache[require.resolve(dependencyRelativePath)] = {
//       exports: stubs[dependencyRelativePath],
//     } as any;
//   });
//   return require(moduleRelativePath);
// };

const DEFAULT_OPENGRAPH_RESPONSE_SUCCESS = {
  error: false,
  result: { ogTitle: "Dendron Home" },
} as ogs.SuccessResult;
const DEFAULT_OPENGRAPH_RESPONSE_FAIL = { error: true } as ogs.ErrorResult;

const OPENGRAPH_RESPONSE_SUCCESS_NOTTRIMMED = {
  error: false,
  result: { ogTitle: "\n \t Dendron Home \n \t " },
} as ogs.SuccessResult;

// TODO: issues with stubbing proprty using sinon
suite("pasteLink", function () {
  const ctx = setupBeforeAfter(this);

  describeMultiWS(
    "WHEN pasting regular link",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      ctx,
    },
    () => {
      test("THEN gets link with metadata", async () => {
        // You can access the workspace inside the test like this:
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = (await engine.getNoteMeta("foo")).data!;
        await WSUtils.openNote(note);
        utils.clipboard.writeText("https://dendron.so");
        sinon
          .stub(utils, "getOpenGraphMetadata")
          .returns(Promise.resolve(DEFAULT_OPENGRAPH_RESPONSE_SUCCESS));

        const formattedLink = await new PasteLinkCommand().run();
        expect(formattedLink).toEqual(`[Dendron Home](https://dendron.so)`);
      });
    }
  );

  describeMultiWS(
    "WHEN pasting link without trimmed title",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      ctx,
    },
    () => {
      test("THEN trims link title", async () => {
        // You can access the workspace inside the test like this:
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = (await engine.getNoteMeta("foo")).data!;
        await WSUtils.openNote(note);
        utils.clipboard.writeText("https://dendron.so");
        sinon
          .stub(utils, "getOpenGraphMetadata")
          .returns(Promise.resolve(OPENGRAPH_RESPONSE_SUCCESS_NOTTRIMMED));

        const formattedLink = await new PasteLinkCommand().run();
        expect(formattedLink).toEqual(`[Dendron Home](https://dendron.so)`);
      });
    }
  );

  describeMultiWS(
    "WHEN pasting link without connection",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      ctx,
    },
    () => {
      test("THEN gets raw link", async () => {
        // You can access the workspace inside the test like this:
        const { engine } = ExtensionProvider.getDWorkspace();
        const note = (await engine.getNoteMeta("foo")).data!;
        await WSUtils.openNote(note);
        utils.clipboard.writeText("https://dendron.so");
        sinon
          .stub(utils, "getOpenGraphMetadata")
          .returns(Promise.resolve(DEFAULT_OPENGRAPH_RESPONSE_FAIL));
        const formattedLink = await new PasteLinkCommand().run();
        expect(formattedLink).toEqual(`<https://dendron.so>`);
      });
    }
  );
});
