import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { getOrCreateEngine } from "../engine";
import { expectSnapshot, setupTmpDendronDir, FixtureUtils } from "../testUtils";
import { FileTestUtils } from "@dendronhq/common-server/src";

describe("engine", () => {
    let root: string;
    const queryMode = "note";

    beforeEach(() => {
        root = setupTmpDendronDir();
    });

    afterEach(() => {
        fs.removeSync(root);
    });

    describe("main", () => {
        test("sanity", async () => {
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("foo", queryMode);
            expect((await resp).data[0].title).toEqual("foo");
            const files = FileTestUtils.cmpFiles(root, FixtureUtils.fixtureFiles());
            expect(files[0]).toEqual(files[1]);
        });
    });

    describe("edge", () => {
        test("md exist, no schema file", async () => {
            fs.unlink(path.join(root, "foo.schema.yml"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("root", "schema");
            expect((await resp).data[0].fname).toEqual("root.schema");
        });

        test("no md file, schema exist", async () => {
            fs.unlink(path.join(root, "root.md"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("root", "note");
            expect((await resp).data[0].fname).toEqual("root");
        });

        test("no md file, no schema ", async () => {
            fs.unlink(path.join(root, "foo.schema.yml"));
            fs.unlink(path.join(root, "root.md"));
            const engine = getOrCreateEngine({ root, forceNew: true });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
            const resp = engine.query("root", "note");
            expect((await resp).data[0].fname).toEqual("root");
        });
    });
});
