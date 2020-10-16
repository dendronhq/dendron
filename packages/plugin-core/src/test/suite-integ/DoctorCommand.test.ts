import { NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, FileTestUtils } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, beforeEach } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DoctorCommand } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSInit, setupDendronWorkspace, TIMEOUT } from "../testUtils";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let vaultPath: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const testFile = path.join(root.name, "vault", "bond2.md");
      fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
      await new ReloadIndexCommand().run();
      await new DoctorCommand().run();
      // cehck taht frontmatter is added
      const resp = fs.readFileSync(testFile, { encoding: "utf8" });
      assert.ok(NoteUtilsV2.RE_FM.exec(resp));
      assert.ok(NoteUtilsV2.RE_FM_UPDATED.exec(resp));
      assert.ok(NoteUtilsV2.RE_FM_CREATED.exec(resp));
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test("missing doc folder", (done) => {
    onWSInit(async () => {
      const testFile = path.join(root.name, "vault", "bond2.md");
      fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
      fs.removeSync(path.join(root.name, "docs"));
      await new ReloadIndexCommand().run();
      const findings = await new DoctorCommand().run();
      assert.ok(_.find(findings?.data, { issue: "no siteRoot found" }));
      const docsDir = path.join(root.name, "docs");
      assert.ok(fs.existsSync(docsDir));
      assert.deepStrictEqual(fs.readdirSync(docsDir), [
        "404.md",
        "Gemfile",
        "_config.yml",
        "assets",
        "docs",
        "favicon.ico",
      ]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        vaultPath = vaultDir;
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });
});

// describe("DoctorCommand", function () {
//     test("basic", function (done) {
//       onWSInit(async () => {
//         const testFile = path.join(root.name, "vault", "bond2.md");
//         fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
//         await new ReloadIndexCommand().run();
//         await new DoctorCommand().run();
//         const nodeProps = mdFile2NodeProps(testFile);
//         assert.equal(_.trim(nodeProps.title), "Bond2");
//         assert.ok(nodeProps.id);
//         done();
//       });
//       setupDendronWorkspace(root.name, ctx);
//     });

//     test("missing doc folder", function (done) {
//       onWSInit(async () => {
//         const testFile = path.join(root.name, "vault", "bond2.md");
//         fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
//         fs.removeSync(path.join(root.name, "docs"));
//         await new ReloadIndexCommand().run();
//         const findings = await new DoctorCommand().run();
//         assert.ok(_.find(findings?.data, { issue: "no siteRoot found" }));
//         const docsDir = path.join(root.name, "docs");
//         assert.ok(fs.existsSync(docsDir));
//         expect(fs.readdirSync(docsDir), [
//           "404.md",
//           "Gemfile",
//           "_config.yml",
//           "assets",
//           "docs",
//           "favicon.ico",
//         ]);
//         done();
//       });
//       setupDendronWorkspace(root.name, ctx);
//     });
//   });
