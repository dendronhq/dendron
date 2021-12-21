import { describe, it, beforeEach, afterEach } from "mocha";
import {
  extractHeaderAnchorIfExists,
  extractNoteIdFromHref,
  getNavigationTargetNoteForWikiLink,
  handleLink,
  LinkType,
  ShowPreviewAssetOpener,
  ShowPreviewNoteUtil,
} from "../../commands/ShowPreview";
import { TestNoteFactory } from "@dendronhq/common-test-utils";
import path from "path";
import { NoteProps } from "@dendronhq/common-all";
import sinon from "sinon";
import { expect } from "../testUtilsv2";
import { QuickPickUtil } from "../../utils/quickPick";

suite("ShowPreview utility methods", () => {
  describe(`handleLink`, () => {
    describe(`LinkType.ASSET`, () => {
      describe(`WHEN valid href`, () => {
        let assetOpenerStub: any;
        let fooNote: NoteProps;

        beforeEach(async () => {
          const factory = TestNoteFactory.defaultUnitTestFactory();

          fooNote = await factory.createForFName("foo");

          sinon.stub(ShowPreviewNoteUtil, "getNoteById").returns(fooNote);
          assetOpenerStub = sinon.stub(
            ShowPreviewAssetOpener,
            "openWithDefaultApp"
          );
        });

        afterEach(() => {
          sinon.restore();
        });

        it(`WHEN called with valid href THEN open asset with default app.`, async () => {
          await handleLink({
            wsRoot: TestNoteFactory.DEFAULT_WS_ROOT,
            linkType: LinkType.ASSET,
            data: {
              href: "vscode-webview://e380a62c-2dea-46a8-ae1e-a34868c9719e/assets/dummy-pdf.pdf",
              id: "foo-id",
            },
          });

          const expected = path.join(
            TestNoteFactory.DEFAULT_VAULT.fsPath,
            "assets/dummy-pdf.pdf"
          );

          expect(assetOpenerStub.calledWith(expected)).toBeTruthy();
        });
      });
    });
  });

  describe(`getNavigationTargetNoteForWikiLink tests:`, () => {
    const factory = TestNoteFactory.defaultUnitTestFactory();

    it("WHEN href is missing THEN throw", async () => {
      await expect(() =>
        getNavigationTargetNoteForWikiLink({
          data: {},
          notes: factory.toNotePropsDict([]),
        })
      ).toThrow("href is missing");
    });

    it("WHEN note can be found by id THEN grab note by id", async () => {
      const note = await factory.createForFName("foo");
      note.id = "id-val-1";
      const dict = factory.toNotePropsDict([note]);

      const actual = await getNavigationTargetNoteForWikiLink({
        data: {
          href: `vscode-webview://25d7783e-df29-479c-9838-386c17dbf9b6/id-val-1`,
        },
        notes: dict,
      });

      expect(actual.note).toEqual(note);
      expect(actual.anchor).toEqual(undefined);
    });

    it("WHEN note can be found by id with anchor THEN grab note by id and specify anchor", async () => {
      const note = await factory.createForFName("foo");
      note.id = "id-val-1";
      const dict = factory.toNotePropsDict([note]);

      const actual = await getNavigationTargetNoteForWikiLink({
        data: {
          href: `vscode-webview://25d7783e-df29-479c-9838-386c17dbf9b6/id-val-1#anch-val-1`,
        },
        notes: dict,
      });

      expect(actual.note).toEqual(note);
      expect(actual.anchor).toEqual({
        type: "header",
        value: "anch-val-1",
        depth: 1,
      });
    });

    it("WHEN note in different vault without vault specified THEN prompt user to choose a note", async () => {
      const note1 = await factory.createForFName("other-vault-foo");
      note1.vault = { fsPath: `/tmp/note1vault` };
      note1.created = 2;
      const notes = [];
      notes.push(note1);

      const note2 = await factory.createForFName("other-vault-foo");
      note2.vault = { fsPath: `/tmp/note2Vault` };
      note2.created = 1;
      notes.push(note2);

      sinon
        .stub(QuickPickUtil, "showChooseNote")
        .returns(Promise.resolve(note2));

      const dict = factory.toNotePropsDict(notes);

      const noteData = await getNavigationTargetNoteForWikiLink({
        data: {
          href: `vscode-webview://25d7783e-df29-479c-9838-386c17dbf9b6/other-vault-foo`,
        },
        notes: dict,
      });

      expect(noteData.note).toEqual(note2);
      expect(noteData.anchor).toEqual(undefined);
    });
  });

  describe(`extractHeaderAnchorIfExists`, () => {
    it("WHEN anchor exists THEN return it", () => {
      const anchor = extractHeaderAnchorIfExists(
        "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo#heading-2"
      );
      expect(anchor?.value).toEqual("heading-2");
      expect(anchor?.type).toEqual("header");
    });

    it(`WHEN anchor does NOT exist THEN return undefined`, () => {
      expect(
        extractHeaderAnchorIfExists(
          "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/foo"
        )
      ).toEqual(undefined);
    });
  });

  describe(`extractNoteIdFromHref`, () => {
    describe(`WHEN id is present`, () => {
      it("AND with header anchor THEN extract id", () => {
        const actual = extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0#heading-2",
        });

        expect(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
      });

      it("AND without the header anchor THEN extract id", () => {
        const actual = extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/FSi3bKWQeQXYTjE1PoTB0",
        });

        expect(actual).toEqual("FSi3bKWQeQXYTjE1PoTB0");
      });

      it("AND is guid like", () => {
        // This shouldnt typically happen with the way we currently generate ids but we do
        // have some guid like ids in our test workspace right now so to make those
        // notes happy, and in case some older id generation used guid looking identifers.

        const actual = extractNoteIdFromHref({
          id: "id1",
          href: "vscode-webview://4e98b9cf-41d8-49eb-b458-fcfda32c6c01/56497553-c195-4ec8-bc74-6a76462d9333",
        });

        expect(actual).toEqual("56497553-c195-4ec8-bc74-6a76462d9333");
      });
    });

    it(`WHEN id not present in href THEN default onto passed in id`, () => {
      const actual = extractNoteIdFromHref({
        id: "id1",
        href: "http://localhost:3005/vscode/note-preview.html?ws=WS-VALUE&port=3005#head2",
      });
      expect(actual).toEqual("id1");
    });
  });
});
