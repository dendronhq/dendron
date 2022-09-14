import { DVault, NoteUtils, ReducedDEngine } from "@dendronhq/common-all";
import assert from "assert";
import sinon, { stubInterface } from "ts-sinon";
import * as vscode from "vscode";
import { DummyTelemetryClient } from "../../../../telemetry/common/DummyTelemetryClient";
import { CopyNoteURLCmd } from "../../../commands/CopyNoteURLCmd";
import { SiteUtilsWeb } from "../../../utils/SiteUtilsWeb";
import { WSUtilsWeb } from "../../../utils/WSUtils";

require("mocha/mocha");

const getTestPublishingConfig = ({
  siteUrl = "https://foo.com",
  assetsPrefix = "/testing",
  siteIndex = "root",
  enablePrettyLinks = true,
}) => {
  return {
    siteUrl,
    assetsPrefix,
    siteIndex,
    enablePrettyLinks,
  };
};

suite("GIVEN a CopyNoteURLCmd", () => {
  const wsRoot = vscode.Uri.file("tmp");
  const mockEngine = stubInterface<ReducedDEngine>();
  const vault: DVault[] = [
    {
      selfContained: true,
      fsPath: "path",
    },
  ];
  const foo = NoteUtils.create({ fname: "foo", vault: vault[0] });
  test("WHEN assetPrefix is provided, THEN link must have assetsPrefix", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({});
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const vaultStub = sinon
      .stub(wsUtils, "getVaultFromDocument")
      .returns(vault[0]);
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(
      wsUtils,
      new DummyTelemetryClient(),
      siteUtils
    );
    const activeTextEditorStub = sinon
      .stub(cmd, "getActiveTextEditor")
      .returns("fakeEditor");
    const link = await cmd.run();
    assert(link?.startsWith("https://foo.com/testing/notes/"));
    vaultStub.restore();
    NoteStub.restore();
    activeTextEditorStub.restore();
  });

  test("WHEN assetPrefix is not provided, THEN link must not have assetsPrefix", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ assetsPrefix: "" });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const vaultStub = sinon
      .stub(wsUtils, "getVaultFromDocument")
      .returns(vault[0]);
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(
      wsUtils,
      new DummyTelemetryClient(),
      siteUtils
    );
    const activeTextEditorStub = sinon
      .stub(cmd, "getActiveTextEditor")
      .returns("fakeEditor");
    const link = await cmd.run();
    assert(link?.startsWith("https://foo.com/notes/"));
    vaultStub.restore();
    NoteStub.restore();
    activeTextEditorStub.restore();
  });

  test("WHEN enablePrettylinks is set to false, THEN link must have .html", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: false });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const vaultStub = sinon
      .stub(wsUtils, "getVaultFromDocument")
      .returns(vault[0]);
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(
      wsUtils,
      new DummyTelemetryClient(),
      siteUtils
    );
    const activeTextEditorStub = sinon
      .stub(cmd, "getActiveTextEditor")
      .returns("fakeEditor");
    const link = await cmd.run();
    assert(link?.includes(".html"));
    vaultStub.restore();
    NoteStub.restore();
    activeTextEditorStub.restore();
  });
  test("WHEN enablePrettylinks is set to true, THEN link must not have .html", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: true });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const vaultStub = sinon
      .stub(wsUtils, "getVaultFromDocument")
      .returns(vault[0]);
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(
      wsUtils,
      new DummyTelemetryClient(),
      siteUtils
    );
    const activeTextEditorStub = sinon
      .stub(cmd, "getActiveTextEditor")
      .returns("fakeEditor");
    const link = await cmd.run();
    assert.strictEqual(link?.indexOf(".html"), -1);
    vaultStub.restore();
    NoteStub.restore();
    activeTextEditorStub.restore();
  });
  test("WHEN command is called on root note THEN note id should not be present", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({});
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    foo.fname = "root";
    const vaultStub = sinon
      .stub(wsUtils, "getVaultFromDocument")
      .returns(vault[0]);
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(
      wsUtils,
      new DummyTelemetryClient(),
      siteUtils
    );
    const activeTextEditorStub = sinon
      .stub(cmd, "getActiveTextEditor")
      .returns("fakeEditor");
    const link = await cmd.run();
    assert.strictEqual(link, "https://foo.com");
    vaultStub.restore();
    NoteStub.restore();
    activeTextEditorStub.restore();
  });
});
