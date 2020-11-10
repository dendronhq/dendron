import { FileTestUtils } from "@dendronhq/common-test-utils";
import { EngineConnector, getPortFilePath } from "@dendronhq/engine-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { beforeEach, describe, it } from "mocha";
import { ExtensionContext } from "vscode";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { onExtension } from "../testUtils";
import { setupCodeWorkspaceV2 } from "../testUtilsv2";

const TIMEOUT = 60 * 1000 * 5;

suite.skip("startup", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let wsRoot: string;
  let cengine: EngineConnector;

  describe("basic", function () {
    beforeEach(async function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      wsRoot = FileTestUtils.tmpDir().name;
      ({} = await setupCodeWorkspaceV2({
        ctx,
        wsRoot,
      }));
      fs.removeSync(getPortFilePath({ wsRoot }));
      cengine = new EngineConnector({ wsRoot, vaults: [] });
    });

    it("no server file", function (done) {
      cengine
        .init({
          onReady: async () => {},
          numRetries: 0,
        })
        .catch((err) => {
          assert.strictEqual(err.msg, "exceeded numTries");
          done();
        });
    });

    it("server file created after init", function (done) {
      cengine.init({
        onReady: async () => {
          assert.ok(!_.isUndefined(cengine.engine));
          done();
        },
      });
      _activate(ctx);
    });

    it.skip("server file with wrong port", function (done) {
      done();
    });

    it("server file created before init", function (done) {
      onExtension({
        action: "activate",
        cb: async () => {
          cengine
            .init({
              onReady: async () => {
                assert.ok(!_.isUndefined(cengine.engine));
                done();
              },
              numRetries: 0,
            })
            .catch((err) => {
              console.log(err);
              throw err;
              done();
            });
        },
      });
      _activate(ctx);
    });
  });
});
