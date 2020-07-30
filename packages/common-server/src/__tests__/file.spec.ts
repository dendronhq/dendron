import { cleanFileName } from "../files";

describe("cleanFileName", () => {
  test("cleanFileName", () => {
    expect(cleanFileName("foo")).toEqual("foo");
  });

  // TODO: doesn't work on windows
  test.skip("cleanFileName", () => {
    expect(cleanFileName("Data/1 foo.md")).toEqual("data.1-foo");
  });
});
