import { DVault, NoteProps } from "@dendronhq/common-all";
import assert from "assert";
import { container } from "tsyringe";
import { DendronEngineV3Web } from "../../../engine/DendronEngineV3Web";
import { setupTestEngineContainer } from "../../helpers/setupTestEngineContainer";

async function initializeTest() {
  await setupTestEngineContainer();

  const engine = container.resolve(DendronEngineV3Web);

  await engine.init();
  return engine;
}

suite("GIVEN renderNote is run", () => {
  test("WHEN a basic note is rendered THEN the right HTML is returned", async () => {
    const engine = await initializeTest();

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

    const result = await engine.renderNote({ id: "foo", note: testNote });
    assert.strictEqual(
      result.data,
      '<h1 id="foo">foo</h1>\n<p>this is the body</p>'
    );
  });

  test("WHEN a wikilink is rendered THEN the HTML contains the proper link info", async () => {
    const engine = await initializeTest();

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
      body: "[[bar]]",
      vault,
    } as NoteProps;

    const result = await engine.renderNote({ id: "foo", note: testNote });
    assert(result.data?.includes(`<a href="bar.html">Bar</a>`));
  });
});
