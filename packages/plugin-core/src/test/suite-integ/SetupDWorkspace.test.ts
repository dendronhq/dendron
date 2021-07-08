import { FileTestUtils } from "@dendronhq/common-test-utils";
import { EngineConnector, getPortFilePath } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import { beforeEach, describe, it } from "mocha";
import { ExtensionContext } from "vscode";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { _activate } from "../../_extension";
import { onExtension } from "../testUtils";
import { expect, setupCodeWorkspaceV2 } from "../testUtilsv2";

const TIMEOUT = 60 * 1000 * 5;

suite.skip("startup", function () {
  this.timeout(TIMEOUT);
  let ctx: ExtensionContext;
  let wsRoot: string;
  let cengine: EngineConnector;

  describe("basic", () => {
    beforeEach(async () => {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
      wsRoot = FileTestUtils.tmpDir().name;
      ({} = await setupCodeWorkspaceV2({
        ctx,
        wsRoot,
      }));
      fs.removeSync(getPortFilePath({ wsRoot }));
      cengine = new EngineConnector({ wsRoot });
    });

    it("no server file", (done) => {
      cengine
        .init({
          onReady: async () => {},
          numRetries: 0,
        })
        .catch((err) => {
          expect(err.msg).toEqual("exceeded numTries");
          done();
        });
    });

    it("server file created after init", (done) => {
      cengine.init({
        onReady: async () => {
          expect(_.isUndefined(cengine.engine)).toBeFalsy();
          done();
        },
      });
      _activate(ctx);
    });

    it.skip("server file with wrong port", (done) => {
      done();
    });

    it("server file created before init", (done) => {
      onExtension({
        action: "activate",
        cb: async () => {
          cengine
            .init({
              onReady: async () => {
                expect(_.isUndefined(cengine.engine)).toBeFalsy();
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
