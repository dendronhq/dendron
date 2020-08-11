import { DNode, Note } from "@dendronhq/common-all";
import {
  DirResult,
  FileTestUtils,
  mdFile2NodeProps,
  EngineTestUtils,
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
import { workspace } from "vscode";
import { ChangeWorkspaceCommand } from "../../commands/ChangeWorkspace";
import { CopyNoteLinkCommand } from "../../commands/CopyNoteLink";
import { CreateJournalCommand } from "../../commands/CreateJournal";
import { CreateScratchCommand } from "../../commands/CreateScratch";
import { DoctorCommand } from "../../commands/Doctor";
import { ReloadIndexCommand } from "../../commands/ReloadIndex";
import { RenameNoteV2Command } from "../../commands/RenameNoteV2";
import { ResetConfigCommand } from "../../commands/ResetConfig";
import {
  SetupWorkspaceCommand,
  SetupWorkspaceOpts,
} from "../../commands/SetupWorkspace";
import {
  createNoActiveItem,
  EngineOpts,
  LookupProvider,
} from "../../components/lookup/LookupProvider";
import { CONFIG, ConfigKey, WORKSPACE_STATE } from "../../constants";
import { _activate } from "../../extension";
import { replaceRefs } from "../../external/memo/utils/utils";
import { HistoryEvent, HistoryService } from "../../services/HistoryService";
import { VSCodeUtils } from "../../utils";
import { DendronWorkspace } from "../../workspace";
import { RefactorHierarchyCommand } from "../../commands/RefactorHierarchy";
import { ArchiveHierarchyCommand } from "../../commands/ArchiveHierarchy";

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

function setupDendronWorkspace(
  rootDir: string,
  ctx: vscode.ExtensionContext,
  opts?: {
    configOverride?: any;
    setupWsOverride?: Partial<SetupWorkspaceOpts>;
    useFixtures?: boolean;
  }
) {
  const optsClean = _.defaults(opts, {
    configOverride: {},
    setupWsOverride: {},
  });
  if (opts?.useFixtures) {
    optsClean.setupWsOverride = { emptyWs: true };
  }
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
  DendronWorkspace.workspaceFile = () => {
    return vscode.Uri.file(path.join(rootDir, "dendron.code-workspace"));
  };
  DendronWorkspace.workspaceFolders = () => {
    const uri = vscode.Uri.file(path.join(rootDir, "vault"));
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
        await EngineTestUtils.setupDendronVault({
          copyFixtures: true,
          root: path.join(rootDir, "vault"),
        });
      }
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
      setupDendronWorkspace(root.name, ctx);
      onWSInit(async () => {
        console.log("lookup");
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

    test("lookup new node with schema template", function (done) {
      setupDendronWorkspace(root.name, ctx);
      onWSInit(async () => {
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

    test("lookup new node with schema template for namespace", function (done) {
      setupDendronWorkspace(root.name, ctx);
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
        const resp = (await new CreateJournalCommand().run()) as vscode.Uri;
        assert.ok(resp.fsPath.indexOf("dendron.journal") > 0);
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
        const resp = (await new CreateJournalCommand().run()) as vscode.Uri;
        assert.ok(resp.fsPath.indexOf("bar.one.journal") > 0);
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
        const resp = (await new CreateJournalCommand().run()) as vscode.Uri;
        assert.ok(resp.fsPath.indexOf("dendron.faq.journal") > 0);
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
        const resp = (await new CreateJournalCommand().run()) as vscode.Uri;
        assert.ok(resp.fsPath.indexOf("dendron.foo") > 0);
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
        const resp = (await new CreateJournalCommand().run()) as vscode.Uri;
        assert.ok(path.basename(resp.fsPath).startsWith("journal"));
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
        const uri = vscode.Uri.file(
          path.join(root.name, "vault", "dendron.faq.md")
        );
        await vscode.window.showTextDocument(uri);
        const link = await new CopyNoteLinkCommand().run();
        assert.equal(link, "[[ Faq | dendron.faq ]]");
        done();
      });
      setupDendronWorkspace(root.name, ctx);
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
        assert.equal(resp.refsUpdated, 2);
        assert.deepEqual(
          resp.pathsUpdated.map((p: string) => path.basename(p)),
          ["foo.md", "archive.refactor.one.md"]
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
        assert.equal(resp.refsUpdated, 2);
        assert.deepEqual(
          resp.pathsUpdated.map((p: string) => path.basename(p)),
          ["foo.md", "bond.one.md"]
        );
        done();
      });
      setupDendronWorkspace(root.name, ctx, {
        setupWsOverride: { emptyWs: true },
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
  });
});

suite("memo", function () {
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

  describe("basic", () => {
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
        // const editor = await vscode.window.showTextDocument(
        //   vscode.Uri.file(),
        // );
        assert.ok(text.indexOf("[[FAQ |dendron.bond]]") > 0);
        assert.ok(textOfNew.indexOf("shaken") > 0);
        done();
      });
      setupDendronWorkspace(root.name, ctx);
    });
  });
});

const it = test;
const expect = assert.deepEqual;

suite("utils", function () {
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
          document: await workspace.openTextDocument({
            language: "markdown",
            content: "[[test-ref]]",
          }),
        }),
        "[[new-test-ref]]"
      );
    });

    it("should replace short ref with short ref", async () => {
      assert.deepEqual(
        replaceRefs({
          refs: [{ old: "test-ref", new: "new-test-ref" }],
          document: await workspace.openTextDocument({
            language: "markdown",
            content: "[[test-ref]]",
          }),
        }),
        "[[new-test-ref]]"
      );
    });

    it("should replace short ref with label with short ref with label", async () => {
      const replace = replaceRefs({
        refs: [{ old: "test-ref", new: "new-test-ref" }],
        document: await workspace.openTextDocument({
          language: "markdown",
          content: "[[Test Label|test-ref]]",
        }),
      });
      expect(replace, "[[Test Label|new-test-ref]]");
    });

    // custom
    it("should replace short ref with label with short ref with label and space ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          document: await workspace.openTextDocument({
            language: "markdown",
            content: "[[ FAQ|dendron.faq]]",
          }),
        }),
        "[[FAQ|dendron.bond]]"
      );
    });

    it("should replace short ref with label with short ref with label and space 2 ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          document: await workspace.openTextDocument({
            language: "markdown",
            content: "[[FAQ |dendron.faq]]",
          }),
        }),
        "[[FAQ |dendron.bond]]"
      );
    });

    it("should replace short ref with label with short ref with label and space 3 ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          document: await workspace.openTextDocument({
            language: "markdown",
            content: "[[FAQ| dendron.faq]]",
          }),
        }),
        "[[FAQ|dendron.bond]]"
      );
    });

    it("should replace short ref with label with short ref with label and space 4 ", async () => {
      expect(
        replaceRefs({
          refs: [{ old: "dendron.faq", new: "dendron.bond" }],
          document: await workspace.openTextDocument({
            language: "markdown",
            content: "[[FAQ|dendron.faq ]]",
          }),
        }),
        "[[FAQ|dendron.bond]]"
      );
    });
  });
});
