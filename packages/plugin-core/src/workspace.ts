import { createLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import * as vscode from "vscode";
import { LookupController } from "./components/lookup/LookupController";
import { DENDRON_COMMANDS, DENDRON_WS_NAME } from "./constants";
import { getPlatform, resolveTilde, VSCodeUtils } from "./utils";
import { NodeService } from "./services/nodeService/NodeService";
import { getVSCodeDownloadUrl } from "vscode-test/out/util";


function writeWSFile(fpath: string, opts: { rootDir: string }) {
    const jsonBody = {
        folders: [
            {
                path: opts.rootDir,
            },
        ],
        settings: {
            "spellright.language": ["en"],
            "spellright.documentTypes": ["markdown", "latex", "plaintext"],
            "editor.minimap.enabled": false,
            "dendron.rootDir": opts.rootDir,
        },
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
    public L: ReturnType<typeof createLogger>;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration("dendron");
        _DendronWorkspace = this;
        this.L = createLogger("dendron");
        this._setupCommands();
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

    async setupWorkspace(rootDirRaw: string) {
        const ctx = "setupWorkspace";
        this.L.info({ ctx, rootDirRaw });
        const rootDir = resolveTilde(rootDirRaw);
        // TODO: prompt for confirmation
        fs.removeSync(rootDir);
        [rootDir].forEach((dirPath: string) => {
            fs.ensureDirSync(dirPath);
        });
        const assetsDir = path.join(this.context.extensionPath, "assets");
        const dotVscodeDefault = path.join(assetsDir, ".vscode");
        fs.copySync(dotVscodeDefault, path.join(rootDir, ".vscode"));
        fs.copySync(path.join(assetsDir, "notes"), rootDir);
        writeWSFile(path.join(rootDir, DENDRON_WS_NAME), {
            rootDir,
        });
        VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
    }
}