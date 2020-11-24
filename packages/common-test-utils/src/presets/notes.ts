import { DVault } from "@dendronhq/common-all";
import { NoteTestUtilsV3, NoteTestUtilsV4 } from "../noteUtils";

// type CreateNoteFunc = ({ vault }: { vault: DVault }) => Promise<NotePropsV2>;
type CreateNotePresetOpts = {
  vault: DVault;
  genRandomId?: boolean;
  fname?: string;
};

type CreateNotePresetOptsV4 = {
  wsRoot: string;
  vault: DVault;
  genRandomId?: boolean;
  fname?: string;
};

export const NOTE_PRESETS = {
  NOTE_WITH_TARGET: async ({
    vault,
    genRandomId,
    fname,
  }: CreateNotePresetOpts) => {
    return await NoteTestUtilsV3.createNote({
      fname: fname || "alpha",
      vault,
      body: "[[beta]]",
      genRandomId,
    });
  },
  NOTE_WITH_LINK: async ({ vault }: CreateNotePresetOpts) => {
    return await NoteTestUtilsV3.createNote({
      fname: "beta",
      vault,
      body: "[[alpha]]",
    });
  },
  NOTE_WITH_ALIAS_LINK: async ({ vault }: CreateNotePresetOpts) => {
    return await NoteTestUtilsV3.createNote({
      fname: "beta",
      vault,
      body: "[[some label|alpha]]",
    });
  },
  NOTE_WITH_ANCHOR_TARGET: async ({ vault }: CreateNotePresetOpts) => {
    return await NoteTestUtilsV3.createNote({
      vault,
      fname: "alpha",
      body: [`# H1`, `# H2 ^8a`, `# H3`, "", "Some Content"].join("\n"),
    });
  },
  NOTE_WITH_ANCHOR_LINK: async ({ vault }: CreateNotePresetOpts) => {
    return await NoteTestUtilsV3.createNote({
      vault,
      fname: "beta",
      body: `[[alpha#h3]]`,
    });
  },
};

export const NOTE_PRESETS_V4 = {
  NOTE_WITH_TARGET: async ({
    vault,
    genRandomId,
    fname,
    wsRoot,
  }: CreateNotePresetOptsV4) => {
    return await NoteTestUtilsV4.createNote({
      fname: fname || "alpha",
      wsRoot,
      vault,
      body: "[[beta]]",
      genRandomId,
    });
  },
  NOTE_WITH_LINK: async ({ vault, wsRoot }: CreateNotePresetOptsV4) => {
    return await NoteTestUtilsV4.createNote({
      wsRoot,
      fname: "beta",
      vault,
      body: "[[alpha]]",
    });
  },
  NOTE_WITH_ALIAS_LINK: async ({ vault, wsRoot }: CreateNotePresetOptsV4) => {
    return await NoteTestUtilsV4.createNote({
      wsRoot,
      fname: "beta",
      vault,
      body: "[[some label|alpha]]",
    });
  },
  NOTE_WITH_ANCHOR_TARGET: async ({
    vault,
    wsRoot,
  }: CreateNotePresetOptsV4) => {
    return await NoteTestUtilsV4.createNote({
      wsRoot,
      vault,
      fname: "alpha",
      body: [`# H1`, `# H2 ^8a`, `# H3`, "", "Some Content"].join("\n"),
    });
  },
  NOTE_WITH_ANCHOR_LINK: async ({ vault, wsRoot }: CreateNotePresetOptsV4) => {
    return await NoteTestUtilsV4.createNote({
      wsRoot,
      vault,
      fname: "beta",
      body: `[[alpha#h3]]`,
    });
  },
};
