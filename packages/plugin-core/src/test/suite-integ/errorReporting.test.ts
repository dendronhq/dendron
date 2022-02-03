import { error2PlainObject } from "@dendronhq/common-all";
import {
  isBadErrorThatShouldBeSampled,
  rewriteFilename,
} from "@dendronhq/common-server";
import { expect } from "../testUtilsv2";

suite("WHEN a stack trace is sent to sentry", () => {
  test("THEN rewriteFilename() correctly strips down and rewrites the file names", () => {
    // A selection of real stack traces from sentry
    expect(
      rewriteFilename(
        "/Users/test_user/code_dendron/dendron/packages/plugin-core/out/src/_extension.js"
      )
    ).toEqual("app:///packages/plugin-core/out/src/_extension.js");

    expect(
      rewriteFilename(
        "c:\\Users\\some_username\\.vscode\\extensions\\dendron.dendron-0.79.0\\dist\\server.js"
      )
    ).toEqual("app:///dist/server.js");

    expect(
      rewriteFilename(
        "/Users/another_username/.vscode/extensions/dendron.dendron-0.79.0/dist/extension.js"
      )
    ).toEqual("app:///dist/extension.js");

    expect(
      rewriteFilename(
        "/home/username/.vscode-insiders/extensions/dendron.dendron-0.79.0/dist/extension.js"
      )
    ).toEqual("app:///dist/extension.js");

    expect(
      rewriteFilename(
        "/Users/user.test/.vscode-insiders/extensions/dendron.nightly-0.79.4/dist/extension.js"
      )
    ).toEqual("app:///dist/extension.js");
  });

  test("THEN isBadErrorThatShouldBeSampled() correctly detects errors we want sample", () => {
    const error = new Error(
      "ENOENT: no such file or directory, open '/Users/someone/some/path/to/dendron.yml'"
    );
    expect(isBadErrorThatShouldBeSampled(error)).toBeTruthy();
    expect(
      isBadErrorThatShouldBeSampled(error2PlainObject(error))
    ).toBeTruthy();

    expect(
      isBadErrorThatShouldBeSampled(new Error("some other error"))
    ).toBeFalsy();
  });
});
