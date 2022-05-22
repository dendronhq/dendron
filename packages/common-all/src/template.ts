import Handlebars from "handlebars";
import _ from "lodash";
import { Time } from "./time";
import { DEngineClient, NoteProps } from "./types";
import { ConfigUtils } from "./utils";

type TemplateFunctionProps = {
  templateNote: NoteProps;
  targetNote: NoteProps;
};

function copyTemplateProps({
  templateNote,
  targetNote,
}: TemplateFunctionProps) {
  const tempNoteProps = _.pick(templateNote, TemplateUtils.TEMPLATE_COPY_PROPS);
  _.forEach(tempNoteProps, (v, k) => {
    // @ts-ignore
    targetNote[k] = v;
  });
  return targetNote;
}

function addOrAppendTemplateBody({
  targetNote,
  templateBody,
}: {
  templateBody: string;
  targetNote: NoteProps;
}) {
  if (targetNote.body) {
    targetNote.body += `\n${templateBody}`;
  } else {
    targetNote.body = templateBody;
  }
  return targetNote;
}

function genDefaultContext(targetNote: NoteProps) {
  const currentDate = Time.now();
  const CURRENT_YEAR = currentDate.toFormat("yyyy");
  const CURRENT_MONTH = currentDate.toFormat("LL");
  const CURRENT_WEEK = currentDate.toFormat("WW");
  const CURRENT_DAY = currentDate.toFormat("dd");
  const CURRENT_HOUR = currentDate.toFormat("HH");
  const CURRENT_MINUTE = currentDate.toFormat("mm");
  const CURRENT_SECOND = currentDate.toFormat("ss");
  return {
    CURRENT_YEAR,
    CURRENT_MONTH,
    CURRENT_WEEK,
    CURRENT_DAY,
    CURRENT_HOUR,
    CURRENT_MINUTE,
    CURRENT_SECOND,
    FNAME: targetNote.fname,
    DESC: targetNote.desc,
  };
}

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
    targetNote: NoteProps;
    engine: DEngineClient;
  }) {
    if (ConfigUtils.getWorkspace(opts.engine.config).enableHandlebarTemplates) {
      return this.applyHBTemplate(opts);
    } else {
      return this.applyLodashTemplate(opts);
    }
  }

  static applyHBTemplate({
    templateNote,
    targetNote,
  }: {
    templateNote: NoteProps;
    targetNote: NoteProps;
    engine: DEngineClient;
  }) {
    copyTemplateProps({ templateNote, targetNote });
    // TODO: cache tempaltes
    const template = Handlebars.compile(templateNote.body);
    const context = genDefaultContext(targetNote);
    const templateBody = template({
      ...targetNote,
      fm: targetNote.custom,
      ...context,
    });
    addOrAppendTemplateBody({ templateBody, targetNote });
    return targetNote;
  }

  // @deprecate
  static applyLodashTemplate(opts: {
    templateNote: NoteProps;
    targetNote: NoteProps;
    engine: DEngineClient;
  }) {
    const { templateNote, targetNote } = opts;
    if (templateNote.type === "note") {
      copyTemplateProps({ templateNote, targetNote });
      // If note body exists, append template's body instead of overriding
      addOrAppendTemplateBody({
        templateBody: templateNote.body,
        targetNote,
      });

      // Apply date variable substitution to the body based on lodash interpolate delimiter if applicable
      // E.g. if template has <%= CURRENT_YEAR %>, new note will contain 2021
      const currentDate = Time.now();

      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_YEAR\s*%>/g,
        currentDate.toFormat("yyyy")
      );
      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_MONTH\s*%>/g,
        currentDate.toFormat("LL")
      );
      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_WEEK\s*%>/g,
        currentDate.toFormat("WW")
      );
      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_DAY\s*%>/g,
        currentDate.toFormat("dd")
      );
      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_HOUR\s*%>/g,
        currentDate.toFormat("HH")
      );
      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_MINUTE\s*%>/g,
        currentDate.toFormat("mm")
      );
      targetNote.body = targetNote.body.replace(
        /<%=\s*CURRENT_SECOND\s*%>/g,
        currentDate.toFormat("ss")
      );

      return true;
    }
    return false;
  }
}
