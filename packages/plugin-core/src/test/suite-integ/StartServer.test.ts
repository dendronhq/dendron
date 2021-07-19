import { TestEngineUtils } from "@dendronhq/engine-test-utils";
import { describe } from "mocha";
import { SinonStub } from "sinon";
import { ExtensionContext } from "vscode";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { execServer } from "../../_server";
import { expect, resetCodeWorkspace } from "../testUtilsv2";
import { setupBeforeAfter } from "../testUtilsV3";

suite("StartServer", function () {
  let homeDirStub: SinonStub;

  const ctx: ExtensionContext = setupBeforeAfter(this, {
    beforeHook: async () => {
      await resetCodeWorkspace();
      await new ResetConfigCommand().execute({ scope: "all" });
      homeDirStub = TestEngineUtils.mockHomeDir();
    },
    afterHook: async () => {
      homeDirStub.restore();
    },
  });

	describe("basic", function() {

		test("ok", function(done) {
			execServer({logPath: "/tmp"}).then(({port}) => {
				expect(port > 0).toBeTruthy();
				done();
			});
		});

		// test("ok: custom port", function(done) {
		// 	execServer({logPath: "/tmp"}).then(port => {
		// 		expect(port > 0).toBeTruthy();
		// 		done();
		// 	});
		// 	// execa("node", [file], {env: {
		// 	// 	LOG_PATH: "/tmp"
		// 	// }}).then(({stdout, stderr})=> {
		// 	// 	expect(parseInt(stdout, 10) > 0).toBeTruthy();
		// 	// 	expect(_.isEmpty(stderr)).toBeTruthy();
		// 	// 	done();
		// 	// })
		// });
	});
});
