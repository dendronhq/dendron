import {
  APIUtils,
  DendronAPI,
  DendronError,
  DVault,
  NoteProps,
  NoteUtils,
  RenderNotePayload,
} from "@dendronhq/common-all";
import { createServer, runEngineTestV5 } from "../../engine";
import { ENGINE_HOOKS } from "../../presets";

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
  describe(`WHEN calling /render on non existent file`, () => {
    let rendered: { data: RenderNotePayload; error: DendronError | null };

    beforeAll(async () => {
      await runEngineTestV5(
        async ({ wsRoot, vaults }) => {
          const api = await getApiWithInitializedWS(wsRoot, vaults);

          rendered = await api.noteRender({
            ws: wsRoot,
            id: `i-dont-exist-id`,
          });
        },
        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });

    it(`THEN data in payload is undefined`, () => {
      expect(rendered.data).toBeUndefined();
    });

    it(`THEN error to be defined`, () => {
      expect(rendered.error).toBeDefined();
    });
  });

  describe(`WHEN calling /render on valid file`, () => {
    const EXPECTED_FOO_RENDERED =
      '<h1 id="foo">Foo</h1>\n<p>foo body</p>\n<hr>\n<strong>Children</strong>\n<ol>\n<li><a href="foo.ch1">Ch1</a></li>\n</ol>';

    let renderFoo: () => Promise<{
      data: RenderNotePayload;
      error: DendronError | null;
    }>;
    let updateFoo: (noteUpdateValues: any) => Promise<void>;

    beforeAll(async () => {
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

          renderFoo = async () => {
            return await api.noteRender({
              ws: wsRoot,
              id: fooNote.id,
            });
          };

          updateFoo = async (noteUpdateValues: any) => {
            // Modify the value of foo
            await api.engineUpdateNote({
              ws: wsRoot,
              opts: { newNode: false },
              note: {
                ...fooNote,
                updated: fooNote.updated + 1,
                ...noteUpdateValues,
              },
            });
          };
        },

        { expect, preSetupHook: ENGINE_HOOKS.setupBasic }
      );
    });

    it(`THEN data has expected rendered HTML.`, async () => {
      expect((await renderFoo()).data).toEqual(EXPECTED_FOO_RENDERED);
    });

    it(`THEN error is null.`, async () => {
      expect((await renderFoo()).error).toBeNull();
    });

    describe(`AND body is updated`, () => {
      beforeAll(async () => {
        await updateFoo({ body: "updated-body-val" });
      });

      it(`THEN old body content is NOT present in rendered note.`, async () => {
        expect(!(await renderFoo()).data!.includes("foo body")).toBeTruthy();
      });

      it(`THEN updated body content is present in rendered note.`, async () => {
        expect(
          (await renderFoo()).data!.includes("updated-body-val")
        ).toBeTruthy();
      });
    });
  });

  describe(`GIVEN notes with recursive reference relationship: foo-->![[foo.one]]-->![[foo.two]]`, () => {
    let fooNote: NoteProps;
    let fooTwo: NoteProps;
    let api: DendronAPI;
    let wsRoot: string;
    beforeAll(async () => {
      await runEngineTestV5(
        async ({ wsRoot: _wsRoot, vaults, engine }) => {
          wsRoot = _wsRoot;
          const notes = engine.notes;
          const vault1 = vaults[0];

          fooNote = NoteUtils.getNoteByFnameV5({
            fname: "foo",
            notes,
            vault: vault1,
            wsRoot,
          }) as NoteProps;

          fooTwo = NoteUtils.getNoteByFnameV5({
            fname: "foo.two",
            notes,
            vault: vault1,
            wsRoot,
          }) as NoteProps;

          api = await getApiWithInitializedWS(wsRoot, vaults);
        },
        { expect, preSetupHook: ENGINE_HOOKS.setupNoteRefRecursive }
      );
    });

    describe(`WHEN top level foo is rendered`, () => {
      let rendered: { data: RenderNotePayload; error: DendronError | null };

      beforeAll(async () => {
        rendered = await api.noteRender({
          ws: wsRoot,
          id: fooNote.id,
        });
      });

      it(`THEN it should be error free`, () => {
        expect(rendered.error).toBeNull();
      });

      it(`THEN it should contain content from nested foo.two`, () => {
        // From second level reference foo.two contains 'blah' in its body
        // prior to making any updates 'blah' should be rendered within our top level foo note.
        expect(rendered.data?.includes("blah")).toBeTruthy();
      });
    });

    describe(`WHEN foo.two is updated AND foo is rendered`, () => {
      let rendered: { data: RenderNotePayload; error: DendronError | null };

      beforeAll(async () => {
        // Modify the value of foo-two
        await api.engineUpdateNote({
          ws: wsRoot,
          opts: { newNode: false },
          note: {
            ...fooTwo,
            updated: 2,
            body: "modified-val",
          },
        });

        rendered = await api.noteRender({
          ws: wsRoot,
          id: fooNote.id,
        });
      });

      it(`THEN rendered should be error free`, () => {
        expect(rendered.error).toBeNull();
      });

      it(`THEN rendered to not contain previous foo.two value`, () => {
        // Now that we have modified foo.two it should not contain blah anymore
        expect(rendered.data?.includes("blah")).toBeFalsy();
      });

      it(`THEN rendered foo to contain newly modified value from foo.two.`, () => {
        expect(rendered.data?.includes("modified-val")).toBeTruthy();
      });
    });
  });
});
