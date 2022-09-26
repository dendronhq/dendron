import test from "./next-fixture";
import { expect } from "@playwright/test";

test.describe("GIVEN default viewport", () => {
  test("THEN should display heading anchor pleasantly ", async ({
    page,
    port,
  }) => {
    await page.goto(`http://localhost:${port}/notes/FSi3bKWQeQXYTjE1PoTB0/`);

    const case1 = page.locator("#start-code-end");
    await case1.hover();
    expect(await case1.screenshot()).toMatchSnapshot([
      "heading-anchor",
      "start-code-end.png",
    ]);

    const case2 = page.locator("#start---end");
    await case2.hover();
    expect(await case2.screenshot()).toMatchSnapshot([
      "heading-anchor",
      "start---end.png",
    ]);

    const case3 = page.locator("#start-_-end");
    await case3.hover();
    expect(await case3.screenshot()).toMatchSnapshot([
      "heading-anchor",
      "start-_-end.png",
    ]);

    const case4 = page.locator("#start-test-end");
    await case4.hover();
    expect(await case4.screenshot()).toMatchSnapshot([
      "heading-anchor",
      "start-test-end.png",
    ]);

    const case5 = page.locator("#start-exampleusername-private-end");
    await case5.hover();
    expect(await case5.screenshot()).toMatchSnapshot([
      "heading-anchor",
      "start-exampleusername-private-end.png",
    ]);
  });

  test.describe("AND having NEXT_PUBLIC_ASSET_PREFIX set", () => {
    test("THEN should render path to favicon", async ({ page, port }) => {
      await page.goto(`http://localhost:${port}/`);
      const locator = page.locator(
        `link[href*='${process.env.NEXT_PUBLIC_ASSET_PREFIX}'][rel='icon']`
      );
      expect(await locator.count()).toBe(1);
    });
  });
});

test.describe("GIVEN mobile viewport", () => {
  test.use({ viewport: { width: 400, height: 900 } });
  test("THEN layout should be safe", async ({ page, port }) => {
    await page.goto(`http://localhost:${port}/notes/ufzjlbxfti6endd1o6egr6r/`);
    expect(await page.locator(".main-content").screenshot()).toMatchSnapshot([
      "layout",
      "safe-layout.png",
    ]);
  });
});
