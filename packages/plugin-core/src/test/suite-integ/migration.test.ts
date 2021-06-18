import { WorkspaceService } from "@dendronhq/engine-server";
import { it } from "mocha";
import sinon from "sinon";
import { ExtensionContext } from "vscode";
import { applyMigrationRules } from "../../migration";
import { getWS } from "../../workspace";
import { expect } from "../testUtilsv2";
import { runLegacyMultiWorkspaceTest, setupBeforeAfter } from "../testUtilsV3";

suite("Migration", function () {
  let ctx: ExtensionContext;
  ctx = setupBeforeAfter(this, {
    beforeHook: async () => {},
    afterHook: async () => {
      sinon.restore();
    },
  });

  it("migrate to 46.0", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      onInit: async ({ engine, wsRoot }) => {
        const dendronConfig = engine.config;
        const wsConfig = await getWS().getWorkspaceSettings();
        const wsService = new WorkspaceService({ wsRoot });
        const out = await applyMigrationRules({
          currentVersion: "0.46.1",
          previousVersion: "0.45.0",
          dendronConfig,
          wsConfig,
          wsService,
        });
        expect(out[0].data.changeName).toEqual("update cache");
        expect(out.length).toEqual(1);
        done();
      },
    });
  });
});
