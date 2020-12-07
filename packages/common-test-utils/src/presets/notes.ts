import { DVault } from "@dendronhq/common-all";
import _ from "lodash";
import { CreateNoteOptsV4, NoteTestUtilsV4 } from "../noteUtils";

type CreateNotePresetOptsV4 = {
  wsRoot: string;
  vault: DVault;
  genRandomId?: boolean;
  fname?: string;
  noWrite?: boolean;
  body?: string;
  props?: CreateNoteOptsV4["props"];
};

export const NOTE_BODY_PRESETS_V4 = {
  NOTE_REF: `((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))`,
  NOTE_REF_TARGET_BODY: "# Header1\nbody1\n# \nbody2",
};

type CreateNoteFactoryOpts = Omit<CreateNoteOptsV4, "vault" | "wsRoot"> & {
  selection?: [number, number, number, number];
};
const SIMPLE_SELECTION: [number, number, number, number] = [7, 0, 7, 12];

const CreateNoteFactory = (opts: CreateNoteFactoryOpts) => {
  const func = ({
    vault,
    wsRoot,
    genRandomId,
    noWrite,
    body,
    fname,
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
    if (!_.isUndefined(fname)) {
      _opts.fname = fname;
    }
    return NoteTestUtilsV4.createNote(_opts);
  };
  return {
    create: func,
    fname: opts.fname,
    selection: opts.selection || SIMPLE_SELECTION,
  };
};

export const NOTE_PRESETS_V4 = {
  NOTE_SIMPLE: CreateNoteFactory({ fname: "foo", body: "foo body" }),
  NOTE_SIMPLE_OTHER: CreateNoteFactory({ fname: "bar", body: "bar body" }),
  NOTE_SIMPLE_CHILD: CreateNoteFactory({
    fname: "foo.ch1",
    body: "foo.ch1 body",
  }),
  NOTE_SIMPLE_GRANDCHILD: CreateNoteFactory({
    fname: "foo.ch1.gch1",
    body: "foo.ch1.gch1 body",
  }),
  NOTE_WITH_CUSTOM_ATT: CreateNoteFactory({
    fname: "foo",
    props: {
      custom: {
        bond: 42,
      },
    },
  }),
  NOTE_DOMAIN_NAMESPACE: CreateNoteFactory({ fname: "pro" }),
  NOTE_DOMAIN_NAMESPACE_CHILD: CreateNoteFactory({
    fname: "pro.foo",
    body: "pro.foo.body",
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
  // TODO: deprecate
  NOTE_WITH_NOTE_REF: CreateNoteFactory({
    fname: "alpha",
    body:
      "[[foo]]\n((ref: [[dendron.pro.dendron-next-server]]#quickstart,1:#*))",
  }),
  NOTE_WITH_NOTE_REF_TARGET: CreateNoteFactory({
    fname: "alpha",
    body: NOTE_BODY_PRESETS_V4.NOTE_REF_TARGET_BODY,
  }),
  NOTE_WITH_NOTE_REF_LINK: CreateNoteFactory({
    fname: "beta",
    body: "((ref: [[alpha]]))",
  }),
};
