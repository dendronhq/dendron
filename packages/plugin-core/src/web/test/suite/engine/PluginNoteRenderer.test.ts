import {
  DendronPublishingConfig,
  DVault,
  NoteProps,
  DNodeType,
  StrictConfigV5,
} from "@dendronhq/common-all";
import { PluginNoteRenderer } from "../../../engine/PluginNoteRenderer";

suite("GIVEN a PluginNoteRenderer", () => {
  test("WHEN render is called THEN the right HTML is returned", async () => {
    const pubConfig: DendronPublishingConfig = {
      copyAssets: false,
      siteHierarchies: [],
      enableSiteLastModified: false,
      siteRootDir: "",
      enableFrontmatterTags: false,
      enableHashesForFMTags: false,
      writeStubs: false,
      seo: {
        title: undefined,
        description: undefined,
        author: undefined,
        twitter: undefined,
        image: undefined,
      },
      github: {
        cname: undefined,
        enableEditLink: false,
        editLinkText: undefined,
        editBranch: undefined,
        editViewMode: undefined,
        editRepository: undefined,
      },
      enablePrettyLinks: false,
    };

    const config: StrictConfigV5 = {
      version: 5,
      publishing: pubConfig,
    } as StrictConfigV5;

    const renderer = new PluginNoteRenderer(config);

    const vault: DVault = {
      fsPath: "foo",
    };

    const testNote: NoteProps = {
      fname: "foo",
      id: "foo",
      title: "foo",
      desc: "foo",
      links: [],
      anchors: {},
      type: "note",
      updated: 1,
      created: 1,
      parent: "root",
      children: [],
      data: "test_data",
      body: "this is the body",
      vault,
    } as NoteProps;

    const result = await renderer.renderNote({ id: "foo", note: testNote });
    console.log(result);
  });
});
