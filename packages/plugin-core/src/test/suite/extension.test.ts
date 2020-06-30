import * as assert from "assert";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";

import { afterEach, before, beforeEach, describe } from "mocha";

// import { DendronFileSystemProvider } from "../../components/fsProvider";
// import _ from "lodash";
// import { fnameToUri } from "../../components/lookup/utils";
// import fs from "fs-extra";
import path from "path";
import { testUtils, FileTestUtils } from "@dendronhq/common-server";
import { DendronWorkspace } from "../../workspace";
import fs from "fs-extra";
import { VSCodeUtils } from "../../utils";
import { DENDRON_WS_NAME } from "../../constants";
// import { testUtils } from "@dendronhq/common-server";

class LernaTestUtils {
    static getRootDir() {
        // TODO: go up until you find lerna.json
        return path.join(__dirname, "../../../../../");
    }
    static getFixturesDir() {
        return path.join(this.getRootDir(), "fixtures");
    }
}

function createMockContext(): vscode.ExtensionContext {
    const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
    return { subscriptions: [], extensionPath: pkgRoot } as any;
};

suite("Extension Test Suite", () => {
    vscode.window.showInformationMessage("Start all tests.");
    let root: string;

    before(async () => {
        const ctx = createMockContext();
        const ws = new DendronWorkspace(ctx, { skipSetup: true });
        root = FileTestUtils.tmpDir("/tmp/dendron");
        await ws.setupWorkspace(root, { skipOpenWS: true });
        const fixtures = LernaTestUtils.getFixturesDir();
        const storeDir = path.join(fixtures, "store");
        console.log(storeDir);
        fs.copySync(storeDir, root);
        console.log(root);
        VSCodeUtils.openWS(path.join(root, DENDRON_WS_NAME));
    });

    describe("Lookup", () => {
        test("sanity", async () => {
            assert.ok(true);
        });
    });


    //   describe("DendronFileSystemProvider", () => {
    //     beforeEach(async () => {
    //       ({ fsp, testRoot } = await setup());
    //     });
    //     afterEach(() => {
    //       fs.removeSync(testRoot);
    //     });

    //     describe("create new", () => {
    //       describe("parent: root", () => {
    //         test("child: root/domain", async () => {
    //           const uri = await fnameToUri("baz", { checkIfDirectoryFile: false });
    //           await fsp.writeFile(uri, Buffer.from("baz.body"), {
    //             create: true,
    //             overwrite: true,
    //             writeToEngine: true,
    //           });
    //           const note = _.find(fsp.engine.notes, { fname: "baz" });
    //           checkFiles(assert, testRoot, { additions: ["baz"] });
    //           assert.ok(!_.isUndefined(note));
    //         });

    //         test("grandchild, node: root/domain/node", async () => {
    //           const fname = "foo.three";
    //           const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
    //           await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
    //             create: true,
    //             overwrite: true,
    //             writeToEngine: true,
    //           });
    //           checkFiles(assert, testRoot, { additions: [fname] });
    //         });

    //         test("grandchild, stub: root/stub/node", async () => {
    //           const fname = "baz.one";
    //           const uri = await fnameToUri(fname, { checkIfDirectoryFile: false });
    //           await fsp.writeFile(uri, Buffer.from(`${fname}.body`), {
    //             create: true,
    //             overwrite: true,
    //             writeToEngine: true,
    //           });
    //           checkFiles(assert, testRoot, { additions: [fname] });
    //         });
    //       });

    //       describe("parent: domain", () => {
    //         test("child: domain/node", async () => {
    //           await checkSingleAddition(assert, fsp, testRoot, "foo.three");
    //         });

    //         test("grandchild, stub: domain/stub/node", async () => {
    //           await checkSingleAddition(assert, fsp, testRoot, "foo.beta.one");
    //         });

    //         test("grandchild, node: domain/node/node", async () => {
    //           await checkSingleAddition(assert, fsp, testRoot, "foo.alpha.three");
    //         });
    //       });

    //       describe.only("edge", () => {
    //         test("(grandchild,stub), (child, node)", async () => {
    //           await checkSingleAddition(assert, fsp, testRoot, "foo.beta.one");
    //           await checkSingleAddition(assert, fsp, testRoot, "foo.beta");
    //         });
    //       });
    //     });
    //   });
});
