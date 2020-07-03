import { getAndInitializeEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { SchemaCommand } from "./commands/Schema";
import { LookupController } from "./components/lookup/LookupController";
import { CONFIG, DENDRON_COMMANDS, DENDRON_WS_NAME } from "./constants";
import { Logger } from "./logger";
import { NodeService } from "./services/nodeService/NodeService";
import { getPlatform, resolveTilde, VSCodeUtils } from "./utils";


function writeWSFile(fpath: string, opts: { rootDir: string }) {
    const jsonBody = {
        folders: [
            {
                path: path.join(opts.rootDir, "vault.main"),
            },
        ],
        settings: {
            "spellright.language": ["en"],
            "spellright.documentTypes": ["markdown", "latex", "plaintext"],
            "editor.minimap.enabled": false,
            "dendron.rootDir": opts.rootDir,
        },
        "extensions": {
            "recommendations": [
                "dendron.dendron",
                // git version history
                "eamodio.gitlens",
                // markdown extensions
                "shd101wyy.markdown-preview-enhanced",
                // Spellcheck
                "ban.spellright",
                // images
                "mushan.vscode-paste-image",
                // wikilinks, backlinks, and additional goodies
                "kortina.vscode-markdown-notes"
            ]
        }
    };
    fs.writeJsonSync(fpath, jsonBody);
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
    public config: vscode.WorkspaceConfiguration;
    public L: typeof Logger;
    private _engine?: DEngine

    constructor(context: vscode.ExtensionContext, opts?: { skipSetup?: boolean }) {
        opts = _.defaults(opts, { skipSetup: false });
        this.context = context;
        this.config = vscode.workspace.getConfiguration("dendron");
        _DendronWorkspace = this;
        this.L = Logger;
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
        const rootDir = this.config.get<string>(CONFIG.ROOT_DIR);
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
            vscode.commands.registerCommand(DENDRON_COMMANDS.LOOKUP, async () => {
                const ctx = DENDRON_COMMANDS.LOOKUP;
                this.L.info({ ctx: ctx + ":LookupController:pre" });
                const controller = new LookupController();
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
                await ns.deleteByPath(fsPath, "note");
                vscode.window.showInformationMessage(`${fsPath} deleted`);
            })
        );

        // === DEBUG Commands
        this.context.subscriptions.push(
            vscode.commands.registerCommand("dendron:debugWS", async () => {
                const ctx = "dendron:debugWS"
                this.L.info({ ctx })
                await this.changeWorkspace("/Users/kevinlin/Dropbox/Apps/Noah");
            })
        );
    }

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

    async reloadWorkspace() {
        const wsFolders = vscode.workspace.workspaceFolders;
        const mainVault = wsFolders![0].uri.fsPath;
        const engine = await getAndInitializeEngine(mainVault);
        // refresh schemas
        await new SchemaCommand().hack(engine);
        // hook into file create
        vscode.workspace.onDidCreateFiles((e) => {
            const files = e.files;
            vscode.window.showInformationMessage("file created");
        });
        return;
    }

    async setupWorkspace(rootDirRaw: string, opts?: { skipOpenWS?: boolean }) {
        opts = _.defaults(opts, { skipOpenWS: false });
        const ctx = "setupWorkspace";
        this.L.info({ ctx, rootDirRaw });
        const rootDir = resolveTilde(rootDirRaw);
        // TODO: prompt for confirmation
        fs.removeSync(rootDir);
        [rootDir].forEach((dirPath: string) => {
            fs.ensureDirSync(dirPath);
        });
        fs.copySync(path.join(this.extensionAssetsDir, "notes"), rootDir);
        writeWSFile(path.join(rootDir, DENDRON_WS_NAME), {
            rootDir,
        });
        if (!opts.skipOpenWS) {
            return VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME))
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