import { DEngineClient, DVault } from "@dendronhq/common-all";
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
  NOTE_REF: `![[dendron.pro.dendron-next-server#quickstart,1:#*]]`,
  NOTE_REF_TARGET_BODY: "# Header1\nbody1\n# \nbody2",
};

type CreateNoteFactoryOpts = Omit<CreateNoteOptsV4, "vault" | "wsRoot"> & {
  selection?: [number, number, number, number];
};
const SIMPLE_SELECTION: [number, number, number, number] = [7, 0, 7, 12];

export const CreateNoteFactory = (opts: CreateNoteFactoryOpts) => {
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

  const createWithEngineFunc = ({
    vault,
    wsRoot,
    genRandomId,
    noWrite,
    body,
    fname,
    props,
    engine,
  }: CreateNotePresetOptsV4 & { engine: DEngineClient }) => {
    const _opts: CreateNoteOptsV4 & { engine: DEngineClient } = {
      ...opts,
      vault,
      wsRoot,
      genRandomId,
      noWrite,
      engine,
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
    return NoteTestUtilsV4.createNoteWithEngine(_opts);
  };

  return {
    create: func,
    createWithEngine: createWithEngineFunc,
    fname: opts.fname,
    selection: opts.selection || SIMPLE_SELECTION,
    body: opts.body,
  };
};

// presets are documented in [[Presets|dendron://dendron.docs/pkg.common-test-utils.ref.presets]] for easy refeerence
export const NOTE_PRESETS_V4 = {
  NOTE_EMPTY: CreateNoteFactory({ fname: "empty", body: "" }),
  /**
   * fname: foo
   * body: foo body
   */
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
    custom: {
      bond: 42,
    },
  }),
  NOTE_DOMAIN_NAMESPACE: CreateNoteFactory({ fname: "pro" }),
  NOTE_DOMAIN_NAMESPACE_CHILD: CreateNoteFactory({
    fname: "pro.foo",
    body: "pro.foo.body",
  }),
  // START CHANGE
  /**
   *  ^5xetq2e7t2z4
   * fname: alpha
   * body: [[beta]]
   */
  NOTE_WITH_TARGET: CreateNoteFactory({ fname: "alpha", body: "[[beta]]" }),
  /**
   *  fname: beta
   *  body: [[alpha]]
   */
  NOTE_WITH_LINK: CreateNoteFactory({ fname: "beta", body: "[[alpha]]" }),
  NOTE_WITH_LINK_CANDIDATE_TARGET: CreateNoteFactory({
    fname: "gamma",
    body: "alpha",
  }),
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
  NOTE_WITH_BLOCK_ANCHOR_TARGET: CreateNoteFactory({
    fname: "anchor-target",
    body: [
      "Lorem ipsum dolor amet",
      "Maiores exercitationem officiis adipisci voluptate",
      "",
      "^block-id",
      "",
      "Alias eos velit aspernatur",
    ].join("\n"),
  }),
  NOTE_WITH_CAPS_AND_SPACE: CreateNoteFactory({
    fname: "000 Index.md",
    body: "[[alpha]]",
  }),
  NOTE_WITH_FM_VARIABLES: CreateNoteFactory({
    fname: "fm-variables",
    body: "Title is {{ fm.title }}",
  }),
  NOTE_WITH_FM_TAG: CreateNoteFactory({
    fname: "fm-tag",
    props: {
      tags: "foo",
    },
    body: "",
  }),
  //  ^ar2re45pswxu
  NOTE_WITH_NOTE_REF_SIMPLE: CreateNoteFactory({
    fname: "simple-note-ref",
    body: "![[simple-note-ref.one]]",
  }),
  // ^zp9pa2jancj0
  NOTE_WITH_NOTE_REF_SIMPLE_TARGET: CreateNoteFactory({
    fname: "simple-note-ref.one",
    body: ["# Header ", "body text"].join("\n"),
  }),
  NOTE_WITH_BLOCK_REF_SIMPLE: CreateNoteFactory({
    fname: "simple-block-ref",
    body: "![[simple-block-ref.one#intro]]",
  }),
  NOTE_WITH_BLOCK_RANGE_REF_SIMPLE: CreateNoteFactory({
    fname: "simple-block-range-ref",
    body: "![[simple-block-range-ref.one#head1:#head3]]",
  }),
  NOTE_WITH_REF_OFFSET: CreateNoteFactory({
    fname: "ref-offset",
    body: "![[ref-offset.one#head1,1]]",
  }),
  NOTE_WITH_WILDCARD_CHILD_REF: CreateNoteFactory({
    fname: "wildcard-child-ref",
    body: "![[wildcard-child-ref.*]]",
  }),
  NOTE_WITH_WILDCARD_HEADER_REF: CreateNoteFactory({
    fname: "wildcard-header-ref",
    body: "![[wildcard-header-ref.one#head1:#*]]",
  }),
  NOTE_WITH_WILDCARD_COMPLEX: CreateNoteFactory({
    fname: "wildcard-complex-ref",
    body: "![[wildcard-complex.*#head1,1]]",
  }),
  NOTE_WITH_NOTE_REF_TARGET: CreateNoteFactory({
    fname: "alpha",
    body: NOTE_BODY_PRESETS_V4.NOTE_REF_TARGET_BODY,
  }),
  NOTE_WITH_NOTE_REF_LINK: CreateNoteFactory({
    fname: "beta",
    body: "![[alpha]]",
  }),
  NOTE_WITH_WIKILINK_SIMPLE: CreateNoteFactory({
    fname: "simple-wikilink",
    body: "[[simple-wikilink.one]]",
  }),
  NOTE_WITH_WIKILINK_SIMPLE_TARGET: CreateNoteFactory({
    fname: "simple-wikilink.one",
    body: ["# Header ", "body text"].join("\n"),
  }),
  NOTE_WITH_WIKILINK_TOP_HIERARCHY: CreateNoteFactory({
    fname: "wikilink-top-hierarchy",
    body: "[[wikilink-top-hierarchy-target]]",
  }),
  NOTE_WITH_WIKILINK_TOP_HIERARCHY_TARGET: CreateNoteFactory({
    fname: "wikilink-top-hierarchy-target",
    body: ["# Header ", "body text"].join("\n"),
  }),
  NOTE_WITH_USERTAG: CreateNoteFactory({
    fname: "usertag",
    body: "@johndoe",
  }),
  NOTE_WITH_TAG: CreateNoteFactory({
    fname: "footag",
    body: "#foobar",
  }),
  NOTE_WITH_LOWER_CASE_TITLE: CreateNoteFactory({
    fname: "aaron",
    body: "aaron",
    props: {
      title: "aaron",
    },
  }),
  NOTE_WITH_UPPER_CASE_TITLE: CreateNoteFactory({
    fname: "aardvark",
    body: "aardvark",
    props: {
      title: "Aardvark",
    },
  }),
  NOTE_WITH_UNDERSCORE_TITLE: CreateNoteFactory({
    fname: "_underscore",
    body: "underscore",
  }),
};
