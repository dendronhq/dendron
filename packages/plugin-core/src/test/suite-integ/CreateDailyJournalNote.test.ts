import { ConfigUtils, DVault, Time } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { MetadataService } from "@dendronhq/engine-server";
import { ENGINE_HOOKS } from "@dendronhq/engine-test-utils";
import _ from "lodash";
import { beforeEach } from "mocha";
import sinon from "sinon";
import { CreateDailyJournalCommand } from "../../commands/CreateDailyJournal";
import { PickerUtilsV2 } from "../../components/lookup/utils";
import { CONFIG } from "../../constants";
import { ExtensionProvider } from "../../ExtensionProvider";
import { expect, getNoteFromTextEditor } from "../testUtilsv2";
import { describeMultiWS, EditorUtils } from "../testUtilsV3";

const stubVaultPick = (vaults: DVault[]) => {
  const vault = _.find(vaults, { fsPath: vaults[2].fsPath });
  sinon.stub(PickerUtilsV2, "promptVault").returns(Promise.resolve(vault));
  sinon
    .stub(PickerUtilsV2, "getOrPromptVaultForNewNote")
    .returns(Promise.resolve(vault));
  return vault;
};

/**
 * These tests can timeout otherwise
 * eg. https://github.com/dendronhq/dendron/runs/6942599059?check_suite_focus=true
 */
const timeout = 5e3;

suite("Create Daily Journal Suite", function () {
  const TEMPLATE_BODY = "test daily template";

  beforeEach(() => {
    MetadataService.instance().deleteMeta("firstDailyJournalTime");
    MetadataService.instance().setInitialInstall(
      Time.DateTime.fromISO("2022-06-30").toSeconds()
    );
  });

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then daily journal with template applied.", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);
        const metadataService = MetadataService.instance();
        expect(metadataService.getMeta().firstDailyJournalTime).toBeFalsy();

        await cmd.run();
        expect(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema.fname === "dendron.daily").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and DAILY JOURNAL has already been run before",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then default template and schema is not created", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);
        const metadataService = MetadataService.instance();
        metadataService.setFirstDailyJournalTime();
        expect(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();

        await cmd.run();
        expect(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is NOT applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeFalsy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is NOT created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema).toBeFalsy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and first install is before 5/31/22",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then default template and schema is not created", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);
        const metadataService = MetadataService.instance();
        metadataService.setInitialInstall(
          Time.DateTime.fromISO("2022-04-30").toSeconds()
        );
        expect(metadataService.getMeta().firstDailyJournalTime).toBeFalsy();

        await cmd.run();
        expect(metadataService.getMeta().firstDailyJournalTime).toBeTruthy();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is NOT applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeFalsy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is NOT created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema).toBeFalsy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and dailyVault set",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
      modConfigCb: (config) => {
        ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", false);
        ConfigUtils.setJournalProps(config, "dailyVault", "vault2");
        return config;
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then daily journal is created in daily vault with template applied.", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);

        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema.fname === "dendron.daily").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();

        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            engine.vaults[1].fsPath
          )
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and dailyVault set with lookup Confirm",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
      modConfigCb: (config) => {
        ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
        ConfigUtils.setJournalProps(config, "dailyVault", "vault1");
        return config;
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then daily journal is created in daily vault with template is applied.", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);

        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema.fname === "dendron.daily").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();

        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            engine.vaults[0].fsPath
          )
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and dailyVault not set with lookup Confirm",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
      modConfigCb: (config) => {
        ConfigUtils.setNoteLookupProps(config, "confirmVaultOnCreate", true);
        return config;
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then daily journal is created in daily vault with template applied.", async () => {
        const ext = ExtensionProvider.getExtension();
        const { vaults, engine } = ExtensionProvider.getDWorkspace();
        stubVaultPick(vaults);
        const cmd = new CreateDailyJournalCommand(ext);

        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema.fname === "dendron.daily").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();

        expect(
          (await EditorUtils.getURIForActiveEditor()).fsPath.includes(
            engine.vaults[2].fsPath
          )
        ).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and dailyDomain set",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".bar",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
      modConfigCb: (config) => {
        ConfigUtils.setJournalProps(config, "dailyDomain", "bar");
        return config;
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then daily journal is created with right domain and with template applied.", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);

        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        expect(activeNote.fname.startsWith("bar.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("bar")).data!;
        expect(dailySchema.fname === "dendron.bar").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note and deprecated config",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daisy",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
      wsSettingsOverride: {
        settings: {
          [CONFIG.DEFAULT_JOURNAL_DATE_FORMAT.key]: "'q'q",
          [CONFIG.DEFAULT_JOURNAL_ADD_BEHAVIOR.key]: "childOfCurrent",
          [CONFIG.DAILY_JOURNAL_DOMAIN.key]: "daisy",
          [CONFIG.DEFAULT_JOURNAL_NAME.key]: "journey",
        },
      },
      modConfigCb: (config) => {
        ConfigUtils.setJournalProps(config, "dateFormat", "dd");
        ConfigUtils.setJournalProps(config, "dailyDomain", "daisy");
        ConfigUtils.setJournalProps(config, "name", "journey");
        return config;
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed, then deprecated config is ignored.", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);

        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        expect(activeNote.fname).toEqual(`daisy.journey.${dd}`);
        // TODO: Enable when/if we support applying templates to journals with configured dateFormat
        //expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daisy")).data!;
        expect(dailySchema.fname === "dendron.daisy").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();
      });
    }
  );

  describeMultiWS(
    "GIVEN a basic workspace with a daily journal template note",
    {
      preSetupHook: ENGINE_HOOKS.setupBasic,
      timeout,
      preActivateHook: async ({ wsRoot, vaults }) => {
        await NoteTestUtilsV4.createNote({
          fname: CreateDailyJournalCommand.DENDRON_TEMPLATES_FNAME + ".daily",
          wsRoot,
          vault: vaults[0],
          body: TEMPLATE_BODY,
        });
      },
    },
    () => {
      test("WHEN CreateDailyJournalCommand is executed multiple times, then template and schema are not generated again", async () => {
        const ext = ExtensionProvider.getExtension();
        const cmd = new CreateDailyJournalCommand(ext);

        await cmd.run();
        const activeNote = getNoteFromTextEditor();
        // Verify template body is applied
        expect(activeNote.fname.startsWith("daily.journal")).toBeTruthy();
        expect(activeNote.body.includes(TEMPLATE_BODY)).toBeTruthy();

        // Verify trait is applied
        const traits = (activeNote as any).traitIds;
        expect(traits.length === 1 && traits[0] === "journalNote").toBeTruthy();

        // Verify schema is created
        const engine = ExtensionProvider.getEngine();
        const dailySchema = (await engine.getSchema("daily")).data!;
        expect(dailySchema.fname === "dendron.daily").toBeTruthy();
        expect(_.size(dailySchema.schemas) === 5).toBeTruthy();
        const numNotesBefore = (
          await engine.findNotesMeta({ excludeStub: true })
        ).length;
        const numSchemasBefore = _.size((await engine.querySchema("*")).data);
        await cmd.run();
        expect(numNotesBefore).toEqual(
          (await engine.findNotesMeta({ excludeStub: true })).length
        );
        expect(numSchemasBefore).toEqual(
          _.size((await engine.querySchema("*")).data)
        );
      });
    }
  );
});
