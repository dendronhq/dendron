import {
  AssertUtils,
  NoteTestUtilsV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import { ENGINE_HOOKS } from "./utils";

const NOTES = {
  BASIC: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.renderNote({
        id: "foo",
      });
      return [
        {
          actual: true,
          expected: await AssertUtils.assertInString({
            body: data!,
            match: ["<p>foo body</p>"],
          }),
          msg: "foo",
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        return ENGINE_HOOKS.setupBasic(opts);
      },
    }
  ),
  EMPTY_NOTE: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.renderNote({
        id: "empty",
      });
      expect(data).toMatchSnapshot();
      return [
        {
          actual: true,
          expected: await AssertUtils.assertInString({
            body: data!,
            match: [`<h1 id="empty">Empty</h1>`],
          }),
          msg: "empty string",
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        return NoteTestUtilsV4.createNote({
          ...opts,
          fname: "empty",
          vault: opts.vaults[0],
        });
      },
    }
  ),
  CUSTOM_FM: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.renderNote({
        id: "fm",
      });
      expect(data).toMatchSnapshot();
      return [
        {
          actual: true,
          expected: await AssertUtils.assertInString({
            body: data!,
            match: [`<p>egg</p>`, `<p>title: Fm</p>`],
          }),
          msg: "custom fm render",
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        return NoteTestUtilsV4.createNote({
          ...opts,
          fname: "fm",
          custom: {
            foo: "egg",
          },
          vault: opts.vaults[0],
          body: "{{ fm.foo }}\n\ntitle: {{ fm.title }}",
        });
      },
    }
  ),
  NOTE_REF_TO_TASK_NOTE: new TestPresetEntryV4(
    async ({ engine }) => {
      const { data } = await engine.renderNote({
        id: "alpha-id",
      });
      return [
        {
          actual: true,
          expected: await AssertUtils.assertInString({
            body: data!,
            match: [
              `<li><a href="task-note-id"><input type="checkbox" disabled class="task-before task-status" checked>Task Note</a></li>`,
            ],
          }),
          msg: "custom fm render",
        },
      ];
    },
    {
      preSetupHook: async (opts) => {
        await NoteTestUtilsV4.createNote({
          fname: "alpha",
          body: "- [[task-note]]",
          vault: opts.vaults[0],
          wsRoot: opts.wsRoot,
          props: { id: "alpha-id" },
        });
        await NoteTestUtilsV4.createNote({
          fname: "beta",
          body: "![[alpha]]",
          vault: opts.vaults[0],
          wsRoot: opts.wsRoot,
        });
        await NoteTestUtilsV4.createNote({
          fname: "task-note",
          body: "",
          custom: {
            status: "done",
          },
          vault: opts.vaults[0],
          wsRoot: opts.wsRoot,
          props: { id: "task-note-id" },
        });
      },
    }
  ),
};

export const ENGINE_RENDER_PRESETS = {
  NOTES,
};
