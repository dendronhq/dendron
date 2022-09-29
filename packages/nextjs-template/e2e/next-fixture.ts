/* eslint-disable no-empty-pattern */
import { createServer, Server } from "http";
import { parse } from "url";
import { test as base } from "@playwright/test";
import next from "next";
import path from "path";
import { AddressInfo } from "net";
import importFresh from "import-fresh";
import type { env } from "../env/server";

/**
 * We will use a new Playwright Test feature called Fixtures to boot one instance of our built application for each test worker.
 * Playwright uses multiple workers to parallelise the tests.
 * Each worker will get its own instance of our application, so that the the tests and their mocks do not interfere with each other.
 * Test fixtures also allow Playwright Test to retry specific tests instead of rerunning the whole suite.
 *
 * This file defines a fixture called port.
 * That fixture will start our prebuilt Next.js server on a random port.
 * It will then provide the random port to the test spec files using await use(port).
 * This allows our tests to know which port the application is running.
 */

// Extend base test with our fixtures.
const test = base.extend<
  {
    url: string;
  },
  {
    options: { port: string; basePath: string; env: typeof env };
  }
>({
  options: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const app = next({
        dev: false,
        dir: path.resolve(__dirname, ".."),
      });
      await app.prepare();
      const handle = app.getRequestHandler();
      // start next server on arbitrary port
      const server: Server = await new Promise((resolve) => {
        const server = createServer((req, res) => {
          if (req.url) {
            const parsedUrl = parse(req.url, true);
            handle(req, res, parsedUrl);
          }
        });
        server.listen((error: any) => {
          if (error) throw error;
          resolve(server);
        });
      });
      // get the randomly assigned port from the server
      const port = String((server.address() as AddressInfo).port);

      // now that nextjs has loaded env-vars through dotenv (behind the curtain) we can "fetch" them
      // import-from allows us to request without cache
      const { env } = importFresh("../env/server");
      const basePath = env.NEXT_PUBLIC_ASSET_PREFIX;

      // provide port to tests
      await use({ port, basePath, env });
    },
    {
      scope: "worker",
    },
  ],
  url: [
    async ({ options: { port, basePath }, baseURL }, use) => {
      const url = new URL(basePath ?? "/", `${baseURL}:${port}/`);
      await use(url.toString());
    },
    { scope: "test" },
  ],
});

// this "test" can be used in multiple test files,
// and each of them will get the fixtures.
export default test;
