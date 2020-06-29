import * as vscode from "vscode";
import { setEnv } from "@dendronhq/common-all";
import path from "path";
import fs from "fs-extra";

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

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration("dendron");
        _DendronWorkspace = this;
        fs.ensureDirSync(context.logPath);
        setEnv("LOG_DST", path.join(context.logPath, "dendron.log"));
    }
}