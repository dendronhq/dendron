import { FileTestUtils } from "@dendronhq/common-server";
import { isRepo } from "../git";

describe("isRepo", async () => {
  test("no repo", async () => {
    const root = FileTestUtils.tmpDir().name;
    expect(isRepo(root)).toBeFalsy();
  });
});
