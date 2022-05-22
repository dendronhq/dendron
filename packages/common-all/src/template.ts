import _ from "lodash";
import { Time } from "./time";
import { DEngineClient, NoteProps } from "./types";
import { ConfigUtils } from "./utils";

export class TemplateUtils {
  /** The props of a template note that will get copied over when the template is applied. */
  static TEMPLATE_COPY_PROPS: readonly (keyof NoteProps)[] = [
    "desc",
    "custom",
    "color",
    "tags",
    "image",
  ];
  // static getTemplate({
  //   fname,
  //   vault,
  //   engine,
  // }: {
  //   fname: string;
  //   vault?: DVault;
  //   engine: DEngine;
  // }): NoteProps {
  // 	// if vault is specified, we have everything we need to get a note
  //   if (vault) {
  //     const maybeNotes = NoteUtils.getNoteByFnameFromEngine({
  //       fname,
  //       vault,
  //       engine,
  //     });
  // 		return maybeNotes;
  //   }
  // }

  /**
   * Apply template note to provided {@param note}.
   *
   * Changes include appending template note's body to end of provided note.
   */
  static applyTemplate(opts: {
    templateNote: NoteProps;
    note: NoteProps;
    engine: DEngineClient;
  }) {
    if (ConfigUtils.getWorkspace(opts.engine.config).enableHandlebarTemplates) {
      return this.applyHBTemplate(opts);
    } else {
      return this.applyLodashTemplate(opts);
    }
  }

  static applyHBTemplate(opts: {
    templateNote: NoteProps;
    note: NoteProps;
    engine: DEngineClient;
  }) {
    return;
  }

  static applyLodashTemplate(opts: {
    templateNote: NoteProps;
    note: NoteProps;
    engine: DEngineClient;
  }) {
    const { templateNote, note } = opts;
    if (templateNote.type === "note") {
      const tempNoteProps = _.pick(templateNote, this.TEMPLATE_COPY_PROPS);
      _.forEach(tempNoteProps, (v, k) => {
        // @ts-ignore
        note[k] = v;
      });
      // If note body exists, append template's body instead of overriding
      if (note.body) {
        note.body += `\n${templateNote.body}`;
      } else {
        note.body = templateNote.body;
      }

      // Apply date variable substitution to the body based on lodash interpolate delimiter if applicable
      // E.g. if template has <%= CURRENT_YEAR %>, new note will contain 2021
      const currentDate = Time.now();

      note.body = note.body.replace(
        /<%=\s*CURRENT_YEAR\s*%>/g,
        currentDate.toFormat("yyyy")
      );
      note.body = note.body.replace(
        /<%=\s*CURRENT_MONTH\s*%>/g,
        currentDate.toFormat("LL")
      );
      note.body = note.body.replace(
        /<%=\s*CURRENT_WEEK\s*%>/g,
        currentDate.toFormat("WW")
      );
      note.body = note.body.replace(
        /<%=\s*CURRENT_DAY\s*%>/g,
        currentDate.toFormat("dd")
      );
      note.body = note.body.replace(
        /<%=\s*CURRENT_HOUR\s*%>/g,
        currentDate.toFormat("HH")
      );
      note.body = note.body.replace(
        /<%=\s*CURRENT_MINUTE\s*%>/g,
        currentDate.toFormat("mm")
      );
      note.body = note.body.replace(
        /<%=\s*CURRENT_SECOND\s*%>/g,
        currentDate.toFormat("ss")
      );

      return true;
    }
    return false;
  }
}
