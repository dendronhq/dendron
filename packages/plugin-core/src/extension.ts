import * as vscode from "vscode";

import { DendronFileSystemProvider } from "./components/fsProvider";
import { LookupController } from "./components/lookup/LookupController";
import { createLogger } from "@dendronhq/common-server";

const L = createLogger("extension");

// --- VSCode

// === Main
// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log("activate");
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  DendronFileSystemProvider.getOrCreate().then((fs) => {
    context.subscriptions.push(
      vscode.workspace.registerFileSystemProvider("denfs", fs, {
        isCaseSensitive: true,
      })
    );
    console.log("fs initialized");
    vscode.workspace.updateWorkspaceFolders(0, 0, {
      uri: vscode.Uri.parse("denfs:/"),
      name: "Dendron",
    });
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("dendron.helloWorld", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from dendron!");
  });

  let dendronLookupDisposable = vscode.commands.registerCommand(
    "dendron.lookup",
    async () => {
      const ctx = "registerCommand";
      vscode.window.showInformationMessage("BOND!");
      L.info({ ctx: ctx + ":LookupController:pre" });
      const controller = new LookupController();
      L.info({ ctx: ctx + ":LookupController:post" });
      controller.show();
      // TODO: dispose

      // // === PickerProvider
      // // define picker
      // const quickpick = vscode.window.createQuickPick();
      // quickpick.title = "quickpick title";
      // quickpick.placeholder = "quickpick placeholder";
      // quickpick.ignoreFocusOut = true;

      // // picker items
      // const items = getQuickPickItems();

      // const disposables = new DisposableStore();
      // const picksDisposable = disposables.add(new MutableDisposable());
      // const valuePick = createPickFromValue("");
      // quickpick.items = items;

      // const updatePickerItems = async () => {
      //   //quickpick.busy = true;
      //   const { value } = quickpick;
      //   valuePick.label = value;

      //   //
      //   if (quickpick.activeItems.length === 0) {
      //     quickpick.items = [...items, createPickFromValue("bond")];
      //   }
      //   // quickpick.activeItems = [
      //   //   createPickFromValue(value),
      //   //   ...quickpick.activeItems,
      //   // ];
      //   //quickpick.items = [...getQuickPickItems(), createPickFromValue(value)];
      //   // quickpick.activeItems = [valuePick];
      //   //quickpick.busy = false;
      //   console.log("updatePickerItems");
      // };
      // const debouncedUpdate = _.debounce(updatePickerItems, 200);
      // disposables.add(quickpick.onDidChangeValue(updatePickerItems));

      // // quickpick.onDidChangeValue(async () => {
      // //   const { activeItems, selectedItems, value } = quickpick;
      // //   console.log({
      // //     ctx: "onDidChangeValue",
      // //     selectedItems: { selectedItems },
      // //     activeItems: { activeItems },
      // //     value: { value },
      // //   });
      // //   const itemCurrent: QuickPickItem = {
      // //     label: value,
      // //     description: "current selection",
      // //   };
      // //   activeItems[0].label = value;
      // //   // quickpick.activeItems = [itemCurrent].concat(
      // //   //   quickpick.activeItems as QuickPickItem[]
      // //   // );
      // //   // {
      // //   //   label: 'Search for',
      // //   //   description: quickpick.value,
      // //   //   item: quickpick.value
      // //   // }
      // // }, quickpick);
      // quickpick.onDidAccept(async () => {
      //   let items = quickpick.selectedItems;
      //   if (items.length === 0) {
      //     vscode.window.showInformationMessage("no item selected");
      //   }
      //   if (items.length === 1) {
      //     const item = items[0];
      //     const ext = ".md";
      //     vscode.window.showInformationMessage(JSON.stringify(item));
      //     const wsFolder: Uri = getFirstWorkspaceFolder({ asUri: true }) as Uri;
      //     // TODO: check if not set
      //     const selectedFile = vscode.Uri.joinPath(wsFolder, item.label + ext);
      //     console.log({ selectedFile });
      //     const document = await vscode.workspace.openTextDocument(
      //       selectedFile
      //     );
      //     vscode.window.showTextDocument(document);
      //   }
      // });
      // quickpick.show();
      // quickpick.buttons = this.getButtons(step, commandsStep.command);

      // const selection = await vscode.window.showQuickPick(items, {
      //   placeHolder: "placeholder",
      //   ignoreFocusOut: false,
      //   matchOnDescription: true,
      //   matchOnDetail: true,
      // });
      // vscode.window.showInformationMessage(JSON.stringify(selection));
    }
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("dendron.workspaceInit", () => {
      vscode.window.showInformationMessage("Init workspace");
      vscode.workspace.updateWorkspaceFolders(0, 0, {
        uri: vscode.Uri.parse("denfs:/"),
        name: "Dendron",
      });
    })
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(dendronLookupDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("deactivate");
}
