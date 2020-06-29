import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { getOrCreateEngine } from "../engine";
import { expectSnapshot, setupTmpDendronDir } from "../testUtils";

describe("engine", () => {
    let root: string;

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
