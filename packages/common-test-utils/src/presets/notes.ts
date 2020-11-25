import {
  DNodeUtilsV2,
  DVault,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  CreateNoteOptsV4,
  CreateSchemaOptsV4,
  NoteTestUtilsV3,
  NoteTestUtilsV4,
} from "../noteUtils";

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
  noWrite?: boolean;
  body?: string;
  props?: CreateNoteOptsV4["props"];
};

type CreateSchemaPresetOptsV4 = {
  wsRoot: string;
  vault: DVault;
  genRandomId?: boolean;
  fname?: string;
  noWrite?: boolean;
  modifier?: (schema: SchemaModulePropsV2) => SchemaModulePropsV2;
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

export const NOTE_BODY_PRESETS_V4 = {
  NOTE_REF: `((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))`,
};

type CreateNoteFactoryOpts = Omit<CreateNoteOptsV4, "vault" | "wsRoot">;
type CreateSchemaFactoryOpts = Omit<CreateSchemaOptsV4, "vault" | "wsRoot">;

const CreateNoteFactory = (opts: CreateNoteFactoryOpts) => {
  const func = ({
    vault,
    wsRoot,
    genRandomId,
    noWrite,
    body,
    props,
  }: CreateNotePresetOptsV4) => {
    const _opts: CreateNoteOptsV4 = {
      ...opts,
      vault,
      wsRoot,
      genRandomId,
      noWrite,
    };
    if (!_.isUndefined(body)) {
      _opts.body = body;
    }
    if (!_.isUndefined(props)) {
      _opts.props = props;
    }
    return NoteTestUtilsV4.createNote(_opts);
  };
  return { create: func, fname: opts.fname };
};

const CreateSchemaFactory = (opts: CreateSchemaFactoryOpts) => {
  const func = ({ vault, wsRoot, noWrite }: CreateSchemaPresetOptsV4) => {
    const _opts: CreateSchemaOptsV4 = {
      ...opts,
      vault,
      wsRoot,
      noWrite,
    };
    return NoteTestUtilsV4.createSchema(_opts);
  };
  return { create: func, fname: opts.fname };
};

export const SCHEMA_PRESETS_V4 = {
  SCHEMA_SIMPLE: CreateSchemaFactory({
    fname: "foo",
    modifier: (schema) => {
      const vault = schema.root.vault;
      const child = SchemaUtilsV2.create({ id: "ch1", vault });
      schema.schemas["ch1"] = child;
      DNodeUtilsV2.addChild(schema.root, child);
      return schema;
    },
  }),
};
export const NOTE_PRESETS_V4 = {
  NOTE_SIMPLE: CreateNoteFactory({ fname: "foo", body: "foo body" }),
  NOTE_SIMPLE_OTHER: CreateNoteFactory({ fname: "bar", body: "bar body" }),
  NOTE_SIMPLE_CHILD: CreateNoteFactory({
    fname: "foo.ch1",
    body: "foo.ch1 body",
  }),
  NOTE_WITH_CUSTOM_ATT: CreateNoteFactory({
    fname: "foo",
    props: {
      custom: {
        bond: 42,
      },
    },
  }),
  // START CHANGE
  NOTE_WITH_TARGET: CreateNoteFactory({ fname: "alpha", body: "[[beta]]" }),
  NOTE_WITH_LINK: CreateNoteFactory({ fname: "beta", body: "[[alpha]]" }),
  NOTE_WITH_ALIAS_LINK: CreateNoteFactory({
    fname: "beta",
    body: "[[some label|alpha]]",
  }),
  NOTE_WITH_ANCHOR_TARGET: CreateNoteFactory({
    fname: "alpha",
    body: [`# H1`, `# H2 ^8a`, `# H3`, "", "Some Content"].join("\n"),
  }),
  NOTE_WITH_ANCHOR_LINK: CreateNoteFactory({
    fname: "beta",
    body: `[[alpha#h3]]`,
  }),
  NOTE_WITH_CAPS_AND_SPACE: CreateNoteFactory({
    fname: "000 Index.md",
    body: "[[alpha]]",
  }),
  NOTE_WITH_NOTE_REF: CreateNoteFactory({
    fname: "foo",
    body:
      "[[foo]]\n((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))",
  }),
};
