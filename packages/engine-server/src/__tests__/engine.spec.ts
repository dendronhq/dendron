import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { getOrCreateEngine } from "../engine";
import { expectSnapshot, setupTmpDendronDir, FixtureUtils } from "../testUtils";
import { FileTestUtils } from "@dendronhq/common-server/src";

// function checkNodeCreated(expect: jest.Expect) {
// }

describe("engine", () => {
    let root: string;
    const queryMode = "note";
    let actualFiles: string[];
    let expectedFiles: string[];

    beforeEach(() => {
        root = setupTmpDendronDir();
    });

    afterEach(() => {
        expect(actualFiles).toEqual(expectedFiles);
        fs.removeSync(root);
    });

    describe("main", () => {
        test("sanity", async () => {
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("foo", queryMode);
            expect((await resp).data[0].title).toEqual("foo");
            ([expectedFiles, actualFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles()));
        });
    });

    describe("edge", () => {
        test("md exist, no schema file", async () => {
            fs.unlinkSync(path.join(root, "foo.schema.yml"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("root", "schema");
            expect((await resp).data[0].fname).toEqual("root.schema");
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
                add: ["root.schema.yml"],
                remove: ["foo.schema.yml"]
            }));
        });

        test("no md file, schema exist", async () => {
            fs.unlinkSync(path.join(root, "root.md"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
            const fooNote = (await engine.query("foo", "note")).data[0];
            expect(fooNote.fname).toEqual("foo");
            expectSnapshot(expect, "fooNote", fooNote);
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
            }));
        });

        test("no md file, no schema ", async () => {
            fs.unlinkSync(path.join(root, "foo.schema.yml"));
            fs.unlinkSync(path.join(root, "root.md"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("root", "note");
            expect((await resp).data[0].fname).toEqual("root");
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
                add: ["root.schema.yml"],
                remove: ["foo.schema.yml"]
            }));
        });

        test("note without id", async () => {
            fs.unlinkSync(path.join(root, "foo.md"));
            FileTestUtils.writeMDFile(root, "foo.md", {}, "this is foo");
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
            }));
            const fooNote = (await engine.query("foo", "note")).data[0];
            expect(fooNote.fname).toEqual("foo");
            expectSnapshot(expect, "fooNote", fooNote);
        });

        test("note without fm", async () => {
            fs.unlinkSync(path.join(root, "foo.md"));
            fs.writeFileSync(path.join(root, "foo.md"), "this is foo");
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            const fooNote = (await engine.query("foo", "note")).data[0];
            expect(fooNote.fname).toEqual("foo");
            expectSnapshot(expect, "fooNote", fooNote);
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
            }));
        });
    });
});
