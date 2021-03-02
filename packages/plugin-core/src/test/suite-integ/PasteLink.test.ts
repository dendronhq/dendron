import { sinon } from "@dendronhq/common-test-utils";
import ogs from "open-graph-scraper";
import * as vscode from "vscode";
import { PasteLinkCommand } from "../../commands/PasteLink";
import * as utils from "../../utils";
import { clipboard } from "../../utils";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

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

suite("pasteLink", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {});
  test("basic", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async () => {
        sinon
          .stub(clipboard, "readText")
          .returns(Promise.resolve("https://dendron.so"));
        sinon
          .stub(utils, "getOpenGraphMetadata")
          .returns(Promise.resolve(DEFAULT_OPENGRAPH_RESPONSE_SUCCESS));

        const formattedLink = await new PasteLinkCommand().run();
        expect(formattedLink).toEqual(`[Dendron Home](https://dendron.so)`);
        done();
      },
    });
  });

  test("basic failure (internet down)", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async () => {
        sinon
          .stub(clipboard, "readText")
          .returns(Promise.resolve("https://dendron.so"));
        sinon
          .stub(utils, "getOpenGraphMetadata")
          .returns(Promise.resolve(DEFAULT_OPENGRAPH_RESPONSE_FAIL));

        const formattedLink = await new PasteLinkCommand().run();
        expect(formattedLink).toEqual(
          `[https://dendron.so](https://dendron.so)`
        );
        done();
      },
    });
  });
});
