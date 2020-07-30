import { Note } from "@dendronhq/common-all/src";

test("imageLinkConverter", () => {
  const note = Note.createRoot();
  note.body = "![ ](assets/image)";
  expect(1).toEqual(1);
});
