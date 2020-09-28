import { DendronAPI } from "@dendronhq/common-all";
import { tmpDir } from "@dendronhq/common-server";

describe("main", () => {
  let root: string;

  beforeEach(() => {
    root = tmpDir().name;
  });

  test("one", () => {
    const api = new DendronAPI({ endpoint: "localhost:3005", apiPath: "api" });
    api.workspaceInit({ uri: root, config: {} });
    expect(1).toEqual(1);
  });
});
