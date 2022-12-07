import os from "os";
import path from "path";
import { chromium } from "playwright";
import { playAudit } from "@dendronhq/engine-test-utils";
import test from "../e2e/next-fixture";

test.setTimeout(0);
test.describe("GIVEN AUDIT, WHEN shared chrome instance, ", () => {
  test("THEN run audit on desktop", async ({ url }) => {
    const userDataDir = path.join(os.tmpdir(), "pw", String(Math.random()));
    const context = await chromium.launchPersistentContext(userDataDir, {
      args: ["--remote-debugging-port=9222"],
    });

    await playAudit({
      url,
      port: 9222,
      options: {},
      reports: { directory: ".dendron.audit" },
      formFactor: "desktop",
    });
    await context.close();
  });
});
