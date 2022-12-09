import {
  DVault,
  NoteQuickInputV2,
  ReducedDEngine,
} from "@dendronhq/common-all";
import { stubInterface } from "ts-sinon";
import { ILookupProvider } from "../../../commands/lookup/ILookupProvider";
import { MoveNoteCmd } from "../../../commands/MoveNoteCmd";
import {
  LookupAcceptPayload,
  LookupController,
} from "../../../commands/lookup/LookupController";
import sinon from "sinon";
import { window } from "vscode";
import assert from "assert";
import {
  ProceedCancel,
  QuickPickUtils,
} from "../../../commands/lookup/QuickPickUtils";
import { createNote } from "../../helpers/setupTestEngineContainer";
import * as vscode from "vscode";

function getVaults(): DVault[] {
  const vaults: DVault[] = [{ fsPath: "vault1" }, { fsPath: "vault2" }];

  return vaults;
}

suite("WHEN Move note command is run", () => {
  test("WHEN move note from vault1 to vault2 THEN move successfully", async () => {
    const mockNoteProvider = stubInterface<ILookupProvider>();
    const mockEngine = stubInterface<ReducedDEngine>();
    const wsRoot = vscode.Uri.file("tmp");
    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
    } as unknown as LookupController;
    const vaults = getVaults();
    const lookupReturn: LookupAcceptPayload = {
      items: [{ fname: "foo.one", vault: vaults[0] } as NoteQuickInputV2],
    };

    const showLookupFake = sinon.fake.resolves(lookupReturn);
    sinon.replace(factory, "showLookup", showLookupFake);
    mockEngine.renameNote.resolves({ data: [] });
    mockEngine.queryNotesMeta.resolves([]);
    mockEngine.findNotesMeta.resolves([]);
    sinon.stub(window, "showQuickPick").resolves({ vault: vaults[1] } as any);

    const moveNoteCmd = new MoveNoteCmd(
      vaults,
      mockNoteProvider,
      mockEngine,
      factory,
      wsRoot
    );
    const movesSpy = sinon.spy(moveNoteCmd, "getDesiredMoves");

    await moveNoteCmd.run({ closeAndOpenFile: false });
    assert(movesSpy.alwaysCalledWith(lookupReturn, vaults[1]));
    assert(
      movesSpy.alwaysReturned([
        {
          oldLoc: { fname: "foo.one", vaultName: "vault1" },
          newLoc: { fname: "foo.one", vaultName: "vault2" },
        },
      ])
    );
    sinon.restore();
  });
  test("WHEN multiple notes are moved from vault1 to vault2 THEN the desired moves has correct data", async () => {
    const mockNoteProvider = stubInterface<ILookupProvider>();
    const mockEngine = stubInterface<ReducedDEngine>();
    const wsRoot = vscode.Uri.file("tmp");
    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
    } as unknown as LookupController;
    const vaults = getVaults();
    const lookupReturn: LookupAcceptPayload = {
      items: [
        { fname: "foo.one", vault: vaults[0] } as NoteQuickInputV2,
        { fname: "foo.two", vault: vaults[0] } as NoteQuickInputV2,
      ],
    };

    const showLookupFake = sinon.fake.resolves(lookupReturn);
    sinon.replace(factory, "showLookup", showLookupFake);
    mockEngine.renameNote.resolves({ data: [] });
    mockEngine.queryNotesMeta.resolves([]);
    mockEngine.findNotesMeta.resolves([]);
    sinon.stub(window, "showQuickPick").resolves({ vault: vaults[1] } as any);

    const moveNoteCmd = new MoveNoteCmd(
      vaults,
      mockNoteProvider,
      mockEngine,
      factory,
      wsRoot
    );
    const movesSpy = sinon.spy(moveNoteCmd, "getDesiredMoves");
    sinon
      .stub(QuickPickUtils, "showProceedCancel")
      .resolves(ProceedCancel.CANCEL);
    const result = await moveNoteCmd.run({ closeAndOpenFile: false });
    assert(movesSpy.alwaysCalledWith(lookupReturn, vaults[1]));
    assert(
      movesSpy.alwaysReturned([
        {
          oldLoc: { fname: "foo.one", vaultName: "vault1" },
          newLoc: { fname: "foo.one", vaultName: "vault2" },
        },
        {
          oldLoc: { fname: "foo.two", vaultName: "vault1" },
          newLoc: { fname: "foo.two", vaultName: "vault2" },
        },
      ])
    );
    assert(result.changed.length === 0);
    sinon.restore();
  });
  test("WHEN all vaults already have a note selected to move THEN show error message to user", async () => {
    const mockNoteProvider = stubInterface<ILookupProvider>();
    const mockEngine = stubInterface<ReducedDEngine>();
    const wsRoot = vscode.Uri.file("tmp");
    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
    } as unknown as LookupController;
    const vaults = getVaults();
    const lookupReturn: LookupAcceptPayload = {
      items: [{ fname: "foo.one", vault: vaults[0] } as NoteQuickInputV2],
    };

    const showLookupFake = sinon.fake.resolves(lookupReturn);
    sinon.replace(factory, "showLookup", showLookupFake);
    const note1 = await createNote({
      fname: "foo.one",
      vault: vaults[0],
      wsRoot,
      noWrite: true,
    });
    const note2 = await createNote({
      fname: "foo.one",
      vault: vaults[1],
      wsRoot,
      noWrite: true,
    });
    mockEngine.queryNotesMeta.resolves([]);
    mockEngine.findNotesMeta.resolves([note1, note2]);
    const windowSpy = sinon.spy(window, "showErrorMessage");
    const moveNoteCmd = new MoveNoteCmd(
      vaults,
      mockNoteProvider,
      mockEngine,
      factory,
      wsRoot
    );

    const result = await moveNoteCmd.run({ closeAndOpenFile: false });
    const errorMsg = windowSpy.getCall(0).args[0];
    assert(
      errorMsg ===
        "No available vaults for moving note. Each vault already has a note with filename foo.one"
    );
    assert(result.changed.length === 0);
  });
  test("WHEN no items selected to move THEN result should be an empty array", async () => {
    const mockNoteProvider = stubInterface<ILookupProvider>();
    const mockEngine = stubInterface<ReducedDEngine>();
    const wsRoot = vscode.Uri.file("tmp");
    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
    } as unknown as LookupController;
    const vaults = getVaults();
    const lookupReturn = {};

    const showLookupFake = sinon.fake.resolves(lookupReturn);
    sinon.replace(factory, "showLookup", showLookupFake);
    const moveNoteCmd = new MoveNoteCmd(
      vaults,
      mockNoteProvider,
      mockEngine,
      factory,
      wsRoot
    );
    const result = await moveNoteCmd.run({ closeAndOpenFile: false });
    assert(result.changed.length === 0);
  });
});
