import test from "./next-fixture";
import { expect } from "@playwright/test";

/**
 * Sample test for playwright
 *
 * 1. To run all tests under /tests, `yarn test` from within the `nextjs-template` directory
 * 2. To run all tests without building application everytime, `yarn test:skipbuild`
 * 3. To run just this test file, `npx playwright test tests/example.spec.ts` from within the `nextjs-template` directory
 * 4. To skip build while testing this test file, `SKIP_BUILD=1 npx playwright test tests/example.spec.ts`
 */
test("Test home page", async ({ page, port }) => {
  await page.goto(`http://localhost:${port}/`);
  const name = await page.innerText("h1");
  expect(name).toBe("Dendron");
});
