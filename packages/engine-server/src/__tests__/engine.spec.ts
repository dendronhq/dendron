import FileStorage from "../drivers/file/store";
import { setupTmpDendronDir, createFileStorage, expectSnapshot } from "../testUtils";
import _ from "lodash";
import { getOrCreateEngine } from "../engine";
import fs from "fs-extra";
import path from "path";

describe("engine", () => {
    let root: string;
    let store: FileStorage;

    beforeEach(() => {
        root = setupTmpDendronDir();
    });

    test("sanity", async () => {
        const engine = getOrCreateEngine({ root });
        await engine.init();
        expectSnapshot(expect, "main", _.values(engine.notes));
    });

    describe("edge", () => {

        test("md exist, no schema file", async () => {
            fs.unlink(path.join(root, "foo.schema.yml"));
            const engine = getOrCreateEngine({ root });
            await engine.init();
            expect(fs.readdirSync(root)).toMatchSnapshot("listDir");
            expectSnapshot(expect, "main", _.values(engine.notes));
        });
    });
});