import { CopyNoteURLCmd } from "../../../commands/CopyNoteURLCmd";
import * as vscode from "vscode";
import { SiteUtilsWeb } from "../../../utils/site";
import { WSUtilsWeb } from "../../../utils/WSUtils";
import { DVault, NoteUtils, ReducedDEngine } from "@dendronhq/common-all";
import sinon, { stubInterface } from "ts-sinon";
import assert from "assert";

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
  const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
  const vaultStub = sinon
    .stub(wsUtils, "getVaultFromDocument")
    .returns(vault[0]);
  test("WHEN assetPrefix is provided, THEN link must have assetsPrefix", async () => {
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({});
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert(link?.startsWith("https://foo.com/testing/notes/"));
    NoteStub.restore();
  });

  test("WHEN assetPrefix is not provided, THEN link must not have assetsPrefix", async () => {
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ assetsPrefix: "" });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert(link?.startsWith("https://foo.com/notes/"));
    NoteStub.restore();
  });

  test("WHEN enablePrettylinks is set to false, THEN link must have .html", async () => {
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: false });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert(link?.includes(".html"));
    NoteStub.restore();
  });

  test("WHEN enablePrettylinks is set to false, THEN link must have .html", async () => {
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: false });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert(link?.includes(".html"));
    NoteStub.restore();
  });
  test("WHEN enablePrettylinks is set to true, THEN link must not have .html", async () => {
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: true });
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert.strictEqual(link?.indexOf(".html"), -1);
    NoteStub.restore();
  });
  test("WHEN command is called on root note THEN note id should not be present", async () => {
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({});
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    foo.fname = "root";
    const NoteStub = sinon.stub(wsUtils, "getNoteFromDocument").resolves([foo]);
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert.strictEqual(link, "https://foo.com");
    vaultStub.restore();
    NoteStub.restore();
  });
});
