import { env } from "@dendronhq/common-all";
import { AssertUtils } from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import path from "path";
import { DiagnosticsReportCommand } from "../../commands/DiagnosticsReport";
import { VSCodeUtils } from "../../vsCodeUtils";
import { expect } from "../testUtilsv2";
import { describeMultiWS } from "../testUtilsV3";

suite("GIVEN DiagnosticsReport", function () {
  describeMultiWS(
    "WHEN run Diagnostics Report",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
    },
    () => {
      test("THEN generate diagnostics report", async () => {
        const logDst = path.join(
          path.dirname(env("LOG_DST")),
          "dendron.server.log"
        );
        fs.writeFileSync(logDst, "foobar", { encoding: "utf8" });
        const cmd = new DiagnosticsReportCommand();
        await cmd.execute();

        const editor = VSCodeUtils.getActiveTextEditor();
        const body = editor?.document.getText() as string;
        const isInString = await AssertUtils.assertInString({
          body,
          match: ["foobar", "Dendron Config", "Plugin Logs", "Workspace File"],
        });
        expect(isInString).toBeTruthy();
      });
    }
  );
});
