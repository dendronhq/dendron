import { APIUtils, DendronAPI, DVault } from "@dendronhq/common-all";
import { createServer, runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";
import { NoteProps, NoteUtils } from "@dendronhq/common-all/src";

async function getApiWithInitializedWS(wsRoot: string, vaults: DVault[]) {
  const { port } = await createServer({ wsRoot, vaults });
  const api = new DendronAPI({
    endpoint: APIUtils.getLocalEndpoint(port),
    apiPath: "api",
  });

  await api.workspaceInit({
    uri: wsRoot,
    config: {
      vaults,
    },
  });

  return api;
}

describe("api/note/render tests", () => {
  test("WHEN calling /render on non existent file THEN get payload with error.", async () => {
    await runEngineTestV5(
      async ({ wsRoot, vaults }) => {
        const api = await getApiWithInitializedWS(wsRoot, vaults);

        const rendered = await api.noteRender({
          ws: wsRoot,
          id: `i-dont-exist-id`,
        });

        expect(rendered.data).toBeUndefined();
        expect(rendered.error).toBeDefined();
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });

  test("WHEN calling /render on valid file THEN get rendered preview.", async () => {
    const EXPECTED_FOO_RENDERED =
      '<h1 id="foo">Foo</h1>\n<p>foo body</p>\n<hr>\n<h2 id="children">Children</h2>\n<ol>\n<li><a href="foo.ch1.html">Ch1</a></li>\n</ol>';

    await runEngineTestV5(
      async ({ wsRoot, vaults, engine }) => {
        const notes = engine.notes;
        const vault1 = vaults[0];

        const fooNote = NoteUtils.getNoteByFnameV5({
          fname: "foo",
          notes,
          vault: vault1,
          wsRoot,
        }) as NoteProps;

        const api = await getApiWithInitializedWS(wsRoot, vaults);

        const rendered = await api.noteRender({
          ws: wsRoot,
          id: fooNote.id,
        });

        expect(rendered.error).toBeNull();
        expect(rendered.data).toEqual(EXPECTED_FOO_RENDERED);
      },
      { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
    );
  });
});
