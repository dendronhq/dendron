import { INoteOpts, Note, testUtils } from "@dendronhq/common-all";
import { FileTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { getOrCreateEngine } from "../engine";
import { FixtureUtils, setupTmpDendronDir } from "../testUtils";

// function checkNodeCreated(expect: jest.Expect) {
// }

function expectNoteProps(expect: jest.Expect, note: Note, expectedProps: INoteOpts) {
    const propsToCheck = ["fname"].concat(_.keys(expectedProps));
    expect(_.pick(note, propsToCheck)).toEqual(expectedProps);
}

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
        test("fetch node", async () => {
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("foo", queryMode);
            expect((await resp).data[0].title).toEqual("foo");
            ([expectedFiles, actualFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles()));
        });

        test.skip("node has same attributes when re-initializing engine", async () => {
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            //const noteValues = _.values(engine.notes);
            const root1: Note = engine.notes.root;
            const engine2 = getOrCreateEngine({ root, forceNew: true });
            await engine2.init();
            //const noteValues2 = _.values(engine.notes);
            const root2: Note = engine2.notes.root;
            expect(root1.toRawPropsRecursive()).toEqual(root2.toRawPropsRecursive());
            ([expectedFiles, actualFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles()));
        });
    });

    describe("main", () => {

        test("open stub node", async () => {
            FileTestUtils.writeMDFile(root, "bar.two.md", {}, "bar.two.body");
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("bar.two", queryMode);
            expect((await resp).data[0].fname).toEqual("bar.two");

            const resp2 = engine.query("bar", queryMode);
            expect((await resp2).data[0].fname).toEqual("bar");
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir2");

            ([expectedFiles, actualFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
                add: ["bar.two.md"]
            }));
        });

        test("delete node with no children", async () => {
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            const numNodesPre = _.values(engine.notes).length;
            const fooNode = await engine.queryOne("foo.one", "note");
            await engine.delete(fooNode.data.id);
            // should be less nodes
            expect(numNodesPre - 1).toEqual(_.values(engine.notes).length);
            const resp = await engine.query("foo", "note");
            // start of with three foo nodes, end up with two
            expect(resp.data.length).toEqual(2);
            // file should not be there
            ([expectedFiles, actualFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
                remove: ["foo.one.md"]
            }));
        });

        test("delete node with children", async () => {
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            const fooNode = await engine.queryOne("foo", "note");
            await engine.delete(fooNode.data.id);
            expect(fs.readdirSync(root)).toMatchSnapshot("listDi2");
            const numNodesPre = _.values(engine.notes).length;
            testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
            const deletedNode = engine.notes[fooNode.data.id];
            expectNoteProps(expect, deletedNode, { fname: "foo", stub: true });
            // size should be the same
            expect(numNodesPre).toEqual(_.values(engine.notes).length);
            testUtils.expectSnapshot(expect, "main2", _.values(engine.notes));
            // foo file should be deleted
            ([expectedFiles, actualFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
                remove: ["foo.md"]
            }));
        });
    });

    describe("edge", () => {
        test("md exist, no schema file", async () => {
            fs.unlinkSync(path.join(root, "foo.schema.yml"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
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
            testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
            const fooNote = (await engine.query("foo", "note")).data[0];
            expect(fooNote.fname).toEqual("foo");
            testUtils.expectSnapshot(expect, "fooNote", fooNote);
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
            }));
        });

        test("no md file, no schema ", async () => {
            fs.unlinkSync(path.join(root, "foo.schema.yml"));
            fs.unlinkSync(path.join(root, "root.md"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            testUtils.expectSnapshot(expect, "main", _.values(engine.notes));
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
            testUtils.expectSnapshot(expect, "fooNote", fooNote);
        });

        test("note without fm", async () => {
            fs.unlinkSync(path.join(root, "foo.md"));
            fs.writeFileSync(path.join(root, "foo.md"), "this is foo");
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            const fooNote = (await engine.query("foo", "note")).data[0];
            expect(fooNote.fname).toEqual("foo");
            testUtils.expectSnapshot(expect, "fooNote", fooNote);
            ([actualFiles, expectedFiles] = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles(), {
            }));
        });
    });
});
