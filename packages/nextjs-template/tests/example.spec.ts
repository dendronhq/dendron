import test from "./next-fixture";
import { expect } from "@playwright/test";

test("Test home page", async ({ page, port }) => {
  await page.goto(`http://localhost:${port}/`);
  const name = await page.innerText("h1");
  expect(name).toBe("Dendron");
});
