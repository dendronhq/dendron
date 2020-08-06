import { DNode, Note } from "@dendronhq/common-all";
import {
  DirResult, FileTestUtils,

  mdFile2NodeProps
} from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import * as assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import { afterEach, before, beforeEach, describe } from "mocha";
import path from "path";
// // You can import and use all API from the 'vscode' module
// // as well as import your extension to test it
import * as vscode from "vscode";
import { ChangeWorkspaceCommand } from "../../commands/ChangeWorkspace";
import { CreateJournalCommand } from "../../commands/CreateJournal";
import { DoctorCommand } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import { SetupWorkspaceCommand } from "../../commands/SetupWorkspace";
import { createNoActiveItem, EngineOpts, LookupProvider } from "../../components/lookup/LookupProvider";
import { CONFIG, WORKSPACE_STATE } from "../../constants";
import { _activate } from "../../extension";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";

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
      "materialTheme.accent": "Red",
      "workbench.colorTheme": "Material Theme High Contrast",
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

function setupDendronWorkspace(rootDir: string, ctx: vscode.ExtensionContext) {
  DendronWorkspace.configuration = () => {
    const config: any = {
      dendron: {
        rootDir,
      },
    };
    _.forEach(CONFIG, (ent) => {
      if (ent.default) {
        _.set(config, ent.key, ent.default);
      }
    });
    return createMockConfig(config);
  };
  DendronWorkspace.workspaceFile = () => {
    return vscode.Uri.file(path.join(rootDir, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = vscode.Uri.file(path.join(rootDir, "vault"));
    return [{ uri, name: "vault", index: 0 }];
  };
  return new SetupWorkspaceCommand()
    .execute({ rootDirRaw: rootDir, skipOpenWs: true })
    .then(async () => {
      return _activate(ctx);
    });
}

function onWSActive(cb: Function) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === "activate") {
        await cb();
      }
    }
  );
}
function onWSInit(cb: Function) {
  HistoryService.instance().subscribe(
    "extension",
    async (_event: HistoryEvent) => {
      if (_event.action === "initialized") {
        await cb();
      }
    }
  );
}
let root: DirResult;
let ctx: vscode.ExtensionContext;

const TIMEOUT = 60 * 1000 * 5;

suite("startup", function () {
  const timeout = 60 * 1000 * 5;

  before(function () {
    console.log("before");
    ctx = VSCodeUtils.getOrCreateMockContext();
    DendronWorkspace.getOrCreate(ctx);
  });

  beforeEach(async function () {
    console.log("before");
    await new ResetConfigCommand().execute({ scope: "all" });
    root = FileTestUtils.tmpDir();
    fs.removeSync(root.name);
    ctx = VSCodeUtils.getOrCreateMockContext();
    console.log("before-done");
    return;
  });

  afterEach(function () {
    HistoryService.instance().clearSubscriptions();
  });

  describe("sanity", function () {
    vscode.window.showInformationMessage("Start sanity test.");
    this.timeout(timeout);

    test("workspace not activated", function (done) {
      DendronWorkspace.configuration = () => {
        return createMockConfig({
          dendron: {},
        });
      };
      _activate(ctx);
      // const ws = DendronWorkspace.instance();
      // ws.reloadWorkspace(root)
      onWSActive(async (_event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), false);
        done();
      });
    });

    test("workspace active, no prior workspace version", function (done) {
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
      new SetupWorkspaceCommand()
        .execute({ rootDirRaw: root.name, skipOpenWs: true })
        .then(() => {
          _activate(ctx);
        });
      onWSActive(async (_event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), true);
        const config = fs.readJSONSync(
          path.join(root.name, DendronWorkspace.DENDRON_WORKSPACE_FILE)
        );
        const wsFolders = DendronWorkspace.workspaceFolders() as vscode.WorkspaceFolder[];
        const wsRoot = wsFolders[0].uri.fsPath;
        const snippetsPath = path.join(
          wsRoot,
          ".vscode",
          "dendron.code-snippets"
        );
        assert.ok(fs.existsSync(snippetsPath));
        assert.deepEqual(config, expectedSettings());
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
      ctx.workspaceState
        .update(WORKSPACE_STATE.WS_VERSION, "0.0.1")
        .then(() => {
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
      onWSActive(async (_event: HistoryEvent) => {
        assert.equal(DendronWorkspace.isActive(), true);
        // updated to latest version
        assert.equal(
          ctx.workspaceState.get(WORKSPACE_STATE.WS_VERSION),
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
    this.timeout(timeout);

    test("lookup new node", function (done) {
      setupDendronWorkspace(root.name, ctx).then(() => {
        onWSActive(async () => {
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
    });

    test("lookup new node with schema template", function (done) {
      setupDendronWorkspace(root.name, ctx).then(() => {
        onWSActive(async () => {
          assert.equal(DendronWorkspace.isActive(), true);
          const lbl = "dendron.demo.template";
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
          assert.equal(_.trim(node.body), "I am text from a template.");
          done();
        });
      });
    });

    test("lookup new node with schema template for namespace", function (done) {
      setupDendronWorkspace(root.name, ctx).then(() => {
        onWSActive(async () => {
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

  describe("new journal command", function () {
    test("lookup new node", function (done) {
      onWSInit(async () => {
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.md")
        );
        await vscode.window.showTextDocument(uri);
        VSCodeUtils.showInputBox = async (opts: vscode.InputBoxOptions|undefined) => {
          return opts?.value;
        }
        const resp = await new CreateJournalCommand().run() as vscode.Uri;
        assert.ok(resp.fsPath.indexOf("dendron.journal") > 0);
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });
  });

  // --- Dev
  describe("DoctorCommand", function () {
    test("basic", function (done) {
      onWSInit(async () => {
        const testFile = path.join(root.name, "vault", "bond2.md");
        fs.writeFileSync(testFile, "bond", {encoding: "utf8"});
        const engine = await new ReloadIndexCommand().run();
        await new DoctorCommand().run();
        const nodeProps = mdFile2NodeProps(testFile);
        assert.equal(_.trim(nodeProps.title), "Bond2")
        assert.ok(nodeProps.id);
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });
  });

});
