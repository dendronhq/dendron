import { DEngine, DNodeUtils, getStage, Note } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { LookupController } from "./components/lookup/LookupController";
import { node2Uri } from "./components/lookup/utils";
import { CONFIG, DENDRON_COMMANDS, DENDRON_WS_NAME, extensionQualifiedId, GLOBAL_STATE } from "./constants";
import { Logger } from "./logger";
import { NodeService } from "./services/nodeService/NodeService";
import { Settings } from "./settings";
import { getPlatform, resolveTilde, VSCodeUtils } from "./utils";


function writeWSFile(fpath: string, opts: { rootDir: string }) {
    const jsonBody = {
        folders: [
            {
                path: path.join(opts.rootDir, "vault.main"),
            },
        ],
        settings: Settings.defaults(opts),
        "extensions": {
            "recommendations": [
                // git version history
                // non-developers don't have git, will leave as optional for now
                // "eamodio.gitlens",
                // markdown extensions
                "shd101wyy.markdown-preview-enhanced",
                // Spellcheck
                "ban.spellright",
                // images
                "mushan.vscode-paste-image",
                // wikilinks, backlinks, and additional goodies
                "kortina.vscode-markdown-notes",
                // material theme
                "equinusocio.vsc-material-theme",
                // tree generator
                "aprilandjan.ascii-tree-generator",
                // markdown shortcuts
                "mdickin.markdown-shortcuts"
            ]
        }
    };
    fs.writeJsonSync(fpath, jsonBody, {spaces: 4});
}

let _DendronWorkspace: DendronWorkspace | null;

export class DendronWorkspace {

    static instance(): DendronWorkspace {
        if (!_DendronWorkspace) {
            throw Error("Dendronworkspace not initialized");
        }
        return _DendronWorkspace;
    }

    static isActive(): boolean {
        const conf = vscode.workspace.getConfiguration("dendron").get("rootDir");
        if (conf) {
            return true;
        } else {
            return false;
        }
    }

    public context: vscode.ExtensionContext;
    public configDendron: vscode.WorkspaceConfiguration;
    public configWS?: vscode.WorkspaceConfiguration;
    public L: typeof Logger;
    private _engine?: DEngine
    public version: string

    constructor(context: vscode.ExtensionContext, opts?: { skipSetup?: boolean }) {
        const ctx = "constructor"
        opts = _.defaults(opts, { skipSetup: false });
        this.context = context;
        this.configDendron = vscode.workspace.getConfiguration("dendron");
        _DendronWorkspace = this;
        this.L = Logger;

        // get workspace 
        if (getStage() !== "test") {
            this.configWS = vscode.workspace.getConfiguration(undefined, VSCodeUtils.getWorkspaceFolders(true) as vscode.WorkspaceFolder);
        }

        // get version
        if (VSCodeUtils.isDebuggingExtension()) {
            this.version = VSCodeUtils.getVersionFromPkg();
        } else {
            try {
            const dendronExtension= vscode.extensions.getExtension(extensionQualifiedId)!;
            this.version = dendronExtension.packageJSON.version;
            } catch (err) {
                this.L.info({ctx, msg: "fetching from file", dir: __dirname})
                this.version = VSCodeUtils.getVersionFromPkg();
            }
        }
        this.L.info({ctx, version: this.version})
        if (!opts.skipSetup) {
            this._setupCommands();
        }
    }

    get engine(): DEngine {
        if (!this._engine) {
            throw Error("engine not initialized");
        }
        return this._engine;
    }


    get rootDir(): string {
        const rootDir = this.configDendron.get<string>(CONFIG.ROOT_DIR);
        if (!rootDir) {
            throw Error("rootDir not initialized");
        }
        return rootDir;
    }

    get extensionAssetsDir(): string {
        const assetsDir = path.join(this.context.extensionPath, "assets");
        return assetsDir;
    }

    _setupCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand(DENDRON_COMMANDS.INIT_WS, async () => {
                const ctx = DENDRON_COMMANDS.INIT_WS;
                let rootDirDefault = "";
                const platform = getPlatform();
                if (platform === "darwin") {
                    rootDirDefault = "~/Documents/Dendron";
                }
                const resp = await vscode.window.showInputBox({
                    value: rootDirDefault,
                    prompt: "Select your default folder for dendron",
                    ignoreFocusOut: true,
                });
                if (!resp) {
                    this.L.error({ ctx, msg: "no input" });
                    // TODO
                    throw Error("must enter");
                }
                this.setupWorkspace(resp);
            })
        );
        this.context.subscriptions.push(
            vscode.commands.registerCommand(DENDRON_COMMANDS.CHANGE_WS, async () => {
                const ctx = DENDRON_COMMANDS.CHANGE_WS;
                const resp = await vscode.window.showInputBox({
                    prompt: "Select your folder for dendron",
                    ignoreFocusOut: true,
                });
                if (!resp) {
                    this.L.error({ ctx, msg: "no input" });
                    // TODO
                    throw Error("must enter");
                }
                this.changeWorkspace(resp);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand(DENDRON_COMMANDS.RELOAD_WS, async () => {
                await this.reloadWorkspace();
                vscode.window.showInformationMessage(`ws reloaded`);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand(DENDRON_COMMANDS.RESET_CONFIG, async () => {
                await Promise.all(_.keys(GLOBAL_STATE).map(k => {
                    this.updateGlobalState(k as keyof typeof GLOBAL_STATE, undefined);
                }));
                vscode.window.showInformationMessage(`reset config`);
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand(DENDRON_COMMANDS.LOOKUP, async () => {
                const ctx = DENDRON_COMMANDS.LOOKUP;
                this.L.info({ ctx: ctx + ":LookupController:pre" });
                const controller = new LookupController(this);
                this.L.info({ ctx: ctx + ":LookupController:post" });
                controller.show();
            })
        );

        this.context.subscriptions.push(
            vscode.commands.registerCommand(DENDRON_COMMANDS.DELETE_NODE, async () => {
                const ctx = DENDRON_COMMANDS.DELETE_NODE;
                this.L.info({ ctx });
                const ns = new NodeService();
                const fsPath = VSCodeUtils.getFsPathFromTextEditor(VSCodeUtils.getActiveTextEditor() as vscode.TextEditor);
                const note: Note = (await ns.deleteByPath(fsPath, "note") as Note);
                const closetParent = DNodeUtils.findClosestParent(note.logicalPath, this.engine.notes, {noStubs: true});
                const uri = node2Uri(closetParent);
                try {
                    await vscode.window.showTextDocument(uri)
                } catch (err) {
                    this.L.error({ctx, msg: `can't open uri: ${uri}`});
                }
                vscode.window.showInformationMessage(`${fsPath} deleted`);
            })
        );
    }

    // === Utils

    getGlobalState<T>(key: keyof typeof GLOBAL_STATE) {
        const _key = GLOBAL_STATE[key];
        return this.context.globalState.get<T>(_key)
    }

    updateGlobalState(key: keyof typeof GLOBAL_STATE, value: any) {
        const _key = GLOBAL_STATE[key]
        return this.context.globalState.update(_key, value);
    }

    // === Workspace

    async changeWorkspace(rootDirRaw: string) {
        const ctx = "changeWorkspace";
        this.L.info({ ctx, rootDirRaw });
        const rootDir = resolveTilde(rootDirRaw);
        if (!fs.existsSync(rootDir)) {
            throw Error(`${rootDir} does not exist`);
        }
        if (!fs.existsSync(path.join(rootDir, DENDRON_WS_NAME))) {
            throw Error(`workspace file does not exist`);
        }
        VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
    }

    async reloadWorkspace(mainVault?: string) {
        // const rootDir = this.rootDir;
        //VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME), this.context);
        if (!mainVault)  {
            const wsFolders = vscode.workspace.workspaceFolders;
            mainVault = wsFolders![0].uri.fsPath;
        }
        const engine = DendronEngine.getOrCreateEngine({root: mainVault});
        await engine.init()
        this._engine = engine;
        // refresh schemas
        // await new SchemaCommand().hack(engine);
        /*
        // hook into file create
        vscode.workspace.onDidCreateFiles(async (e) => {
            const ents: FileMeta[] = e.files.map(uri => ({
                prefix: DNodeUtils.basename(uri.fsPath, true),
                fpath: uri.fsPath,
            }));
            const nodes2Update: Note[] = []
            const fp = new FileParser(this.engine.store, {errorOnEmpty: false});
            ents.map(ent => {
                const {node} = fp.toNode(ent, [], this.engine.store)
                const note = assertExists<Note>(node as Note, "node exists")
                nodes2Update.push(note);
                const closetParent = DNodeUtils.findClosestParent(
                    note.logicalPath,
                    this.engine.notes
                  );
                  const stubNodes = NoteUtils.createStubNotes(
                    closetParent as Note,
                    note
                  );
                  stubNodes.forEach(sn => {
                      nodes2Update.push(sn);
                  });
            });

            // await this.engine.updateNodes(_.values(notes), {newNode: true, parentsAsStubs: true});
            vscode.window.showInformationMessage("file added to engine");
        });
        */
        return;
    }

    /**
     * Initialize a new directory with dendron files
     * @param rootDirRaw
     * @param opts 
     */
    async setupWorkspace(rootDirRaw: string, opts?: { skipOpenWS?: boolean }) {
        opts = _.defaults(opts, { skipOpenWS: false });
        const ctx = "setupWorkspace";
        this.L.info({ ctx, rootDirRaw });
        const rootDir = resolveTilde(rootDirRaw);
        if (fs.existsSync(rootDir)) {
            const options = {
                "delete": {msg: "delete existing folder", alias: "d"},
                "abort": {msg: "abort current operation", alias: "a"},
                "continue": {msg: "initialize workspace into current folder", alias: "c"}
            }
            const resp = await vscode.window.showInputBox({
                prompt: `${rootDir} exists. Please specify the next action. Your options: ${_.map(options, (v, k)=> {
                    return `(${k}: ${v.msg})`
                }).join(", ")}`,
                ignoreFocusOut: true,
                value: 'continue',
                validateInput: async (value: string) => {
                    if (!_.includes(_.keys(options), value.toLowerCase())) {
                        return `not valid input. valid inputs: ${_.keys(options).join(", ")}`
                    }
                    return null;
                }
            });
            if (resp === "abort") {
                vscode.window.showInformationMessage("did not initialize dendron workspace");
                return;
            } else 
            if (resp === "delete") {
                fs.removeSync(rootDir);
                vscode.window.showInformationMessage("removing existing folder");
            } 
        };
        [rootDir].forEach((dirPath: string) => {
            fs.ensureDirSync(dirPath);
        });
        fs.copySync(path.join(this.extensionAssetsDir, "notes"), rootDir);
        writeWSFile(path.join(rootDir, DENDRON_WS_NAME), {
            rootDir,
        });
        if (!opts.skipOpenWS) {
            vscode.window.showInformationMessage("opening dendron workspace");
            return VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
        }
    }

    async showWelcome(welcomeUri?: vscode.Uri) {
        welcomeUri = welcomeUri || vscode.Uri.parse(path.join(this.rootDir, "vault.main", "dendron.md"));
        try {
            await vscode.window.showTextDocument(welcomeUri);
            await MarkdownUtils.openPreview();
        } catch (err) {
            vscode.window.showErrorMessage(JSON.stringify(err));
        }

    }
}

class MarkdownUtils {
    static async openPreview() {
        let previewEnhanced = vscode.extensions.getExtension('shd101wyy.markdown-preview-enhanced');
        const openMarkdownCmd = previewEnhanced ? "markdown-preview-enhanced.openPreviewToTheSide" : "markdown.showPreviewToSide";
        return vscode.commands.executeCommand(openMarkdownCmd);
    }
}