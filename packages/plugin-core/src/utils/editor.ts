import vscode  from "vscode" ;

export function isAnythingSelected(): boolean {
    return !vscode.window?.activeTextEditor?.selection?.isEmpty;
}
