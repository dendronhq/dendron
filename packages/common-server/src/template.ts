import {
  ConfigUtils,
  DendronError,
  DEngineClient,
  DVault,
  NoteProps,
  parseDendronURI,
  RespV3,
  SchemaUtils,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import Handlebars, { HelperOptions } from "handlebars";
import _ from "lodash";

type TemplateFunctionProps = {
  templateNote: NoteProps;
  targetNote: NoteProps;
};

interface DendronHandlebarsHelpers extends HelperOptions {
  data: {
    root: NoteProps & {
      FNAME: string;
    };
  };
}

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
  const CURRENT_DAY_OF_WEEK = currentDate.toJSDate().getDay();
  return {
    CURRENT_YEAR,
    CURRENT_MONTH,
    CURRENT_WEEK,
    CURRENT_DAY,
    CURRENT_HOUR,
    CURRENT_MINUTE,
    CURRENT_SECOND,
    CURRENT_DAY_OF_WEEK,
    FNAME: targetNote.fname,
    DESC: targetNote.desc,
  };
}

let _INIT_HELPERS = false;

class TemplateHelpers {
  static init() {
    _.map(this.helpers, (v, k) => {
      Handlebars.registerHelper(k, v);
    });
  }

  /**
   * WARNING: these helpers are part of the public template api
   * any changes in these names will result in a breaking change
   * and needs to be marked as such
   */
  static helpers = {
    eq: (a: any, b: any) => {
      return a === b;
    },

    fnameToDate: (
      patternOrOptions: string | DendronHandlebarsHelpers,
      options?: DendronHandlebarsHelpers
    ) => {
      let pattern = "(?<year>[\\d]{4}).(?<month>[\\d]{2}).(?<day>[\\d]{2})";
      let fname;
      if (_.isString(patternOrOptions)) {
        pattern = patternOrOptions;
        fname = options!.data.root.FNAME;
      } else {
        fname = patternOrOptions.data.root.FNAME;
      }

      const resp = fname.match(new RegExp(pattern, "i"))?.groups;
      if (_.isUndefined(resp)) {
        return "ERROR: no match found for {year}, {month}, or {day}";
      }
      const { year, month, day } = resp;
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10)
      );
    },

    getDayOfWeek: (date: Date) => {
      const day = date.getDay();
      return day;
    },
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

  /**
   * Apply template note to provided {@param note}.
   *
   * Changes include appending template note's body to end of provided note.
   */
  static applyTemplate(opts: {
    templateNote: NoteProps;
    targetNote: NoteProps;
    engine: DEngineClient;
  }): NoteProps {
    if (!_INIT_HELPERS) {
      TemplateHelpers.init();
      _INIT_HELPERS = true;
    }
    if (ConfigUtils.getWorkspace(opts.engine.config).enableHandlebarTemplates) {
      return this.applyHBTemplate(opts);
    } else {
      return this.applyLodashTemplate(opts);
    }
  }

  /**
   * Given a note that has a schema:
   *  - Find template note specified by schema
   *  - If there are no template notes found, return false
   *  - If multiple templates notes are found, apply callback `pickNote` to list of notes
   *  - Apply template note returned by callback to note and return true if applied successfully
   * If note does not have a schema, return false
   *
   * @param note: note to apply template to. This modifies the note body
   * @returns boolean of whether template has been applied or not
   */
  static async findAndApplyTemplate({
    note,
    engine,
    pickNote,
  }: {
    note: NoteProps;
    engine: DEngineClient;
    pickNote: (choices: NoteProps[]) => Promise<RespV3<NoteProps | undefined>>;
  }): Promise<RespV3<boolean>> {
    const maybeSchema = SchemaUtils.getSchemaFromNote({
      note,
      engine,
    });

    const maybeTemplate =
      maybeSchema?.schemas[note.schema?.schemaId as string].data.template;
    let maybeVault: DVault | undefined;

    if (maybeTemplate) {
      // Support xvault template
      const { link: fname, vaultName } = parseDendronURI(maybeTemplate?.id);

      // If vault is specified, lookup by template id + vault
      if (!_.isUndefined(vaultName)) {
        maybeVault = VaultUtils.getVaultByName({
          vname: vaultName,
          vaults: engine.vaults,
        });
        // If vault is not found, skip lookup through rest of notes and return error
        if (_.isUndefined(maybeVault)) {
          return {
            error: new DendronError({
              message: `No vault found for ${vaultName}`,
            }),
          };
        }
      }

      const maybeNotes = await engine.findNotes({ fname, vault: maybeVault });
      const maybeTemplateNote = await pickNote(maybeNotes);
      if (maybeTemplateNote.error) {
        return { error: maybeTemplateNote.error };
      }
      if (maybeTemplateNote.data) {
        TemplateUtils.applyTemplate({
          templateNote: maybeTemplateNote.data,
          targetNote: note,
          engine,
        });
        return { data: true };
      }
    }
    return { data: false };
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
    return targetNote;
  }

  static genTrackPayload(templateNote: NoteProps) {
    const fnameToDate =
      templateNote.body.match(/\{\{\s+fnameToDate[^}]+\}\}/)?.length || 0;
    const eq = templateNote.body.match(/\{\{\s+eq[^}]+\}\}/)?.length || 0;
    const getDayOfWeek =
      templateNote.body.match(/\{\{\s+getDayOfWeek[^}]+\}\}/)?.length || 0;
    return {
      helperStats: {
        fnameToDate,
        eq,
        getDayOfWeek,
      },
    };
  }
}
