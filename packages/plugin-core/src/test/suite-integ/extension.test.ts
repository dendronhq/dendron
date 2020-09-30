import { DNode, DNodeUtils, Note, Schema } from "@dendronhq/common-all";
import {
  DirResult,
  EngineTestUtils,
  FileTestUtils,
  mdFile2NodeProps,
  node2MdFile,
  NodeTestUtils,
  writeYAML,
} from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import {
  getAllExportPods,
  getAllImportPods,
  getPodConfigPath,
  getPodPath,
  podClassEntryToPodItem,
} from "@dendronhq/pods-core";
import * as assert from "assert";
import fs, { ensureDirSync } from "fs-extra";
import _ from "lodash";
import { afterEach, before, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ArchiveHierarchyCommand } from "../../commands/ArchiveHierarchy";
import { BuildPodCommand } from "../../commands/BuildPod";
import { ChangeWorkspaceCommand } from "../../commands/ChangeWorkspace";
import { ConfigurePodCommand } from "../../commands/ConfigurePodCommand";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { CopyNoteRefCommand } from "../../commands/CopyNoteRef";
import { CopyNoteURLCommand } from "../../commands/CopyNoteURL";
import { CreateScratchCommand } from "../../commands/CreateScratch";
import { DoctorCommand } from "../../commands/Doctor";
import { ExportPodCommand } from "../../commands/ExportPod";
import { GoDownCommand } from "../../commands/GoDownCommand";
import {
  GoToSiblingCommand,
  GoToSiblingCommandOpts,
} from "../../commands/GoToSiblingCommand";
import { GoUpCommand } from "../../commands/GoUpCommand";
import { ImportPodCommand } from "../../commands/ImportPod";
import { LookupCommand, LookupCommandOpts } from "../../commands/LookupCommand";
import { RefactorHierarchyCommand } from "../../commands/RefactorHierarchy";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { RenameNoteV2Command } from "../../commands/RenameNoteV2";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import { LookupController } from "../../components/lookup/LookupController";
import {
  EngineOpts,
  LookupProvider,
} from "../../components/lookup/LookupProvider";
import { createNoActiveItem } from "../../components/lookup/utils";
import {
  CONFIG,
  ConfigKey,
  GLOBAL_STATE,
  WORKSPACE_STATE,
} from "../../constants";
import { _activate } from "../../extension";
import {
  cacheRefs,
  findDanglingRefsByFsPath,
  getWorkspaceCache,
  parseRef,
  replaceRefs,
} from "../../external/memo/utils/utils";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { onWSActive, onWSInit, setupWorkspace } from "../testUtils";

type ExportConfig = any;
const expectedSettings = (opts?: { folders?: any; settings?: any }): any => {
  const settings = {
    folders: [
      {
        path: "vault",
      },
    ],
    settings: {
      "dendron.rootDir": ".",
      "editor.minimap.enabled": false,
      "files.autoSave": "onFocusChange",
      "workbench.colorTheme": "GitHub Light",
      "pasteImage.path": "${currentFileDir}/assets/images",
      "pasteImage.prefix": "/",
      "markdown-preview-enhanced.enableWikiLinkSyntax": true,
      "markdown-preview-enhanced.wikiLinkFileExtension": ".md",
      "vscodeMarkdownNotes.noteCompletionConvention": "noExtension",
      "vscodeMarkdownNotes.slugifyCharacter": "NONE",
      "editor.snippetSuggestions": "inline",
      "editor.suggest.snippetsPreventQuickSuggestions": false,
      "editor.suggest.showSnippets": true,
      "editor.tabCompletion": "on",
    },
    extensions: {
      recommendations: [
        "dendron.dendron-paste-image",
        "equinusocio.vsc-material-theme",
        "dendron.dendron-markdown-shortcuts",
        "dendron.dendron-markdown-preview-enhanced",
        "dendron.dendron-markdown-links",
        "dendron.dendron-markdown-notes",
        "github.github-vscode-theme",
      ],
      unwantedRecommendations: [
        "shd101wyy.markdown-preview-enhanced",
        "kortina.vscode-markdown-notes",
        "mushan.vscode-paste-image",
      ],
    },
  };
  _.keys(opts).forEach((key) => {
    // @ts-ignore
    settings[key] = opts[key];
  });
  return settings;
};

function createMockConfig(settings: any): vscode.WorkspaceConfiguration {
  const _settings = settings;
  return {
    get: (_key: string) => {
      return _.get(_settings, _key);
    },
    update: async (_key: string, _value: any) => {
      _.set(_settings, _key, _value);
    },
    has: (key: string) => {
      return _.has(_settings, key);
    },
    inspect: (_section: string) => {
      return _settings;
    },
  };
}

type QuickPickOpts = Partial<{
  value: string;
}>;

function createMockQuickPick<T extends vscode.QuickPickItem>(
  opts: QuickPickOpts
): vscode.QuickPick<T> {
  const qp = vscode.window.createQuickPick<T>();
  if (opts.value) {
    qp.value = opts.value;
  }
  return qp;
}

function setupDendronWorkspace(
  rootDir: string,
  ctx: vscode.ExtensionContext,
  opts?: {
    configOverride?: any;
    setupWsOverride?: Partial<SetupWorkspaceOpts>;
    useFixtures?: boolean;
    fixtureDir?: string;
    useCb?: (vaultPath: string) => Promise<void>;
    activateWorkspace?: boolean;
  }
) {
  const optsClean = _.defaults(opts, {
    configOverride: {},
    setupWsOverride: { skipConfirmation: true },
    fixtureDir: "store",
    activateWorkspace: false,
  });
  if (opts?.useFixtures || opts?.useCb) {
    optsClean.setupWsOverride.emptyWs = true;
  }

  // pretend workspace is active
  if (optsClean.activateWorkspace) {
    DendronWorkspace.isActive = () => true;
  }
  // override configuration
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir,
      },
    };
    _.forEach(CONFIG, (ent) => {
      // @ts-ignore
      if (ent.default) {
        // @ts-ignore
        _.set(config, ent.key, ent.default);
      }
    });
    _.forEach(optsClean.configOverride, (v, k) => {
      _.set(config, k, v);
    });
    return createMockConfig(config);
  };

  const vaultPath = path.join(rootDir, "vault");
  DendronWorkspace.workspaceFile = () => {
    return vscode.Uri.file(path.join(rootDir, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = vscode.Uri.file(vaultPath);
    return [{ uri, name: "vault", index: 0 }];
  };
  return new SetupWorkspaceCommand()
    .execute({
      rootDirRaw: rootDir,
      skipOpenWs: true,
      ...optsClean.setupWsOverride,
    })
    .then(async () => {
      if (opts?.useFixtures) {
        await EngineTestUtils.setupStoreDir({
          copyFixtures: true,
          storeDstPath: vaultPath,
          storeDirSrc: optsClean.fixtureDir,
        });
      }
      if (opts?.useCb) {
        await opts.useCb(vaultPath);
      }
      return _activate(ctx);
    });
}

function onWSUpgraded(cb: Function) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === "upgraded") {
        await cb();
      }
    }
  );
}

function resetWorkspaceFile() {
  const fpath = DendronWorkspace.workspaceFile().fsPath;
  return fs.writeJSONSync(fpath, {
    folders: [],
    settings: {},
  });
}

let root: DirResult;
let ctx: vscode.ExtensionContext;

const TIMEOUT = 60 * 1000 * 5;

suite("manual", function () {
  before(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  beforeEach(async function () {
    await new ResetConfigCommand().execute({ scope: "all" });
    root = FileTestUtils.tmpDir();
    //fs.removeSync(root.name);
    ctx = VSCodeUtils.getOrCreateMockContext();
    return;
  });

  describe("SetupWorkspaceCommand", function () {
    this.timeout(TIMEOUT);

    test("not first time setup", function (done) {
      setupWorkspace(root.name);
      VSCodeUtils.gatherFolderPath = () => Promise.resolve(root.name);
      // @ts-ignore
      VSCodeUtils.showQuickPick = () =>
        Promise.resolve("initialize empty repository");
      const cmd = new SetupWorkspaceCommand();
      ctx.globalState.update(GLOBAL_STATE.DENDRON_FIRST_WS, "init").then(() => {
        cmd.gatherInputs().then((resp) => {
          assert.deepEqual(resp, { rootDirRaw: root.name, emptyWs: true });
          done();
        });
      });
    });
  });
});

suite.skip("startup", function () {
  this.timeout(TIMEOUT);
  let ctx: vscode.ExtensionContext;

  beforeEach(async function () {
    console.log("before each");
    ctx = VSCodeUtils.createWSContext();
    DendronWorkspace.getOrCreate(ctx);
    root = FileTestUtils.tmpDir();
    await new ResetConfigCommand().execute({ scope: "all" });
    console.log("before each end");
  });

  afterEach(function () {
    console.log("after each");
    HistoryService.instance().clearSubscriptions();
  });

  describe("sanity", function () {
    vscode.window.showInformationMessage("Start sanity test.");
    this.timeout(TIMEOUT);

    afterEach(function () {
      resetWorkspaceFile();
    });

    test("workspace not activated", function (done) {
      _activate(ctx);
      onWSActive(async (_event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), false);
        done();
      });
    });

    test("workspace active, prior lower workspace version, setting with extra prop, upgrade", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: { rootDir: root.name },
        });
      };
      DendronWorkspace.workspaceFile = () => {
        return vscode.Uri.file(path.join(root.name, "dendron.code-workspace"));
      };
      DendronWorkspace.workspaceFolders = () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault"));
        return [{ uri, name: "vault", index: 0 }];
      };

      onWSActive(async (_event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), true);
        // updated to latest version
        assert.equal(
          ctx.globalState.get(WORKSPACE_STATE.WS_VERSION),
          VSCodeUtils.getVersionFromPkg()
        );
        const config = fs.readJSONSync(
          path.join(root.name, DendronWorkspace.DENDRON_WORKSPACE_FILE)
        );
        const settings = expectedSettings();
        settings.settings.bond = 42;
        assert.deepEqual(config, settings);
        done();
      });

      ctx.globalState.update(WORKSPACE_STATE.WS_VERSION, "0.0.1").then(() => {
        new SetupWorkspaceCommand()
          .execute({ rootDirRaw: root.name, skipOpenWs: true })
          .then(() => {
            const initSettings = expectedSettings({ settings: { bond: 42 } });
            fs.writeJSONSync(
              path.join(root.name, DendronWorkspace.DENDRON_WORKSPACE_FILE),
              initSettings
            );
            _activate(ctx);
          });
      });
    });

    test("workspace active, prior lower workspace version, don't override current setting, upgrade", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: { rootDir: root.name },
        });
      };
      DendronWorkspace.workspaceFile = () => {
        return vscode.Uri.file(path.join(root.name, "dendron.code-workspace"));
      };
      DendronWorkspace.workspaceFolders = () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault"));
        return [{ uri, name: "vault", index: 0 }];
      };
      ctx.globalState.update(WORKSPACE_STATE.WS_VERSION, "0.0.1").then(() => {
        new SetupWorkspaceCommand()
          .execute({ rootDirRaw: root.name, skipOpenWs: true })
          .then(() => {
            const initSettings = expectedSettings({
              settings: { "workbench.colorTheme": "dark theme" },
            });
            fs.writeJSONSync(
              path.join(root.name, DendronWorkspace.DENDRON_WORKSPACE_FILE),
              initSettings
            );
            _activate(ctx);
          });
      });

      onWSUpgraded(async (_event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), true);
        // updated to latest version
        assert.equal(
          ctx.globalState.get(WORKSPACE_STATE.WS_VERSION),
          VSCodeUtils.getVersionFromPkg()
        );
        const config = fs.readJSONSync(
          path.join(root.name, DendronWorkspace.DENDRON_WORKSPACE_FILE)
        );
        const settings = expectedSettings();
        settings.settings["workbench.colorTheme"] = "dark theme";
        assert.deepEqual(config, settings);
        done();
      });
    });

    test("workspace active, change into workspace", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: {},
        });
      };
      _activate(ctx);
      fs.ensureDirSync(root.name);
      new ChangeWorkspaceCommand()
        .execute({
          rootDirRaw: root.name,
          skipOpenWS: true,
        })
        .then(() => {
          const config = fs.readJSONSync(
            path.join(root.name, DendronWorkspace.DENDRON_WORKSPACE_FILE)
          );
          assert.deepEqual(
            config,
            expectedSettings({ folders: [{ path: "." }] })
          );
          onWSActive(async (_event: HistoryEvent) => {
            assert.equal(DendronWorkspace.isActive(), false);
            done();
          });
        });
    });
  });

  describe("lookup", function () {
    this.timeout(TIMEOUT);

    describe("updateItems", function () {
      // TODO: need to clear existing open folders
      test("init", function (done) {
        onWSInit(async () => {
          const ws = DendronWorkspace.instance();
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupController(ws, engOpts);
          const lp = new LookupProvider(engOpts);
          lc.show();
          // @ts-ignore
          await lp.onUpdatePickerItem(lc.quickPick, engOpts);
          // two notes and root
          assert.equal(lc.quickPick?.items.length, 3);
          done();
        });
        setupDendronWorkspace(root.name, ctx, {
          useCb: async (vaultPath: string) => {
            node2MdFile(
              new Note({ fname: "root", id: "root", title: "root" }),
              { root: vaultPath }
            );
            node2MdFile(new Note({ fname: "foo" }), { root: vaultPath });
            node2MdFile(new Note({ fname: "bar" }), { root: vaultPath });
          },
        });
      });

      test("open note", function (done) {
        setupDendronWorkspace(root.name, ctx, {
          useCb: async (vaultPath: string) => {
            node2MdFile(new Note({ fname: "foo" }), { root: vaultPath });
            node2MdFile(new Note({ fname: "bar" }), { root: vaultPath });
          },
        });
        onWSInit(async () => {
          const ws = DendronWorkspace.instance();
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupController(ws, engOpts);
          const lp = new LookupProvider(engOpts);
          await VSCodeUtils.openFileInEditor(
            vscode.Uri.file(path.join(root.name, "vault", "foo.md"))
          );
          lc.show();
          // @ts-ignore
          await lp.onUpdatePickerItem(lc.quickPick, engOpts);
          assert.equal(lc.quickPick?.activeItems.length, 1);
          assert.equal(lc.quickPick?.activeItems[0].fname, "foo");
          done();
        });
      });

      test("remove stub status after creation", function (done) {
        onWSInit(async () => {
          const ws = DendronWorkspace.instance();
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupController(ws, engOpts);
          const lp = new LookupProvider(engOpts);

          let quickpick = lc.show();
          let note = _.find(quickpick.items, { fname: "foo" }) as Note;
          assert.ok(note.stub);
          quickpick.selectedItems = [note];
          await lp.onDidAccept(quickpick, engOpts);
          assert.equal(
            path.basename(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "foo.md"
          );

          quickpick = lc.show();
          note = _.find(quickpick.items, { fname: "foo" }) as Note;
          assert.ok(!note.stub);
          // no schema file
          assert.ok(note.schema?.id, Schema.createUnkownSchema().id);
          done();
        });

        setupDendronWorkspace(root.name, ctx, {
          activateWorkspace: true,
          useCb: async (vaultPath: string) => {
            node2MdFile(
              new Note({ fname: "root", id: "root", title: "root" }),
              { root: vaultPath }
            );
            node2MdFile(new Note({ fname: "foo.bar" }), { root: vaultPath });
          },
        });
      });

      test("attach schema after creation", function (done) {
        onWSInit(async () => {
          const ws = DendronWorkspace.instance();
          const engOpts: EngineOpts = { flavor: "note" };
          const lc = new LookupController(ws, engOpts);
          const lp = new LookupProvider(engOpts);

          let quickpick = lc.show();
          let note = _.find(quickpick.items, { fname: "foo" }) as Note;
          assert.ok(note.stub);
          quickpick.selectedItems = [note];
          await lp.onDidAccept(quickpick, engOpts);
          assert.equal(
            path.basename(
              VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
            ),
            "foo.md"
          );

          quickpick = lc.show();
          note = _.find(quickpick.items, { fname: "foo" }) as Note;
          assert.ok(!note.stub);
          // no schema file
          assert.ok(note.schema?.id, "foo");
          done();
        });

        setupDendronWorkspace(root.name, ctx, {
          activateWorkspace: true,
          useCb: async (vaultPath: string) => {
            node2MdFile(
              new Note({ fname: "root", id: "root", title: "root" }),
              { root: vaultPath }
            );
            node2MdFile(new Note({ fname: "foo.bar" }), { root: vaultPath });
            const schemaPath = path.join(vaultPath, "foo.schema.yml");
            writeYAML(schemaPath, {
              version: 1,
              schemas: [
                {
                  id: "foo",
                  parent: "root",
                },
              ],
            });
          },
        });
      });
    });

    describe("onDidAccept", function () {
      test("lookup new node", function (done) {
        setupDendronWorkspace(root.name, ctx);
        onWSInit(async () => {
          assert.equal(DendronWorkspace.isActive(), true);
          const qp = await createMockQuickPick<DNode>({ value: "bond" });
          const bondNote = createNoActiveItem({ label: "bond" });
          // @ts-ignore
          qp.items = [bondNote];
          // @ts-ignore
          qp.activeItems = [bondNote];
          // @ts-ignore
          qp.selectedItems = [bondNote];
          const engOpts: EngineOpts = { flavor: "note" };
          const lp = new LookupProvider(engOpts);
          await lp.onDidAccept(qp, engOpts);
          const txtPath = vscode.window.activeTextEditor?.document.uri
            .fsPath as string;
          const node = mdFile2NodeProps(txtPath);
          assert.equal(node.title, "Bond");
          done();
        });
      });

      test("lookup existing node", function (done) {
        setupDendronWorkspace(root.name, ctx, { useFixtures: true });
        onWSInit(async () => {
          console.log("lookup");
          assert.equal(DendronWorkspace.isActive(), true);
          const qp = await createMockQuickPick<DNode>({ value: "foo" });
          const ws = DendronWorkspace.instance();
          const fooNote = (await ws.engine.queryOne("foo", "note")).data;
          qp.items = [fooNote];
          qp.activeItems = [fooNote];
          qp.selectedItems = [fooNote];
          const engOpts: EngineOpts = { flavor: "note" };
          const lp = new LookupProvider(engOpts);
          await lp.onDidAccept(qp, engOpts);
          const txtPath = vscode.window.activeTextEditor?.document.uri
            .fsPath as string;
          const node = mdFile2NodeProps(txtPath);
          assert.equal(node.title, "foo");
          done();
        });
      });

      test("lookup new node with schema template", function (done) {
        setupDendronWorkspace(root.name, ctx, {
          useFixtures: true,
          fixtureDir: "vault-template",
        });
        onWSInit(async () => {
          assert.equal(DendronWorkspace.isActive(), true);
          const lbl = "bar.ns1.three";
          const qp = await createMockQuickPick<DNode>({ value: lbl });
          const bondNote = createNoActiveItem({ label: lbl });
          // @ts-ignore
          qp.items = [bondNote];
          // @ts-ignore
          qp.activeItems = [bondNote];
          // @ts-ignore
          qp.selectedItems = [bondNote];
          const engOpts: EngineOpts = { flavor: "note" };
          const lp = new LookupProvider(engOpts);
          await lp.onDidAccept(qp, engOpts);
          const txtPath = vscode.window.activeTextEditor?.document.uri
            .fsPath as string;
          const node = mdFile2NodeProps(txtPath);
          assert.equal(_.trim(node.body), "text from alpha template");
          done();
        });
      });

      test("lookup new node with schema template for namespace", function (done) {
        setupDendronWorkspace(root.name, ctx, {
          setupWsOverride: { emptyWs: false },
        });
        onWSInit(async () => {
          assert.equal(DendronWorkspace.isActive(), true);
          const lbl = "journal.daily.2020-08-10";
          const qp = await createMockQuickPick<DNode>({ value: lbl });
          const bondNote = createNoActiveItem({ label: lbl });
          // @ts-ignore
          qp.items = [bondNote];
          // @ts-ignore
          qp.activeItems = [bondNote];
          // @ts-ignore
          qp.selectedItems = [bondNote];
          const engOpts: EngineOpts = { flavor: "note" };
          const lp = new LookupProvider(engOpts);
          await lp.onDidAccept(qp, engOpts);
          const txtPath = vscode.window.activeTextEditor?.document.uri
            .fsPath as string;
          const node = mdFile2NodeProps(txtPath);

          const engine = DendronEngine.getOrCreateEngine();
          const template = _.find(_.values(engine.notes), {
            fname: "journal.template.daily",
          }) as Note;
          assert.equal(_.trim(node.body), _.trim(template.body));
          done();
        });
      });

      // test("lookup new node with body", function (done) {
      //   onWSInit(async () => {
      //     const uri = vscode.Uri.file(path.join(root.name, "vault", "bar.md"));
      //     const editor = await vscode.window.showTextDocument(uri);
      //     editor.selection = new vscode.Selection(8, 0, 8, 12);
      //     // @ts-ignore
      //     const {document, range} = await VSCodeUtils.extractRangeFromActiveEditor();
      //     const body = "\n" + document.getText(range).trim();
      //     const lbl = "bond";
      //     const qp = await createMockQuickPick<DNode>({ value: lbl }) as DendronQuickPicker;
      //     const engOpts: EngineOpts = { flavor: "note" };
      //     const lp = new LookupProvider(engOpts);
      //     await lp.onDidAccept(qp, engOpts);
      //     const activeEditor = VSCodeUtils.getActiveTextEditor();
      //     expect(path.basename(activeEditor?.document.uri.fsPath as string), "bar.md");
      //     done();
      //   });
      //   setupDendronWorkspace(root.name, ctx, {
      //     useCb: async () => {
      //       NodeTestUtils.createNotes(path.join(root.name, "vault"), [
      //         { fname: "foo", stub: true },
      //         { fname: "bar" },
      //       ]);
      //     },
      //   });
      // });

      // test("lookup new node with unknown schema", function(done) {
      //   onWSInit(async () => {
      //     const ws = DendronWorkspace.instance();
      //     const engOpts: EngineOpts = { flavor: "note" };
      //     const lc = new LookupController(ws, engOpts);
      //     const lp = new LookupProvider(engOpts);

      //     let quickpick = lc.show();
      //     let note = _.find(quickpick.items, { fname: "foo" }) as Note;
      //     assert.ok(note.stub);
      //     quickpick.selectedItems = [note];
      //     await lp.onDidAccept(quickpick, engOpts);
      //     assert.equal(
      //       path.basename(
      //         VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath as string
      //       ),
      //       "foo.md"
      //     );

      //     quickpick = lc.show();
      //     note = _.find(quickpick.items, { fname: "foo" }) as Note;
      //     assert.ok(!note.stub);
      //     done();
      //   });

      //   setupDendronWorkspace(root.name, ctx, {
      //     activateWorkspace: true,
      //     useCb: async (vaultPath: string) => {
      //       node2MdFile(
      //         new Note({ fname: "root", id: "root", title: "root" }),
      //         { root: vaultPath }
      //       );
      //       node2MdFile(new Note({ fname: "foo" }), { root: vaultPath });
      //     },
      //   });

      // });
    });
  });
});

suite("commands", function () {
  this.timeout(TIMEOUT);

  before(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  beforeEach(async function () {
    root = FileTestUtils.tmpDir();
    fs.removeSync(root.name);
    ctx = VSCodeUtils.getOrCreateMockContext();
    return;
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  // --- Notes

  describe("CreateJournalCommand", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.faq.md")
        );
        await vscode.window.showTextDocument(uri);
        VSCodeUtils.showInputBox = async (
          opts: vscode.InputBoxOptions | undefined
        ) => {
          return opts?.value;
        };
        const resp = (
          await new LookupCommand().run({
            noteType: "journal",
          } as LookupCommandOpts)
        )?.value as string;
        const found = resp.indexOf("dendron.journal") >= 0;
        assert.ok(found);
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });

    test("add: childOfDomainNamespace", function (done) {
      setupDendronWorkspace(root.name, ctx, {
        configOverride: {
          [CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "childOfDomainNamespace",
        },
        useFixtures: true,
      });
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "bar.one.temp.md")
        );
        await vscode.window.showTextDocument(uri);
        VSCodeUtils.showInputBox = async (
          opts: vscode.InputBoxOptions | undefined
        ) => {
          return opts?.value;
        };
        const resp = (
          await new LookupCommand().run({
            noteType: "journal",
          } as LookupCommandOpts)
        )?.value as string;
        assert.ok(resp.indexOf("bar.one.journal") >= 0);
        done();
      });
    });

    test("add: childOfCurrent", function (done) {
      setupDendronWorkspace(root.name, ctx, {
        configOverride: {
          [CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "childOfCurrent",
        },
      });
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.faq.md")
        );
        await vscode.window.showTextDocument(uri);
        VSCodeUtils.showInputBox = async (
          opts: vscode.InputBoxOptions | undefined
        ) => {
          return opts?.value;
        };
        const resp = (
          await new LookupCommand().run({
            noteType: "journal",
          } as LookupCommandOpts)
        )?.value as string;
        assert.ok(resp.indexOf("dendron.faq.journal") >= 0);
        done();
      });
    });

    test("add: diff name", function (done) {
      setupDendronWorkspace(root.name, ctx, {
        configOverride: {
          [CONFIG.DEFAULT_JOURNAL_NAME.key]: "foo",
        },
      });
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.faq.md")
        );
        await vscode.window.showTextDocument(uri);
        VSCodeUtils.showInputBox = async (
          opts: vscode.InputBoxOptions | undefined
        ) => {
          return opts?.value;
        };
        const resp = (
          await new LookupCommand().run({
            noteType: "journal",
          } as LookupCommandOpts)
        )?.value as string;
        assert.ok(resp.indexOf("dendron.foo") >= 0);
        done();
      });
    });

    test("add: asOwnDomain", function (done) {
      setupDendronWorkspace(root.name, ctx, {
        configOverride: {
          [CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "asOwnDomain",
        },
      });
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.faq.md")
        );
        await vscode.window.showTextDocument(uri);
        VSCodeUtils.showInputBox = async (
          opts: vscode.InputBoxOptions | undefined
        ) => {
          return opts?.value;
        };
        const resp = (
          await new LookupCommand().run({
            noteType: "journal",
          } as LookupCommandOpts)
        )?.value as string;
        assert.ok(resp.startsWith("journal"));
        done();
      });
    });
  });

  describe("CreateScratchCommand", function () {
    let noteType = "SCRATCH";
    let uri: vscode.Uri;

    beforeEach(() => {
      VSCodeUtils.showInputBox = async () => {
        return "scratch";
      };
      uri = vscode.Uri.file(path.join(root.name, "vault", "dendron.faq.md"));
    });

    test("basic", function (done) {
      onWSInit(async () => {
        await vscode.window.showTextDocument(uri);
        const resp = (await new CreateScratchCommand().run()) as vscode.Uri;
        assert.ok(path.basename(resp.fsPath).startsWith("scratch"));
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });

    test("add: childOfCurrent", function (done) {
      setupDendronWorkspace(root.name, ctx, {
        configOverride: {
          [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
            "childOfCurrent",
        },
      });
      onWSInit(async () => {
        await vscode.window.showTextDocument(uri);
        const resp = await new CreateScratchCommand().run();
        assert.ok(
          (resp as vscode.Uri).fsPath.indexOf("dendron.faq.scratch") > 0
        );
        done();
      });
    });

    test("add: childOfDomain", function (done) {
      setupDendronWorkspace(root.name, ctx, {
        configOverride: {
          [CONFIG[`DEFAULT_${noteType}_ADD_BEHAVIOR` as ConfigKey].key]:
            "childOfDomain",
        },
      });
      onWSInit(async () => {
        await vscode.window.showTextDocument(uri);
        const resp = await new CreateScratchCommand().run();
        assert.ok((resp as vscode.Uri).fsPath.indexOf("dendron.scratch") > 0);
        done();
      });
    });
  });

  describe("CopyNoteLink", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
        await vscode.window.showTextDocument(uri);
        const link = await new CopyNoteLinkCommand().run();
        assert.equal(link, "[[foo|foo]]");
        done();
      });
      setupDendronWorkspace(root.name, ctx, { useFixtures: true });
    });
  });

  describe("CopyNoteRefCommand", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
        await vscode.window.showTextDocument(uri);
        const link = await new CopyNoteRefCommand().run();
        assert.equal(link, "((ref: [[foo]]))");
        done();
      });
      setupDendronWorkspace(root.name, ctx, { useFixtures: true });
    });

    test("with selection", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "bar.md"));
        const editor = await vscode.window.showTextDocument(uri);
        editor.selection = new vscode.Selection(8, 0, 8, 12);
        const link = await new CopyNoteRefCommand().run();
        assert.equal(link, "((ref: [[bar]]#foo,1:#*))");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useFixtures: false,
        useCb: async (vault) => {
          NodeTestUtils.createNotes(vault, [
            { fname: "bar", body: "## Foo\nfoo text\n## Header\n Header text" },
          ]);
        },
      });
    });

    test("with partial selection", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "bar.md"));
        const editor = await vscode.window.showTextDocument(uri);
        editor.selection = new vscode.Selection(8, 0, 8, 4);
        const link = await new CopyNoteRefCommand().run();
        assert.equal(link, "((ref: [[bar]]#foo bar,1:#*))");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useFixtures: false,
        useCb: async (vault) => {
          NodeTestUtils.createNotes(vault, [
            {
              fname: "bar",
              body: "## Foo bar\nfoo text\n## Header\n Header text",
            },
          ]);
        },
      });
    });

    test("with selection and no next header", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "bar.md"));
        const editor = await vscode.window.showTextDocument(uri);
        editor.selection = new vscode.Selection(8, 0, 8, 12);
        const link = await new CopyNoteRefCommand().run();
        assert.equal(link, "((ref: [[bar]]#foo,1))");
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useFixtures: false,
        useCb: async (vault) => {
          NodeTestUtils.createNotes(vault, [
            { fname: "bar", body: "## Foo\nfoo text\n" },
          ]);
        },
      });
    });
  });

  describe("GoUp", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
        await vscode.window.showTextDocument(uri);
        await new GoUpCommand().run();
        assert.ok(
          VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath.endsWith(
            "root.md"
          )
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, { useFixtures: true });
    });
  });

  // figure better way of testing this
  describe.skip("GoDown", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
        await vscode.window.showTextDocument(uri);
        const lookup = await new GoDownCommand().run();
        assert.equal(lookup?.quickPick?.value, "foo.");
        done();
      });
      setupDendronWorkspace(root.name, ctx, { useFixtures: true });
    });
  });

  // describe("ImportPod", function() {
  //   test("basic", function (done) {
  //     onWSInit(async () => {
  //       const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
  //       await vscode.window.showTextDocument(uri);
  //       const link = await new CopyNoteLinkCommand().run();
  //       assert.equal(link, "[[foo|foo]]");
  //       done();
  //     });
  //     setupDendronWorkspace(root.name, ctx, { useFixtures: true });
  //   });

  // });

  describe("RenameNote", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.faq.md")
        );
        VSCodeUtils.showInputBox = async () => {
          return "dendron.bond";
        };
        await vscode.window.showTextDocument(uri);
        fs.appendFileSync(uri.fsPath, "shaken");
        await new RenameNoteV2Command().run();
        const text = fs.readFileSync(
          path.join(root.name, "vault", "dendron.md"),
          { encoding: "utf8" }
        );
        const textOfNew = fs.readFileSync(
          path.join(root.name, "vault", "dendron.bond.md"),
          { encoding: "utf8" }
        );
        assert.ok(text.indexOf("[[FAQ |dendron.bond]]") > 0);
        assert.ok(textOfNew.indexOf("shaken") > 0);
        const activeUri = vscode.window.activeTextEditor?.document.uri;
        assert.equal(
          activeUri?.fsPath,
          path.join(root.name, "vault", "dendron.bond.md")
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });

    test("stub exists", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "bar.one.md")
        );
        VSCodeUtils.showInputBox = async () => {
          return "bar";
        };
        await vscode.window.showTextDocument(uri);
        fs.appendFileSync(uri.fsPath, "shaken");
        await new RenameNoteV2Command().run();

        const text = fs.readFileSync(
          path.join(root.name, "vault", "dendron.md"),
          { encoding: "utf8" }
        );
        const textOfNew = fs.readFileSync(
          path.join(root.name, "vault", "bar.md"),
          { encoding: "utf8" }
        );
        assert.ok(text.indexOf("[[bar]]") > 0);
        assert.ok(textOfNew.indexOf("shaken") > 0);
        const activeUri = vscode.window.activeTextEditor?.document.uri;
        assert.equal(
          activeUri?.fsPath,
          path.join(root.name, "vault", "bar.md")
        );
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        useFixtures: false,
        useCb: async (vault) => {
          NodeTestUtils.createNotes(vault, [
            {
              id: "id-bar.one",
              fname: "bar.one",
              body: "## Foo\nfoo text\n## Header\n Header text",
            },
            { id: "id-dendron", fname: "dendron", body: "[[bar.one]]" },
          ]);
        },
      });
    });

    test("mult links", function (done) {
      onWSInit(async () => {
        let uri = vscode.Uri.file(
          path.join(root.name, "vault", "refactor.one.md")
        );
        VSCodeUtils.showInputBox = async () => {
          return "bond.one";
        };
        await vscode.window.showTextDocument(uri);
        await new RenameNoteV2Command().run();
        let text = fs.readFileSync(
          path.join(root.name, "vault", "refactor.md"),
          { encoding: "utf8" }
        );
        assert.ok(text.indexOf("bond.one") > 0);

        uri = vscode.Uri.file(path.join(root.name, "vault", "refactor.two.md"));
        VSCodeUtils.showInputBox = async () => {
          return "bond.two";
        };
        await vscode.window.showTextDocument(uri);
        await new RenameNoteV2Command().run();
        text = fs.readFileSync(path.join(root.name, "vault", "refactor.md"), {
          encoding: "utf8",
        });
        assert.ok(text.indexOf("bond.one") > 0);
        assert.ok(text.indexOf("bond.two") > 0);
        console.log(text);
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        useFixtures: true,
      });
    });
  });

  // --- Hierarchy
  describe("Archive Hierarchy", function () {
    test("basic", function (done) {
      // setup mocks
      VSCodeUtils.showInputBox = async () => {
        return "refactor";
      };
      // @ts-ignore
      VSCodeUtils.showQuickPick = async () => {
        return "proceed";
      };

      onWSInit(async () => {
        const resp = await new ArchiveHierarchyCommand().run();
        assert.equal(resp.refsUpdated, 4);
        assert.deepEqual(
          resp.pathsUpdated.map((p: string) => path.basename(p)),
          ["archive.refactor.md", "archive.refactor.one.md", "foo.md"]
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        setupWsOverride: { emptyWs: true },
        useFixtures: true,
      });
    });
  });

  describe("Refactor Hierarchy", function () {
    test("basic", function (done) {
      // setup mocks
      let acc = 0;
      VSCodeUtils.showInputBox = async () => {
        if (acc == 0) {
          acc += 1;
          return "refactor";
        } else {
          return "bond";
        }
      };
      // @ts-ignore
      VSCodeUtils.showQuickPick = async () => {
        return "proceed";
      };

      onWSInit(async () => {
        const resp = await new RefactorHierarchyCommand().run();

        // assert.equal(
        //   VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
        //   vscode.Uri.joinPath(
        //     DendronWorkspace.instance().rootWorkspace.uri,
        //     "bond.md"
        //   ).fsPath
        // );
        assert.equal(resp.refsUpdated, 4);
        assert.deepEqual(
          resp.pathsUpdated.map((p: string) => path.basename(p)),
          ["bond.md", "bond.one.md", "foo.md"]
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useFixtures: true,
      });
    });
  });

  // --- Dev
  describe("DoctorCommand", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const testFile = path.join(root.name, "vault", "bond2.md");
        fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
        await new ReloadIndexCommand().run();
        await new DoctorCommand().run();
        const nodeProps = mdFile2NodeProps(testFile);
        assert.equal(_.trim(nodeProps.title), "Bond2");
        assert.ok(nodeProps.id);
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });

    test("missing doc folder", function (done) {
      onWSInit(async () => {
        const testFile = path.join(root.name, "vault", "bond2.md");
        fs.writeFileSync(testFile, "bond", { encoding: "utf8" });
        fs.removeSync(path.join(root.name, "docs"));
        await new ReloadIndexCommand().run();
        const findings = await new DoctorCommand().run();
        assert.ok(_.find(findings?.data, { issue: "no siteRoot found" }));
        const docsDir = path.join(root.name, "docs");
        assert.ok(fs.existsSync(docsDir));
        expect(fs.readdirSync(docsDir), [
          "404.md",
          "Gemfile",
          "_config.yml",
          "assets",
          "docs",
          "favicon.ico",
        ]);
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });
  });

  // TODO: figure out why this no work
  describe.skip("SetupWorkspaceCommand", function () {
    this.timeout(TIMEOUT);
    test("basic", async function (done) {
      onWSActive(async () => {
        VSCodeUtils.gatherFolderPath = async () => {
          return root.name;
        };
        // @ts-ignore
        VSCodeUtils.showQuickPick = async () => {
          return "initialize with dendron tutorial notes";
        };
        await new SetupWorkspaceCommand().run();
        assert.equal(fs.readdirSync(root.name).sort(), [
          "dendron.code-workspace",
          "docs",
          "vault",
        ]);
        done();
      });
      _activate(ctx);
    });
  });
});

const it = test;
const expect = assert.deepEqual;

export const rndName = (): string => {
  const name = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);

  return name.length !== 5 ? rndName() : name;
};

export const createFile = async (
  filename: string,
  content: string = "",
  _syncCache: boolean = true
): Promise<vscode.Uri | undefined> => {
  const workspaceFolder = DendronWorkspace.instance().rootWorkspace.uri.fsPath;
  if (!workspaceFolder) {
    return;
  }
  const filepath = path.join(workspaceFolder, ...filename.split("/"));
  // const dirname = path.dirname(filepath);
  // utils.ensureDirectoryExists(filepath);

  // if (!fs.existsSync(dirname)) {
  //   throw new Error(`Directory ${dirname} does not exist`);
  // }

  fs.writeFileSync(filepath, content);

  // if (syncCache) {
  //   await cacheWorkspace();
  // }

  return vscode.Uri.file(path.join(workspaceFolder, ...filename.split("/")));
};

suite.skip("utils", function () {
  describe("findDanglingRefsByFsPath()", function () {
    this.timeout(TIMEOUT);

    before(function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
    });

    beforeEach(async function () {
      root = FileTestUtils.tmpDir();
      fs.removeSync(root.name);
      ctx = VSCodeUtils.getOrCreateMockContext();
      return;
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    it("should find dangling refs by fs path", async () => {
      setupDendronWorkspace(root.name, ctx, {
        useFixtures: true,
      });
      onWSInit(async () => {});
      const name0 = rndName();
      const name1 = rndName();
      await createFile(
        `${name0}.md`,
        `
      [[dangling-ref]]
      [[dangling-ref]]
      [[dangling-ref2|Test Label]]
      [[folder1/long-dangling-ref]]
      ![[dangling-ref3]]
      \`[[dangling-ref-within-code-span]]\`
      \`\`\`
      Preceding text
      [[dangling-ref-within-fenced-code-block]]
      Following text
      \`\`\`
      [[${name1}]]
      `
      );
      await createFile(`${name1}.md`);
      await cacheRefs();
      const refsByFsPath = await findDanglingRefsByFsPath(
        getWorkspaceCache().markdownUris
      );

      assert.equal(Object.keys(refsByFsPath).length, 1);
      assert.equal(Object.values(refsByFsPath)[0], [
        "dangling-ref",
        "dangling-ref2",
        "folder1/long-dangling-ref",
        "dangling-ref3",
      ]);
    });

    // it('should find dangling refs from the just edited document', async () => {
    //   const name0 = rndName();

    //   await createFile(`${name0}.md`, '[[dangling-ref]]');

    //   const doc = await openTextDocument(`${name0}.md`);

    //   const editor = await window.showTextDocument(doc);

    //   const refsByFsPath = await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris);

    //   expect(Object.keys(refsByFsPath)).toHaveLength(1);
    //   expect(Object.values(refsByFsPath)[0]).toEqual(['dangling-ref']);

    //   await editor.edit((edit) => edit.insert(new Position(1, 0), '[[dangling-ref2]]'));

    //   const refsByFsPath2 = await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris);

    //   expect(Object.keys(refsByFsPath2)).toHaveLength(1);
    //   expect(Object.values(refsByFsPath2)[0]).toEqual(['dangling-ref', 'dangling-ref2']);

    //   await editor.edit((edit) => edit.delete(new Range(new Position(0, 0), new Position(2, 0))));

    //   expect(await findDanglingRefsByFsPath(getWorkspaceCache().markdownUris)).toEqual({});
    // });
  });

  describe("parseRef()", () => {
    // it('should fail on providing wrong parameter type', () => {
    //   expect(() => parseRef((undefined as unknown) as string)).toThrow();
    // });

    it("should return empty ref and label", () => {
      assert.deepEqual(parseRef(""), { ref: "", label: "" });
      //expect(parseRef('')();
    });

    it("should parse raw ref and return ref and label", () => {
      assert.deepEqual(parseRef("Label|link"), { ref: "link", label: "Label" });
    });

    // TODO: hadnle this case
    it.skip("should favour first divider", () => {
      assert.deepEqual(parseRef("Label|||link"), {
        ref: "link",
        label: "||Label",
      });
    });
  });
  describe("replaceRefs()", () => {
    before(function () {
      ctx = VSCodeUtils.getOrCreateMockContext();
      DendronWorkspace.getOrCreate(ctx);
    });

    beforeEach(async function () {
      root = FileTestUtils.tmpDir();
      fs.removeSync(root.name);
      ctx = VSCodeUtils.getOrCreateMockContext();
      return;
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    it("should return null if nothing to replace", async () => {
      assert.deepEqual(
        replaceRefs({
          refs: [{ old: "test-ref", new: "new-test-ref" }],
          content: "[[test-ref]]",
        }),
        "[[new-test-ref]]"
      );
    });

    it("should replace short ref with short ref", async () => {
      assert.deepEqual(
        replaceRefs({
          refs: [{ old: "test-ref", new: "new-test-ref" }],
          content: "[[test-ref]]",
        }),
        "[[new-test-ref]]"
      );
    });

    it("should replace short ref with label with short ref with label", async () => {
      const replace = replaceRefs({
        refs: [{ old: "test-ref", new: "new-test-ref" }],
        content: "[[Test Label|test-ref]]",
      });
      expect(replace, "[[Test Label|new-test-ref]]");
    });

    // custom
    it("should replace short ref with label with short ref with label and space ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          content: "[[ FAQ|dendron.faq]]",
        }),
        "[[FAQ|dendron.bond]]"
      );
    });

    it("should replace short ref with label with short ref with label and space 2 ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          content: "[[FAQ |dendron.faq]]",
        }),
        "[[FAQ |dendron.bond]]"
      );
    });

    it("should replace short ref with label with short ref with label and space 3 ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          content: "[[FAQ| dendron.faq]]",
        }),
        "[[FAQ|dendron.bond]]"
      );
    });

    it("should replace short ref with label with short ref with label and space 4 ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          content: "[[FAQ|dendron.faq ]]",
        }),
        "[[FAQ|dendron.bond]]"
      );
    });
  });
});

// === Commands
suite("Copy Note URL", function () {
  let root: DirResult;
  this.timeout(TIMEOUT);
  let rootUrl = "dendron.so";

  before(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("with override", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(root.name, "vault", "bar.md"));
      await vscode.window.showTextDocument(uri);
      const link = await new CopyNoteURLCommand().run();
      const url = path.join(rootUrl, "notes", "id-bar.html");
      assert.equal(link, url);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: "dendron.so",
      },
      useFixtures: false,
      useCb: async (vault) => {
        NodeTestUtils.createNotes(vault, [
          {
            id: "id-bar",
            fname: "bar",
            body: "## Foo\nfoo text\n## Header\n Header text",
          },
        ]);
      },
    });
  });

  test("with selection and override", function (done) {
    onWSInit(async () => {
      const uri = vscode.Uri.file(path.join(root.name, "vault", "bar.md"));
      const editor = await vscode.window.showTextDocument(uri);
      editor.selection = new vscode.Selection(8, 0, 8, 12);
      const link = await new CopyNoteURLCommand().run();
      const url = path.join(rootUrl, "notes", "id-bar.html#foo");
      assert.equal(link, url);
      done();
    });
    setupDendronWorkspace(root.name, ctx, {
      configOverride: {
        [CONFIG.COPY_NOTE_URL_ROOT.key]: "dendron.so",
      },
      useFixtures: false,
      useCb: async (vault) => {
        NodeTestUtils.createNotes(vault, [
          {
            id: "id-bar",
            fname: "bar",
            body: "## Foo\nfoo text\n## Header\n Header text",
          },
        ]);
      },
    });
  });
});

suite("GoToSibling", function () {
  before(function () {
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  describe("GoToSibling: next", function () {
    this.timeout(TIMEOUT);
    let direction: GoToSiblingCommandOpts["direction"];
    let uri: vscode.Uri;
    direction = "next";

    const createNotes = (vaultPath: string) => {
      node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
        root: vaultPath,
      });
      node2MdFile(new Note({ fname: "foo.journal.2020.08.29" }), {
        root: vaultPath,
      });
      node2MdFile(new Note({ fname: "foo.journal.2020.08.30" }), {
        root: vaultPath,
      });
      node2MdFile(new Note({ fname: "foo.journal.2020.08.31" }), {
        root: vaultPath,
      });
    };

    beforeEach(async function () {
      root = FileTestUtils.tmpDir();
      ctx = VSCodeUtils.getOrCreateMockContext();
      await new ResetConfigCommand().execute({ scope: "all" });
    });

    afterEach(function () {
      HistoryService.instance().clearSubscriptions();
    });

    test("basic", function (done) {
      uri = vscode.Uri.file(
        path.join(root.name, "vault", "foo.journal.2020.08.30.md")
      );
      onWSInit(async () => {
        await vscode.window.showTextDocument(uri);
        const resp = await new GoToSiblingCommand().execute({ direction });
        assert.deepEqual(resp, { msg: "ok" });
        assert.equal(
          DNodeUtils.uri2Fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri as vscode.Uri
          ),
          "foo.journal.2020.08.31"
        );
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        useCb: async (vaultPath: string) => {
          return createNotes(vaultPath);
        },
      });
    });

    test("traversal from parent", function (done) {
      uri = vscode.Uri.file(
        path.join(root.name, "vault", "foo.journal.2020.08.md")
      );
      onWSInit(async () => {
        await vscode.window.showTextDocument(uri);
        const resp = await new GoToSiblingCommand().execute({ direction });
        assert.deepEqual(resp, { msg: "ok" });
        assert.equal(
          DNodeUtils.uri2Fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri as vscode.Uri
          ),
          "foo.journal.2020.09"
        );
        done();
      });

      setupDendronWorkspace(root.name, ctx, {
        useCb: async (vaultPath: string) => {
          createNotes(vaultPath);
          node2MdFile(new Note({ fname: "foo.journal.2020.08" }), {
            root: vaultPath,
          });
          node2MdFile(new Note({ fname: "foo.journal.2020.09" }), {
            root: vaultPath,
          });
        },
      });
    });

    test("go over index", function (done) {
      onWSInit(async () => {
        uri = vscode.Uri.file(
          path.join(root.name, "vault", "foo.journal.2020.08.31.md")
        );
        await vscode.window.showTextDocument(uri);
        const resp = await new GoToSiblingCommand().execute({ direction });
        assert.deepEqual(resp, { msg: "ok" });
        assert.equal(
          DNodeUtils.uri2Fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri as vscode.Uri
          ),
          "foo.journal.2020.08.29"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useCb: async (vaultPath: string) => {
          return createNotes(vaultPath);
        },
      });
    });

    test("one note", function (done) {
      onWSInit(async () => {
        uri = vscode.Uri.file(
          path.join(root.name, "vault", "foo.journal.2020.08.29.md")
        );
        await vscode.window.showTextDocument(uri);
        const resp = await new GoToSiblingCommand().execute({ direction });
        assert.deepEqual(resp, { msg: "no_siblings" });
        assert.equal(
          DNodeUtils.uri2Fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri as vscode.Uri
          ),
          "foo.journal.2020.08.29"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useCb: async (vaultPath: string) => {
          // fs.emptyDirSync(root.name);
          node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
            root: vaultPath,
          });
          node2MdFile(new Note({ fname: "foo.journal.2020.08.29" }), {
            root: vaultPath,
          });
          return;
        },
      });
    });

    // FIXME: investigate why fail
    test.skip("no open editor", function (done) {
      onWSInit(async () => {
        await VSCodeUtils.closeAllEditors();
        const resp = await new GoToSiblingCommand().execute({ direction });
        assert.deepEqual(resp, { msg: "no_editor" });
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useCb: async (vaultPath: string) => {
          node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
            root: vaultPath,
          });
        },
      });
    });

    test("nav in root", function (done) {
      onWSInit(async () => {
        uri = vscode.Uri.file(path.join(root.name, "vault", "root.md"));
        await vscode.window.showTextDocument(uri);
        const resp = await new GoToSiblingCommand().execute({ direction });
        assert.deepEqual(resp, { msg: "ok" });
        assert.equal(
          DNodeUtils.uri2Fname(
            VSCodeUtils.getActiveTextEditor()?.document.uri as vscode.Uri
          ),
          "foo"
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        useCb: async (vaultPath: string) => {
          node2MdFile(new Note({ fname: "root", id: "root", title: "root" }), {
            root: vaultPath,
          });
          node2MdFile(new Note({ fname: "foo" }), {
            root: vaultPath,
          });
          node2MdFile(new Note({ fname: "gamma" }), {
            root: vaultPath,
          });
        },
      });
    });
  });
});

// --- Pods

suite("ConfigurePod", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let podsDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("no config", function (done) {
    onWSInit(async () => {
      // await vscode.window.showTextDocument(uri);
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllExportPods();
      const podClassEntry = pods[0];
      const cmd = new ConfigurePodCommand();
      cmd.gatherInputs = async () => ({
        podClass: podClassEntry,
      });
      await cmd.run();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      assert.deepEqual(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
        configPath
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {},
    });
  });

  test("config present ", function (done) {
    onWSInit(async () => {
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllExportPods();
      const podClassEntry = pods[0];
      const cmd = new ConfigurePodCommand();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      const exportDest = path.join(
        getPodPath(podsDir, podClassEntry),
        "export.json"
      );
      ensureDirSync(path.dirname(configPath));
      writeYAML(configPath, { dest: exportDest } as ExportConfig);

      cmd.gatherInputs = async () => ({
        podClass: podClassEntry,
      });
      await cmd.run();
      assert.deepEqual(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
        configPath
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {},
    });
  });
});

suite("ImportPod", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let podsDir: string;
  let importSrc: string;
  let vault: string;
  this.timeout(TIMEOUT);

  beforeEach(async function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    importSrc = FileTestUtils.tmpDir().name;
    vault = path.join(root.name, "vault");
    DendronWorkspace.getOrCreate(ctx);
    await FileTestUtils.createFiles(importSrc, [
      { path: "project/p2/n1.md" },
      { path: "project/p1/n1.md" },
      { path: "project/p1/n2.md" },
      { path: "project/p1/.DS_STORE_TEST" },
      { path: "project/p1/n3.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p1/n1.pdf" },
      { path: "project/p.3/n1.md" },
    ]);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("no config", function (done) {
    onWSInit(async () => {
      // await vscode.window.showTextDocument(uri);
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllImportPods();
      const podClassEntry = pods[0];
      const cmd = new ImportPodCommand();
      cmd.gatherInputs = async () => ({
        podChoice: podClassEntryToPodItem(podClassEntry),
      });
      await cmd.run();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      assert.deepEqual(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
        configPath
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {},
    });
  });

  test("config present, default", function (done) {
    onWSInit(async () => {
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllImportPods();
      const podClassEntry = pods[0];
      const cmd = new ImportPodCommand();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      ensureDirSync(path.dirname(configPath));
      writeYAML(configPath, { src: importSrc });
      cmd.gatherInputs = async () => ({
        podChoice: podClassEntryToPodItem(podClassEntry),
      });
      await cmd.run();
      let [expectedFiles, actualFiles] = FileTestUtils.cmpFiles(vault, [
        "assets",
        "project.p1.md",
        "project.p1.n1.md",
        "project.p1.n2.md",
        "project.p2.n1.md",
        "project.p-3.n1.md",
        "root.md",
      ]);
      expect(expectedFiles, actualFiles);
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {},
    });
  });
});

suite("ExportPod", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  let podsDir: string;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("no config", function (done) {
    onWSInit(async () => {
      // await vscode.window.showTextDocument(uri);
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllExportPods();
      const podClassEntry = pods[0];
      const cmd = new ExportPodCommand();
      cmd.gatherInputs = async () => ({
        podChoice: podClassEntryToPodItem(podClassEntry),
      });
      await cmd.run();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      assert.deepEqual(
        VSCodeUtils.getActiveTextEditor()?.document.uri.fsPath,
        configPath
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {},
    });
  });

  test("config present, default", function (done) {
    onWSInit(async () => {
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllExportPods();
      const podClassEntry = pods[0];
      const cmd = new ExportPodCommand();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      const exportDest = path.join(
        getPodPath(podsDir, podClassEntry),
        "export.json"
      );
      ensureDirSync(path.dirname(configPath));
      writeYAML(configPath, { dest: exportDest } as ExportConfig);
      cmd.gatherInputs = async () => ({
        podChoice: podClassEntryToPodItem(podClassEntry),
      });
      await cmd.run();
      const payload = fs.readJSONSync(exportDest);
      assert.deepEqual(
        NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] }),
        [
          { fname: "root", body: "\n" },
          { fname: "bar", body: "bar body\n" },
        ]
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          { fname: "foo", stub: true },
          { fname: "bar" },
        ]);
      },
    });
  });

  test("config present, default, include stubs", function (done) {
    onWSInit(async () => {
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllExportPods();
      const podClassEntry = pods[0];
      const cmd = new ExportPodCommand();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      const exportDest = path.join(
        getPodPath(podsDir, podClassEntry),
        "export.json"
      );
      ensureDirSync(path.dirname(configPath));
      writeYAML(configPath, {
        dest: exportDest,
        includeStubs: true,
      } as ExportConfig);
      cmd.gatherInputs = async () => ({
        podChoice: podClassEntryToPodItem(podClassEntry),
      });
      await cmd.run();
      const payload = fs.readJSONSync(exportDest);
      assert.deepEqual(
        NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] }),
        [
          { fname: "root", body: "\n" },
          { fname: "bar", body: "bar body\n" },
          { fname: "foo", body: "foo body\n" },
        ]
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          { fname: "foo", stub: true },
          { fname: "bar" },
        ]);
      },
    });
  });

  test("config present, default, include stubs, no body", function (done) {
    onWSInit(async () => {
      podsDir = DendronWorkspace.instance().podsDir;
      const pods = getAllExportPods();
      const podClassEntry = pods[0];
      const cmd = new ExportPodCommand();
      const configPath = getPodConfigPath(podsDir, podClassEntry);
      const exportDest = path.join(
        getPodPath(podsDir, podClassEntry),
        "export.json"
      );
      ensureDirSync(path.dirname(configPath));
      writeYAML(configPath, {
        dest: exportDest,
        includeStubs: true,
        includeBody: false,
      } as ExportConfig);
      cmd.gatherInputs = async () => ({
        podChoice: podClassEntryToPodItem(podClassEntry),
      });
      await cmd.run();
      const payload = fs.readJSONSync(exportDest);
      assert.deepEqual(
        NodeTestUtils.cleanNodeMeta({ payload, fields: ["fname", "body"] }),
        [{ fname: "root" }, { fname: "bar" }, { fname: "foo" }]
      );
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          { fname: "foo", stub: true },
          { fname: "bar" },
        ]);
      },
    });
  });
});

// --- Lookup
// not sure how to have user accept yet
suite("Lookup", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("Lookup scratch note", function (done) {
    onWSInit(async () => {
      // const editor = VSCodeUtils.getActiveTextEditor();
      const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(9, 0, 9, 12);
      await new LookupCommand().execute({
        selectionType: "selection2link",
        noteType: "journal",
      });
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\nFoo line",
          },
        ]);
      },
    });
  });

  test("Lookup scratch note", function (done) {
    onWSInit(async () => {
      // const editor = VSCodeUtils.getActiveTextEditor();
      const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(9, 0, 9, 12);
      await new LookupCommand().execute({
        selectionType: "selection2link",
        noteType: "scratch",
      });
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\nFoo line",
          },
        ]);
      },
    });
  });

  test("Lookup selection2link", function (done) {
    onWSInit(async () => {
      // const editor = VSCodeUtils.getActiveTextEditor();
      const uri = vscode.Uri.file(path.join(root.name, "vault", "foo.md"));
      const editor = (await VSCodeUtils.openFileInEditor(
        uri
      )) as vscode.TextEditor;
      editor.selection = new vscode.Selection(9, 0, 9, 12);
      await new LookupCommand().execute({ selectionType: "selection2link" });
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\nFoo line",
          },
        ]);
      },
    });
  });
});

// --- Publishing

// get call.getFileName issue
suite.skip("Build Site", function () {
  let root: DirResult;
  let ctx: vscode.ExtensionContext;
  this.timeout(TIMEOUT);

  beforeEach(function () {
    root = FileTestUtils.tmpDir();
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  test("missing link", function (done) {
    onWSInit(async () => {
      await new BuildPodCommand().execute({});
      const editor = VSCodeUtils.getActiveTextEditor();
      // there's a webview present
      assert.ok(_.isUndefined(editor));
      done();
    });

    setupDendronWorkspace(root.name, ctx, {
      useCb: async () => {
        NodeTestUtils.createNotes(path.join(root.name, "vault"), [
          {
            id: "id.foo",
            fname: "foo",
            body: "# Foo Content\n # Bar Content [[missing-link]]",
          },
        ]);
      },
    });
  });
});
