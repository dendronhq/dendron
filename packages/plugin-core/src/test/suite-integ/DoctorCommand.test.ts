import { NoteUtilsV2 } from "@dendronhq/common-all";
import { DirResult, tmpDir } from "@dendronhq/common-server";
import { NodeTestPresetsV2 } from "@dendronhq/common-test-utils";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { DoctorCommand } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { setupBeforeAfter } from "../testUtilsV3";

suite("notes", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
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
        "favicon.ico",
      ]);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
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
