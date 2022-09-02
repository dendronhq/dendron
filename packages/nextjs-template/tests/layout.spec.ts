import test from "./next-fixture";
import { expect } from "@playwright/test";

test.describe("GIVEN mobile viewport", () => {
  test.use({ viewport: { width: 600, height: 900 } });
  test("THEN layout should be safe", async ({ page, port }) => {
    await page.goto(`http://localhost:${port}/notes/ufzjlbxfti6endd1o6egr6r/`);
    expect(await page.screenshot({ fullPage: true })).toMatchSnapshot(
      "safe-layout.png"
    );
  });
});
