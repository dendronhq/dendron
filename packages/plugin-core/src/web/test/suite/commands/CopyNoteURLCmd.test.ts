import { CopyNoteURLCmd } from "../../../commands/CopyNoteURLCmd";
import * as vscode from "vscode";
import { SiteUtilsWeb } from "../../../utils/SiteUtilsWeb";
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
  test("WHEN assetPrefix is provided, THEN link must have assetsPrefix", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);
    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({});
    const fakeVault = sinon.fake.resolves(vault[0]);
    sinon.replace(wsUtils, "getVaultFromDocument", fakeVault);
    const fakeNote = sinon.fake.resolves([foo]);
    sinon.replace(wsUtils, "getNoteFromDocument", fakeNote);

    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    console.log("link@@@@@@@@@@@@@@@1", link);
    assert(link?.startsWith("https://foo.com/testing/notes/"));
    sinon.restore();
  });

  test("WHEN assetPrefix is not provided, THEN link must not have assetsPrefix", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);

    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ assetsPrefix: "" });
    const fakeVault = sinon.fake.resolves(vault[0]);
    sinon.replace(wsUtils, "getVaultFromDocument", fakeVault);
    const fakeNote = sinon.fake.resolves([foo]);
    sinon.replace(wsUtils, "getNoteFromDocument", fakeNote);
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    console.log("link@@@@@@@@@@@@@@@2", link);

    assert(link?.startsWith("https://foo.com/notes/"));
    sinon.restore();
  });

  test("WHEN enablePrettylinks is set to false, THEN link must have .html", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);

    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: false });
    const fakeVault = sinon.fake.resolves(vault[0]);
    sinon.replace(wsUtils, "getVaultFromDocument", fakeVault);
    const fakeNote = sinon.fake.resolves([foo]);
    sinon.replace(wsUtils, "getNoteFromDocument", fakeNote);
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    console.log("link@@@@@@@@@@@@@@@3", link);

    assert(link?.includes(".html"));
    sinon.restore();
  });
  test("WHEN enablePrettylinks is set to true, THEN link must not have .html", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);

    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({ enablePrettyLinks: true });
    const fakeVault = sinon.fake.resolves(vault[0]);
    sinon.replace(wsUtils, "getVaultFromDocument", fakeVault);
    const fakeNote = sinon.fake.resolves([foo]);
    sinon.replace(wsUtils, "getNoteFromDocument", fakeNote);
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    console.log("link@@@@@@@@@@@@@@@4", link);

    assert.strictEqual(link?.indexOf(".html"), -1);
    sinon.restore();
  });
  test("WHEN command is called on root note THEN note id should not be present", async () => {
    const wsUtils = new WSUtilsWeb(mockEngine, wsRoot, vault);

    const { siteUrl, assetsPrefix, siteIndex, enablePrettyLinks } =
      getTestPublishingConfig({});
    foo.fname = "root";

    const fakeVault = sinon.fake.resolves(vault[0]);
    sinon.replace(wsUtils, "getVaultFromDocument", fakeVault);
    const fakeNote = sinon.fake.resolves([foo]);
    sinon.replace(wsUtils, "getNoteFromDocument", fakeNote);
    const siteUtils = new SiteUtilsWeb(
      siteUrl,
      siteIndex,
      assetsPrefix,
      enablePrettyLinks
    );
    const cmd = new CopyNoteURLCmd(wsUtils, siteUtils);
    const link = await cmd.run();
    assert.strictEqual(link, "https://foo.com");
    console.log("link@@@@@@@@@@@@@@@5", link);
    sinon.restore();
  });
});
