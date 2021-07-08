import { NoteUtils } from "@dendronhq/common-all";
import { DirResult, tmpDir, vault2Path } from "@dendronhq/common-server";
import {
  NodeTestPresetsV2,
  NoteTestUtilsV4,
} from "@dendronhq/common-test-utils";
import { DoctorActions } from "@dendronhq/dendron-cli";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import sinon from "sinon";
import * as vscode from "vscode";
import { DoctorCommand } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { VSCodeUtils } from "../../utils";
import { onWSInit, setupDendronWorkspace } from "../testUtils";
import { expect } from "../testUtilsv2";
import {
  runLegacyMultiWorkspaceTest,
  runLegacySingleWorkspaceTest,
  setupBeforeAfter,
} from "../testUtilsV3";

suite("DoctorCommandTest", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    beforeHook: () => {
      root = tmpDir();
    },
    afterHook: () => {
      sinon.restore();
    },
  });

  test("basic", (done) => {
    onWSInit(async () => {
      const testFile = path.join(root.name, "vault", "bar.md");
      fs.writeFileSync(testFile, "bar", { encoding: "utf8" });
      const testFile2 = path.join(root.name, "vault", "baz.md");
      fs.writeFileSync(testFile2, "baz", { encoding: "utf8" });
      await new ReloadIndexCommand().run();
      const cmd = new DoctorCommand();
      sinon.stub(cmd, "gatherInputs").returns(
        Promise.resolve({
          action: DoctorActions.FIX_FRONTMATTER,
          scope: "workspace",
        })
      );
      await cmd.run();
      // check that frontmatter is added
      const resp = fs.readFileSync(testFile, { encoding: "utf8" });
      expect(NoteUtils.RE_FM.exec(resp)).toBeTruthy();
      expect(NoteUtils.RE_FM_UPDATED.exec(resp)).toBeTruthy();
      expect(NoteUtils.RE_FM_CREATED.exec(resp)).toBeTruthy();

      const resp2 = fs.readFileSync(testFile2, { encoding: "utf8" });
      expect(NoteUtils.RE_FM.exec(resp2)).toBeTruthy();
      expect(NoteUtils.RE_FM_UPDATED.exec(resp2)).toBeTruthy();
      expect(NoteUtils.RE_FM_CREATED.exec(resp2)).toBeTruthy();
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  test("basic file scoped", (done) => {
    onWSInit(async () => {
      const testFile = path.join(root.name, "vault", "bar.md");
      fs.writeFileSync(testFile, "bar", { encoding: "utf8" });
      const testFile2 = path.join(root.name, "vault", "baz.md");
      fs.writeFileSync(testFile2, "baz", { encoding: "utf8" });
      await new ReloadIndexCommand().run();
      const testFileUri = vscode.Uri.file(testFile);
      await VSCodeUtils.openFileInEditor(testFileUri);
      const cmd = new DoctorCommand();
      sinon.stub(cmd, "gatherInputs").returns(
        Promise.resolve({
          action: DoctorActions.FIX_FRONTMATTER,
          scope: "file",
        })
      );
      await cmd.run();
      // check that frontmatter is added
      const resp = fs.readFileSync(testFile, { encoding: "utf8" });
      expect(NoteUtils.RE_FM.exec(resp)).toBeTruthy();
      expect(NoteUtils.RE_FM_UPDATED.exec(resp)).toBeTruthy();
      expect(NoteUtils.RE_FM_CREATED.exec(resp)).toBeTruthy();

      const resp2 = fs.readFileSync(testFile2, { encoding: "utf8" });
      expect(NoteUtils.RE_FM.exec(resp2)).toBeFalsy();
      expect(NoteUtils.RE_FM_UPDATED.exec(resp2)).toBeFalsy();
      expect(NoteUtils.RE_FM_CREATED.exec(resp2)).toBeFalsy();
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      lsp: true,
      useCb: async (vaultDir) => {
        await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
      },
    });
  });

  // test.only("lots of files", (done) => {
  //   runLegacySingleWorkspaceTest({
  //     ctx,
  //     onInit: async ({ engine, wsRoot, vaults }) => {
  //       console.log(wsRoot);
  //       const vault = vaults[0];
  //       await new DoctorCommand().run();
  //       expect(_.size(getEngine().notes) > 100).toBeTruthy();
  //     },
  //     postSetupHook: async ({ wsRoot, vaults }) => {
  //       const names = [
  //         "30x500",
  //         "root",
  //         "article",
  //         "auth",
  //         "books",
  //         "bio-and-blurb",
  //         "business",
  //         "clojure",
  //         "daily",
  //         "companies",
  //         "ocb",
  //         "mozfest",
  //         "people",
  //         "p",
  //         "platypush",
  //         "podcast",
  //         "scratch",
  //         "rpg",
  //         "speaking_at_a_conference",
  //         "spinup",
  //         "thinking",
  //         "taking_smart_notes_with_org_roam",
  //         "30x500.assets",
  //         "30x500.amazon_scoop_poop_safari",
  //         "30x500.exercise_practice_collecting_safari_gold_jargon_worldview_and_recommendations",
  //         "30x500.audience",
  //         "30x500.freelance_reddit",
  //         "30x500.exercise_practice_getting_keywords_and_themes_from_topic_titles",
  //         "30x500.interview_amy_hoy_and_alex_hillman",
  //         "30x500.infinite_ebombs_exercise",
  //         "30x500.rotton_eggs_safari",
  //         "article.advice_to_building_saas_on_aws",
  //         "article.grow_your_business_with_email_marketing_done_right",
  //         "article.encouraging_a_culture_of_written_communication_mcls",
  //         "article.how_is_design_important_as_a_developer_and_what_can_you_do_to_level_up_colby_fayock",
  //         "article.hacking_your_keyboard_with_karabiner_kaushik_gopal_s_blog",
  //         "article.how_to_use_egghead_io_to_level_up_as_a_web_developer",
  //         "article.how_to_maximize_serendipity",
  //         "article.naked_brands",
  //         "article.knowledge_hydrant_a_pattern_language_for_study_groups",
  //         "article.roads_for_success_navigating_docs",
  //         "article.one_big_idea_david_perell",
  //         "article.scraping_recipe_websites_ben_awad_blog",
  //         "article.second_chances",
  //         "article.the_framing_of_the_developer",
  //         "article.the_nature_of_code",
  //         "article.the_notation_i_use_to_manage_my_macros_tips_tutorials_keyboard_maestro_discourse",
  //         "article.the_ultimate_guide_to_writing_online",
  //         "auth.auth0",
  //         "auth.authentication",
  //         "auth.authentication_blogpost",
  //         "auth.smile-multi-factor-authentication",
  //         "books.7_languages_in_7_weeks",
  //         "books.To Read",
  //         "books.amy_hoy_just_fucking_ship",
  //         "books.anti_racist",
  //         "books.books_to_read",
  //         "books.building_a_blog_with_django",
  //         "books.building_micro_frontends",
  //         "books.communicate-with-mastery",
  //         "books.end_of_jobs",
  //         "books.erling_kagge_walking",
  //         "books.how_to_take_smart_notes_one_simple_technique_to_boost_writing_learning_and_thinking_for_students_academics_and_nonfiction_book_writers",
  //         "books.how_to_win_friends_and_influence_people",
  //         "books.microcopy",
  //         "books.obviously_awesome",
  //         "books.on-the-clock",
  //         "books.template",
  //         "books.to-read",
  //         "books.think_do_say",
  //         "books.word_hero",
  //         "books.women_fire_and_dangerous_things",
  //         "clojure.4clojure",
  //         "business.metric",
  //         "clojure.clojure_10_source_code",
  //         "clojure.clojure",
  //         "clojure.clojure_12_reading_and_problems",
  //         "clojure.clojure_11_4clojure",
  //         "clojure.clojure_14_project_structure",
  //         "clojure.clojure_13_going_camping_again",
  //         "clojure.clojure_19_office_hours",
  //         "clojure.clojure_15_zombies_and_videos",
  //         "clojure.clojure_20_building_a_web_app",
  //         "clojure.clojure_21_quick_build_with_api",
  //         "clojure.clojure_7_emacs_and_elisp",
  //         "clojure.clojure_8_core_and_problems",
  //         "clojure.clojure_9_recursion_again",
  //         "clojure.clojure_for_the_brave_and_true",
  //         "clojure.clojure_from_the_ground_up_checkpoints",
  //         "companies.truva",
  //         "daily.affirmations",
  //         "ocb.florence_road_live_setup",
  //         "p.accessibility",
  //         "p.airtable",
  //         "p.animation",
  //         "p.aws",
  //         "p.blog",
  //         "p.css",
  //         "p.dendron",
  //         "p.dotfiles",
  //         "p.dropbox",
  //         "p.education",
  //         "p.egghead",
  //         "p.electronics",
  //         "p.emacs",
  //         "p.express",
  //         "p.git_submodules",
  //         "p.framework_training",
  //         "p.gradual",
  //         "p.graphql",
  //         "p.gridsome",
  //         "p.hwp",
  //         "p.javascript",
  //         "p.icons",
  //         "p.mastermind",
  //         "p.karabiner",
  //         "p.nextjs",
  //         "p.phpsussex",
  //         "p.pkm",
  //         "p.programming",
  //         "p.pushpad",
  //         "p.shopify",
  //         "p.testing",
  //         "p.wordpress",
  //         "p.writing",
  //         "people.MartinEdwards",
  //         "people.TomCritchlow",
  //         "people.adam_lee",
  //       ];

  //       await Promise.all(
  //         names.map((name) => {
  //           FileTestUtils.createFiles(
  //             "/Users/kevinlin/Dendron/vault/",
  //             // vault2Path({ wsRoot, vault: vaults[0] }),
  //             [{ path: `${name}.md`, body: `${name}` }]
  //           );
  //         })
  //       );
  //     },
  //   });

  //   // onWSInit(async () => {
  //   //   FileTestUtils.createFiles()
  //   //   const testFile = path.join(root.name, "vault", "bond2.md");
  //   //   fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
  //   //   await new ReloadIndexCommand().run();
  //   //   await new DoctorCommand().run();
  //   //   // cehck that frontmatter is added
  //   //   const resp = fs.readFileSync(testFile, { encoding: "utf8" });
  //   //   assert.ok(NoteUtils.RE_FM.exec(resp));
  //   //   assert.ok(NoteUtils.RE_FM_UPDATED.exec(resp));
  //   //   assert.ok(NoteUtils.RE_FM_CREATED.exec(resp));
  //   //   done();
  //   // });
  //   // setupDendronWorkspace(root.name, ctx, {
  //   //   lsp: true,
  //   //   useCb: async (vaultDir) => {
  //   //     await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
  //   //   },
  //   // });
  // });
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

suite("CREATE_MISSING_LINKED_NOTES", function () {
  let ctx: vscode.ExtensionContext;

  ctx = setupBeforeAfter(this, {
    afterHook: () => {
      sinon.restore();
    },
  });

  test("basic proceed, file scoped", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        const file = await NoteTestUtilsV4.createNote({
          fname: "real",
          body: "[[real.fake]]\n",
          vault,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "real2",
          body: "[[real.fake2]]\n",
          vault,
          wsRoot,
        });
        await VSCodeUtils.openNote(file);
        const cmd = new DoctorCommand();
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActions.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        quickPickStub
          .onCall(0)
          .returns(
            Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
          );
        await cmd.run();
        const vaultPath = vault2Path({ vault, wsRoot });
        const created = _.includes(fs.readdirSync(vaultPath), "real.fake.md");
        expect(created).toBeTruthy();
        const didNotCreate = !_.includes(
          fs.readdirSync(vaultPath),
          "real.fake2.md"
        );
        expect(didNotCreate).toBeTruthy();
        done();
      },
    });
  });

  test("basic cancelled", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        const file = await NoteTestUtilsV4.createNote({
          fname: "real",
          body: "[[real.fake]]\n",
          vault,
          wsRoot,
        });
        await VSCodeUtils.openNote(file);
        const cmd = new DoctorCommand();
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActions.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        quickPickStub
          .onCall(0)
          .returns(
            Promise.resolve("cancelled") as Thenable<vscode.QuickPickItem>
          );
        await cmd.run();
        const vaultPath = vault2Path({ vault, wsRoot });
        const containsNew = _.includes(
          fs.readdirSync(vaultPath),
          "real.fake.md"
        );
        expect(containsNew).toBeFalsy();
        done();
      },
    });
  });

  test("wild link with alias", (done) => {
    runLegacySingleWorkspaceTest({
      ctx,
      postSetupHook: ENGINE_HOOKS.setupBasic,
      onInit: async ({ wsRoot, vaults }) => {
        const vault = vaults[0];
        const file = await NoteTestUtilsV4.createNote({
          fname: "real",
          body: [
            "[[something|real.fake]]",
            "[[something something|real.something]]",
          ].join("\n"),
          vault,
          wsRoot,
        });
        await VSCodeUtils.openNote(file);
        const cmd = new DoctorCommand();
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActions.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        quickPickStub
          .onCall(0)
          .returns(
            Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
          );
        await cmd.run();
        const vaultPath = vault2Path({ vault, wsRoot });
        const fileNames = ["real.fake.md", "real.something.md"];
        _.forEach(fileNames, (fileName) => {
          const containsNew = _.includes(fs.readdirSync(vaultPath), fileName);
          expect(containsNew).toBeTruthy();
        });
        done();
      },
    });
  });

  test("xvault wild links", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        const file = await NoteTestUtilsV4.createNote({
          fname: "first",
          body: [
            "[[dendron://vault2/second]]",
            "[[somenote|dendron://vault2/somenote]]",
            "[[some note|dendron://vault2/something]]",
          ].join("\n"),
          vault: vault1,
          wsRoot,
        });
        await VSCodeUtils.openNote(file);
        const cmd = new DoctorCommand();
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActions.CREATE_MISSING_LINKED_NOTES,
            scope: "file",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        quickPickStub
          .onCall(0)
          .returns(
            Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
          );
        await cmd.run();
        const sVaultPath = vault2Path({ vault: vault1, wsRoot });
        const xVaultPath = vault2Path({ vault: vault2, wsRoot });
        const fileNames = ["second.md", "somenote.md", "something.md"];
        _.forEach(fileNames, (fileName) => {
          const inSVault = _.includes(fs.readdirSync(sVaultPath), fileName);
          const inXVault = _.includes(fs.readdirSync(xVaultPath), fileName);
          expect(inSVault).toBeFalsy();
          expect(inXVault).toBeTruthy();
        });
        done();
      },
    });
  });

  test("workspace scope should do nothing", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "first",
          body: [
            "[[wild]]",
            "[[somenote|somenote]]",
            "[[some note|something]]",
          ].join("\n"),
          vault: vault1,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "second",
          body: [
            "[[wild2]]",
            "[[somenote|somenote2]]",
            "[[some note|something2]]",
          ].join("\n"),
          vault: vault2,
          wsRoot,
        });
        const cmd = new DoctorCommand();
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActions.CREATE_MISSING_LINKED_NOTES,
            scope: "workspace",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        quickPickStub
          .onCall(0)
          .returns(
            Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
          );
        await cmd.run();
        const firstVaultPath = vault2Path({ vault: vault1, wsRoot });
        const firstVaultFileNames = ["wild.md", "somenote.md", "something.md"];
        _.forEach(firstVaultFileNames, (fileName) => {
          const containsNew = _.includes(
            fs.readdirSync(firstVaultPath),
            fileName
          );
          expect(containsNew).toBeFalsy();
        });
        const secondVaultPath = vault2Path({ vault: vault2, wsRoot });
        const secondVaultFileNames = [
          "wild2.md",
          "somenote2.md",
          "something2.md",
        ];
        _.forEach(secondVaultFileNames, (fileName) => {
          const containsNew = _.includes(
            fs.readdirSync(secondVaultPath),
            fileName
          );
          expect(containsNew).toBeFalsy();
        });
        done();
      },
    });
  });

  // TODO: enable this once we enable workspace scope for CREATE_MISSING_LINKED_NOTES
  test.skip("wild links in multiple vaults with workspace scope", (done) => {
    runLegacyMultiWorkspaceTest({
      ctx,
      preSetupHook: async (opts) => {
        await ENGINE_HOOKS.setupBasic(opts);
      },
      onInit: async ({ wsRoot, vaults }) => {
        const vault1 = vaults[0];
        const vault2 = vaults[1];
        await NoteTestUtilsV4.createNote({
          fname: "first",
          body: [
            "[[wild]]",
            "[[somenote|somenote]]",
            "[[some note|something]]",
          ].join("\n"),
          vault: vault1,
          wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "second",
          body: [
            "[[wild2]]",
            "[[somenote|somenote2]]",
            "[[some note|something2]]",
          ].join("\n"),
          vault: vault2,
          wsRoot,
        });
        const cmd = new DoctorCommand();
        sinon.stub(cmd, "gatherInputs").returns(
          Promise.resolve({
            action: DoctorActions.CREATE_MISSING_LINKED_NOTES,
            scope: "workspace",
          })
        );
        const quickPickStub = sinon.stub(VSCodeUtils, "showQuickPick");
        quickPickStub
          .onCall(0)
          .returns(
            Promise.resolve("proceed") as Thenable<vscode.QuickPickItem>
          );
        await cmd.run();
        const firstVaultPath = vault2Path({ vault: vault1, wsRoot });
        const firstVaultFileNames = ["wild.md", "somenote.md", "something.md"];
        _.forEach(firstVaultFileNames, (fileName) => {
          const containsNew = _.includes(
            fs.readdirSync(firstVaultPath),
            fileName
          );
          expect(containsNew).toBeTruthy();
        });
        const secondVaultPath = vault2Path({ vault: vault2, wsRoot });
        const secondVaultFileNames = [
          "wild2.md",
          "somenote2.md",
          "something2.md",
        ];
        _.forEach(secondVaultFileNames, (fileName) => {
          const containsNew = _.includes(
            fs.readdirSync(secondVaultPath),
            fileName
          );
          expect(containsNew).toBeTruthy();
        });
        done();
      },
    });
  });
});
