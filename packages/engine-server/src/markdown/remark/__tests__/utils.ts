import { WorkspaceOpts } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";

export const basicSetup = async ({ wsRoot, vaults }: WorkspaceOpts) => {
  await NoteTestUtilsV4.createNote({
    wsRoot,
    fname: "foo",
    body: "foo body",
    vault: vaults[0],
    props: { id: "foo-id" },
  });
};
