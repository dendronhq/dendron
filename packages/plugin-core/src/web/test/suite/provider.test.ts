// // You can import and use all API from the 'vscode' module
// // import * as myExtension from '../../extension';
// import { DVault } from "@dendronhq/common-all";
// import { NoteLookupProvider } from "../../commands/lookup/NoteLookupProvider";
// import { MockEngineAPIService } from "../helpers/MockEngineAPIService";

// suite("Note Lookup Provider Tests", () => {
//   test("Sample test", async () => {
//     const provider = new NoteLookupProvider(new MockEngineAPIService());

//     const vault1: DVault = {
//       name: "vault1",
//       fsPath: "vault1",
//     };
//     // debugger;
//     const items = await provider.provideItems({
//       _justActivated: false,
//       nonInteractive: false,
//       forceAsIsPickerValueUsage: false,
//       pickerValue: "foo",
//       prevQuickpickValue: "",
//       showDirectChildrenOnly: false,
//       workspaceState: {
//         wsRoot: "wsRoot",
//         vaults: [vault1],
//         schemas: {},
//       },
//     });

//     // debugger;
//     console.log(`items are ${items}`);
//   });
// });
