import {
  DVault,
  NoteQuickInputV2,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import assert from "assert";
import sinon from "sinon";
import { stubInterface } from "ts-sinon";
import * as vscode from "vscode";
import { DummyTelemetryClient } from "../../../../telemetry/common/DummyTelemetryClient";
import { ILookupProvider } from "../../../commands/lookup/ILookupProvider";
import {
  LookupAcceptPayload,
  LookupController,
} from "../../../commands/lookup/LookupController";
import { NoteLookupCmd } from "../../../commands/NoteLookupCmd";
import { getConfig } from "../../helpers/setupTestEngineContainer";

require("mocha/mocha");

suite("GIVEN a NoteLookupCmd", () => {
  test("WHEN the user selects nothing THEN nothing is written to the engine", async () => {
    const wsRoot = vscode.Uri.file("tmp");

    const config = getConfig();
    const mockNoteProvider = stubInterface<ILookupProvider>();

    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
    } as unknown as LookupController;

    const showLookupFake = sinon.fake.resolves(undefined);
    sinon.replace(factory, "showLookup", showLookupFake);

    const showTextDocumentFake = sinon.fake.resolves(undefined);
    sinon.replace(vscode.window, "showTextDocument", showTextDocumentFake);

    const mockEngine = stubInterface<ReducedDEngine>();

    const cmd = new NoteLookupCmd(
      factory,
      wsRoot,
      mockEngine,
      mockNoteProvider,
      new DummyTelemetryClient(),
      config
    );

    await cmd.run();

    assert.strictEqual(showLookupFake.callCount, 1);
    assert.strictEqual(mockEngine.writeNote.callCount, 0);
    assert.strictEqual(showTextDocumentFake.callCount, 0);

    sinon.restore();
  });

  test("WHEN the user selects a note THEN that note is opened", async () => {
    const wsRoot = vscode.Uri.file("tmp");
    const config = getConfig();
    const mockNoteProvider = stubInterface<ILookupProvider>();

    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
    } as unknown as LookupController;

    const vault: DVault = {
      selfContained: true,
      fsPath: "path",
    };
    const lookupReturn: LookupAcceptPayload = {
      items: [{ fname: "foo", vault } as NoteQuickInputV2],
    };

    const showLookupFake = sinon.fake.resolves(lookupReturn);
    sinon.replace(factory, "showLookup", showLookupFake);

    const openTextDocumentFake = sinon.fake.resolves(undefined);
    sinon.replace(vscode.workspace, "openTextDocument", openTextDocumentFake);

    const showTextDocumentFake = sinon.fake.resolves(undefined);
    sinon.replace(vscode.window, "showTextDocument", showTextDocumentFake);

    const mockEngine = stubInterface<ReducedDEngine>();

    const cmd = new NoteLookupCmd(
      factory,
      wsRoot,
      mockEngine,
      mockNoteProvider,
      new DummyTelemetryClient(),
      config
    );

    await cmd.run();

    assert.strictEqual(showLookupFake.callCount, 1);
    assert.strictEqual(mockEngine.writeNote.callCount, 0);
    assert.strictEqual(openTextDocumentFake.callCount, 1);
    assert.strictEqual(showTextDocumentFake.callCount, 1);

    sinon.restore();
  });

  test("WHEN Create New is selected THEN a new note is written", async () => {
    const wsRoot = vscode.Uri.file("tmp");
    const config = getConfig();
    const mockNoteProvider = stubInterface<ILookupProvider>();

    const factory = {
      showLookup: () => {
        return Promise.resolve(0);
      },
      isJournalButtonPressed: () => false,
    } as unknown as LookupController;

    const vault: DVault = {
      selfContained: true,
      fsPath: "path",
    };
    const lookupReturn: LookupAcceptPayload = {
      items: [{ fname: "foo", vault, label: "Create New" } as NoteQuickInputV2],
    };

    const showLookupFake = sinon.fake.resolves(lookupReturn);
    sinon.replace(factory, "showLookup", showLookupFake);
    const openTextDocumentFake = sinon.fake.resolves(undefined);
    sinon.replace(vscode.workspace, "openTextDocument", openTextDocumentFake);

    const showTextDocumentFake = sinon.fake.resolves(undefined);
    sinon.replace(vscode.window, "showTextDocument", showTextDocumentFake);

    const mockEngine = stubInterface<ReducedDEngine>();

    mockEngine.writeNote.resolves({ data: [] });

    const cmd = new NoteLookupCmd(
      factory,
      wsRoot,
      mockEngine,
      mockNoteProvider,
      new DummyTelemetryClient(),
      config
    );

    await cmd.run();

    assert.strictEqual(showLookupFake.callCount, 1);
    assert.strictEqual(mockEngine.writeNote.callCount, 1);
    assert.strictEqual(
      openTextDocumentFake.callCount,
      1,
      "OpenTextDocument called once"
    );
    assert.strictEqual(
      showTextDocumentFake.callCount,
      1,
      "ShowTextDocument called once"
    );

    sinon.restore();
  });
});
