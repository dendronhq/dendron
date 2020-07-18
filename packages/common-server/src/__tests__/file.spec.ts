import { cleanFileName } from "../files";

describe("cleanFileName", () => {
    test("cleanFileName", () => {
        expect(cleanFileName("foo")).toEqual("foo");
    });

    test("cleanFileName", () => {
        expect(cleanFileName("Data/1 foo.md")).toEqual("data.1-foo");
    });
});