import { tmpDir } from "@dendronhq/common-server";
import sinon from "sinon";
import * as vscode from "vscode";
import { VSCodeUtils } from "../../vsCodeUtils";
import { DendronExtension } from "../../workspace";

export class VSCodeTestUtils {
  static mockUserConfigDir() {
    const dir = tmpDir().name;
    const getCodeUserConfigDurStub = sinon.stub(
      VSCodeUtils,
      "getCodeUserConfigDir"
    );
    getCodeUserConfigDurStub.callsFake(() => {
      const wrappedMethod = getCodeUserConfigDurStub.wrappedMethod;
      const originalOut = wrappedMethod();
      return {
        userConfigDir: [dir, originalOut.delimiter].join(""),
        delimiter: originalOut.delimiter,
        osName: originalOut.osName,
      };
    });
    return getCodeUserConfigDurStub;
  }

  static stubWSFolders(wsRoot: string | undefined) {
    if (wsRoot === undefined) {
      const stub = sinon
        .stub(vscode.workspace, "workspaceFolders")
        .value(undefined);
      DendronExtension.workspaceFolders = () => undefined;
      return stub;
    }
    const wsFolders = [
      {
        name: "root",
        index: 0,
        uri: vscode.Uri.parse(wsRoot),
      },
    ];
    const stub = sinon
      .stub(vscode.workspace, "workspaceFolders")
      .value(wsFolders);
    DendronExtension.workspaceFolders = () => wsFolders;
    return stub;
  }
}
